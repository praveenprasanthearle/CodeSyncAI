import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as Y from 'yjs';

const mock = vi.hoisted(() => ({ io: vi.fn() }));
vi.mock('socket.io-client', () => ({ io: mock.io }));
import { useCollaborationStore } from '../stores/collaborationStore';
import { useFileStore } from '../stores/fileStore';

class FakeSocket {
  connected = true; id = 'client-one';
  handlers = new Map<string, Set<(...args: any[]) => void>>();
  sent: { event: string; data: any }[] = [];
  on(event: string, callback: (...args: any[]) => void) { if (!this.handlers.has(event)) this.handlers.set(event, new Set()); this.handlers.get(event)!.add(callback); return this; }
  off(event: string, callback: (...args: any[]) => void) { this.handlers.get(event)?.delete(callback); return this; }
  trigger(event: string, data?: any) { this.handlers.get(event)?.forEach(callback => callback(data)); }
  timeout() { return this; }
  emit(event: string, data: any, ack?: (...args: any[]) => void) { this.sent.push({ event, data }); ack?.(null, { ok: true }); return this; }
  disconnect() { this.connected = false; this.trigger('disconnect'); }
  connect() { this.connected = true; this.trigger('connect'); return this; }
}
const encode = (doc: Y.Doc) => Buffer.from(Y.encodeStateAsUpdate(doc)).toString('base64');
describe('Client CRDT protocol', () => {
  let socket: FakeSocket, server: Y.Doc;
  beforeEach(() => {
    useCollaborationStore.getState().clearState(); useFileStore.getState().clearState();
    socket = new FakeSocket(); mock.io.mockReset().mockReturnValue(socket); server = new Y.Doc(); server.getText('monaco').insert(0, 'seed');
  });
  afterEach(() => { useCollaborationStore.getState().clearState(); server.destroy(); });
  const join = async () => {
    useCollaborationStore.getState().joinWorkspace('project');
    await useCollaborationStore.getState().joinFileCRDT('file');
    socket.trigger('crdt:initial_state', { fileId: 'file', state: encode(server) });
  };
  it('reuses a connecting socket rather than creating duplicates', () => {
    socket.connected = false;
    const first = useCollaborationStore.getState().connectSocket();
    expect(useCollaborationStore.getState().connectSocket()).toBe(first); expect(mock.io).toHaveBeenCalledTimes(1);
  });
  it('does not echo server initialization or remote updates', async () => {
    await join();
    expect(socket.sent.filter(item => item.event === 'crdt:update')).toHaveLength(0);
    server.getText('monaco').insert(4, ' remote');
    socket.trigger('crdt:update', { fileId: 'file', update: encode(server), senderSocketId: 'other-client' });
    expect(useFileStore.getState().fileContents.file).toBe('seed remote');
    expect(socket.sent.filter(item => item.event === 'crdt:update')).toHaveLength(0);
  });
  it('sends one incremental update and no full-text replacement for a local edit', async () => {
    await join(); useCollaborationStore.getState().yDoc!.getText('monaco').insert(4, ' local');
    const updates = socket.sent.filter(item => item.event === 'crdt:update');
    expect(updates).toHaveLength(1); expect(socket.sent.some(item => item.event === 'crdt:content_change')).toBe(false);
    Y.applyUpdate(server, Buffer.from(updates[0].data.update, 'base64'));
    expect(server.getText('monaco').toString()).toBe('seed local');
  });
  it('merges unsent edits with server changes after reconnecting', async () => {
    await join(); socket.connected = false; socket.trigger('disconnect');
    useCollaborationStore.getState().yDoc!.getText('monaco').insert(0, 'offline ');
    server.getText('monaco').insert(4, ' remote');
    socket.connect(); socket.trigger('crdt:initial_state', { fileId: 'file', state: encode(server) });
    const update = socket.sent.filter(item => item.event === 'crdt:update').at(-1)!;
    Y.applyUpdate(server, Buffer.from(update.data.update, 'base64'));
    expect(server.getText('monaco').toString()).toBe(useCollaborationStore.getState().yDoc!.getText('monaco').toString());
    expect(server.getText('monaco').toString()).toContain('offline'); expect(server.getText('monaco').toString()).toContain('remote');
  });
});
