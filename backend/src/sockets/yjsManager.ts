import { EventEmitter } from 'events';
import * as Y from 'yjs';
import { FileNode } from '../models/FileNode';
import { AppError } from '../middleware/errorHandler';

export class YjsDocManager extends EventEmitter {
  private static instance: YjsDocManager;
  private docs = new Map<string, Y.Doc>();
  private loading = new Map<string, Promise<Y.Doc>>();
  private dirtyTimers = new Map<string, NodeJS.Timeout>();
  private writes = new Map<string, Promise<void>>();
  private readonly PERSIST_DEBOUNCE_MS = 1000;
  private constructor() { super(); }
  static getInstance(): YjsDocManager {
    if (!this.instance) this.instance = new YjsDocManager();
    return this.instance;
  }

  /** One initialization promise per file prevents peers receiving different seed documents. */
  async getOrCreateDoc(fileId: string, initialContent?: string): Promise<Y.Doc> {
    const existing = this.docs.get(fileId);
    if (existing) return existing;
    const pending = this.loading.get(fileId);
    if (pending) return pending;
    const load = (async () => {
      const file = await FileNode.findById(fileId);
      if (!file || file.type !== 'file') throw new AppError('File not found.', 404, 'FILE_NOT_FOUND');
      const doc = new Y.Doc();
      const content = initialContent ?? file.content ?? '';
      if (content) doc.getText('monaco').insert(0, content);
      doc.on('update', () => this.schedulePersistence(fileId));
      this.docs.set(fileId, doc);
      return doc;
    })();
    this.loading.set(fileId, load);
    try { return await load; } finally { this.loading.delete(fileId); }
  }
  hasDoc(fileId: string): boolean { return this.docs.has(fileId); }
  getTextContent(fileId: string): string { return this.docs.get(fileId)?.getText('monaco').toString() || ''; }
  async applyUpdate(fileId: string, update: Uint8Array): Promise<void> {
    Y.applyUpdate(await this.getOrCreateDoc(fileId), update, 'peer');
  }
  async encodeFullState(fileId: string): Promise<Uint8Array> { return Y.encodeStateAsUpdate(await this.getOrCreateDoc(fileId)); }

  /** Restore through the existing CRDT so connected peers receive the same deletions/inserts. */
  setDocContent(fileId: string, content: string): void {
    const doc = this.docs.get(fileId);
    if (!doc || doc.getText('monaco').toString() === content) return;
    doc.transact(() => {
      const text = doc.getText('monaco'); text.delete(0, text.length); text.insert(0, content);
    }, 'server-replace');
    this.emit('replaced', { fileId, state: Buffer.from(Y.encodeStateAsUpdate(doc)).toString('base64') });
  }
  private schedulePersistence(fileId: string): void {
    clearTimeout(this.dirtyTimers.get(fileId));
    const timer = setTimeout(() => {
      this.dirtyTimers.delete(fileId);
      void this.persistDocToDatabase(fileId).catch(() => this.emit('persistence_failed', { fileId }));
    }, this.PERSIST_DEBOUNCE_MS);
    timer.unref();
    this.dirtyTimers.set(fileId, timer);
  }
  async persistDocToDatabase(fileId: string): Promise<void> {
    const previous = this.writes.get(fileId) || Promise.resolve();
    const write = previous.catch(() => {}).then(async () => {
      const doc = this.docs.get(fileId);
      if (!doc) return;
      const content = doc.getText('monaco').toString();
      const updated = await FileNode.findByIdAndUpdate(fileId, { content, size: Buffer.byteLength(content, 'utf8') });
      if (!updated) throw new AppError('This file was deleted while saving.', 404, 'FILE_NOT_FOUND');
      this.emit('persisted', { fileId, content });
    });
    this.writes.set(fileId, write);
    try { await write; } finally { if (this.writes.get(fileId) === write) this.writes.delete(fileId); }
  }
  async flushAll(): Promise<void> {
    const dirtyIds = Array.from(this.dirtyTimers.keys());
    for (const timer of this.dirtyTimers.values()) clearTimeout(timer);
    this.dirtyTimers.clear();
    await Promise.all(dirtyIds.map(fileId => this.persistDocToDatabase(fileId)));
    await Promise.all(this.writes.values());
  }
  async removeDoc(fileId: string): Promise<void> {
    clearTimeout(this.dirtyTimers.get(fileId)); this.dirtyTimers.delete(fileId);
    await this.writes.get(fileId)?.catch(() => {});
    this.docs.get(fileId)?.destroy(); this.docs.delete(fileId);
  }
  async dispose(): Promise<void> {
    await this.flushAll();
    for (const doc of this.docs.values()) doc.destroy();
    this.docs.clear();
  }
}
