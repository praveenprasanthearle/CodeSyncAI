import * as Y from 'yjs';
import { FileNode } from '../models/FileNode';

export class YjsDocManager {
  private static instance: YjsDocManager;
  private docs: Map<string, Y.Doc> = new Map();
  private dirtyTimers: Map<string, NodeJS.Timeout> = new Map();
  private readonly PERSIST_DEBOUNCE_MS = 2500;

  private constructor() {}

  public static getInstance(): YjsDocManager {
    if (!YjsDocManager.instance) {
      YjsDocManager.instance = new YjsDocManager();
    }
    return YjsDocManager.instance;
  }

  /**
   * Get an existing in-memory Y.Doc or initialize one from MongoDB
   */
  public async getOrCreateDoc(fileId: string, initialContent?: string): Promise<Y.Doc> {
    if (this.docs.has(fileId)) {
      return this.docs.get(fileId)!;
    }

    let contentToSeed = initialContent;
    if (contentToSeed === undefined) {
      try {
        const fileNode = await FileNode.findById(fileId);
        contentToSeed = fileNode ? fileNode.content : '';
      } catch (_err) {
        contentToSeed = '';
      }
    }

    const doc = new Y.Doc();
    const yText = doc.getText('monaco');
    if (contentToSeed) {
      yText.insert(0, contentToSeed);
    }

    // Schedule debounced database persistence on local document mutations
    doc.on('update', () => {
      this.schedulePersistence(fileId);
    });

    this.docs.set(fileId, doc);
    return doc;
  }

  /**
   * Apply an incoming binary update from a peer client
   */
  public async applyUpdate(fileId: string, update: Uint8Array): Promise<void> {
    const doc = await this.getOrCreateDoc(fileId);
    Y.applyUpdate(doc, update);
  }

  /**
   * Encode the full document state as a binary update
   */
  public async encodeFullState(fileId: string): Promise<Uint8Array> {
    const doc = await this.getOrCreateDoc(fileId);
    return Y.encodeStateAsUpdate(doc);
  }

  /**
   * Get raw plain-text content from Y.Text('monaco')
   */
  public getTextContent(fileId: string): string {
    const doc = this.docs.get(fileId);
    if (!doc) return '';
    return doc.getText('monaco').toString();
  }

  /**
   * Set or overwrite Y.Text content
   */
  public setDocContent(fileId: string, content: string): void {
    if (this.docs.has(fileId)) {
      const doc = this.docs.get(fileId)!;
      const yText = doc.getText('monaco');
      yText.delete(0, yText.length);
      yText.insert(0, content);
    }
  }

  /**
   * Debounced persistence to MongoDB
   */
  private schedulePersistence(fileId: string): void {
    if (this.dirtyTimers.has(fileId)) {
      clearTimeout(this.dirtyTimers.get(fileId)!);
    }

    const timer = setTimeout(async () => {
      await this.persistDocToDatabase(fileId);
      this.dirtyTimers.delete(fileId);
    }, this.PERSIST_DEBOUNCE_MS);

    this.dirtyTimers.set(fileId, timer);
  }

  /**
   * Write Y.Text back to MongoDB FileNode
   */
  public async persistDocToDatabase(fileId: string): Promise<void> {
    const doc = this.docs.get(fileId);
    if (!doc) return;

    try {
      const content = doc.getText('monaco').toString();
      const size = Buffer.byteLength(content, 'utf8');

      await FileNode.findByIdAndUpdate(fileId, {
        content,
        size,
        updatedAt: new Date(),
      });
    } catch (err) {
      console.error(`[YjsDocManager] Failed to persist file ${fileId}:`, err);
    }
  }

  /**
   * Flush all dirty docs immediately (e.g. before shutdown or in test tear-down)
   */
  public async flushAll(): Promise<void> {
    const promises: Promise<void>[] = [];
    for (const [fileId, timer] of this.dirtyTimers.entries()) {
      clearTimeout(timer);
      promises.push(this.persistDocToDatabase(fileId));
    }
    this.dirtyTimers.clear();
    await Promise.all(promises);
  }
}
