import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import * as Y from 'yjs';
import { useFileStore } from './fileStore';
import { useProjectStore } from './projectStore';
import { getSocketUrl } from '../utils/network';
import { getAccessToken } from '../api/session';
import { refreshAccessToken } from '../api/client';

export interface CollaboratorUser { userId: string; username: string; email: string; name: string; avatarUrl: string; color: string }
export interface WorkspaceMemberInfo { socketId: string; user: CollaboratorUser; activeFileId?: string | null; joinedAt: string }
export interface PeerCursorInfo { socketId: string; user: CollaboratorUser; cursor: { line: number; column: number }; selection?: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number } }
interface CollaborationState {
  socket: Socket | null; isConnected: boolean; currentProjectId: string | null; currentFileId: string | null;
  collaborators: WorkspaceMemberInfo[]; peerCursors: Record<string, PeerCursorInfo>; yDoc: Y.Doc | null;
  isDocumentReady: boolean; error: string | null;
  connectSocket: () => Socket; disconnectSocket: () => void;
  joinWorkspace: (projectId: string, activeFileId?: string | null) => void;
  leaveWorkspace: (projectId: string) => void;
  updateActiveFilePresence: (projectId: string, activeFileId: string | null) => void;
  joinFileCRDT: (fileId: string, initialContent?: string, onContentChange?: (content: string) => void) => Promise<void>;
  leaveFileCRDT: (fileId: string) => void;
  sendCRDTUpdate: (fileId: string, update: Uint8Array) => void;
  sendContentChange: (fileId: string, content: string) => void;
  flushFile: (fileId: string) => Promise<string | null>;
  broadcastCursor: (fileId: string, cursor: { line: number; column: number }, selection?: unknown) => void;
  clearState: () => void;
}
const toBase64 = (bytes: Uint8Array): string => {
  let text = ''; for (let index = 0; index < bytes.length; index += 0x8000) text += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  return btoa(text);
};
const fromBase64 = (text: string) => Uint8Array.from(atob(text), char => char.charCodeAt(0));
let fileCleanup: (() => void) | null = null;
type DocumentState = { doc: Y.Doc; revision: number; acknowledged: number };
const documents = new Map<string, DocumentState>();
const clearDocuments = () => { fileCleanup?.(); fileCleanup = null; documents.forEach(item => item.doc.destroy()); documents.clear(); };

export const useCollaborationStore = create<CollaborationState>((set, get) => ({
  socket: null, isConnected: false, currentProjectId: null, currentFileId: null, collaborators: [], peerCursors: {}, yDoc: null, isDocumentReady: false, error: null,
  connectSocket: () => {
    // Reuse an existing connecting/reconnecting socket as well as an already connected one.
    if (get().socket) return get().socket!;
    const socket = io(getSocketUrl(), {
      auth: callback => callback({ token: getAccessToken() || '' }), transports: ['websocket', 'polling'], reconnectionAttempts: 10, reconnectionDelay: 1000,
    });
    set({ socket });
    socket.on('connect', () => {
      set({ isConnected: true, error: null });
      const { currentProjectId, currentFileId } = get();
      if (currentProjectId) socket.emit('workspace:join', { projectId: currentProjectId, activeFileId: currentFileId });
      if (currentFileId) socket.emit('crdt:join_file', { fileId: currentFileId });
    });
    socket.on('disconnect', () => set({ isConnected: false }));
    let refreshing = false;
    socket.on('connect_error', async error => {
      set({ isConnected: false, error: error.message });
      if (!refreshing && /jwt expired|TOKEN_EXPIRED|AUTHENTICATION|SESSION_EXPIRED/i.test(error.message)) {
        refreshing = true;
        try { await refreshAccessToken(); if (get().socket === socket) socket.connect(); }
        catch { set({ error: 'Your session has expired. Please sign in again.' }); }
        finally { refreshing = false; }
      }
    });
    socket.on('workspace:collaborators', ({ collaborators }: { collaborators: WorkspaceMemberInfo[] }) => {
      const unique = new Map(collaborators.map(member => [member.user.userId, member]));
      set({ collaborators: Array.from(unique.values()) });
    });
    socket.on('workspace:user_joined', ({ member }: { member: WorkspaceMemberInfo }) => set(state => ({ collaborators: [...state.collaborators.filter(existing => existing.user.userId !== member.user.userId), member] })));
    socket.on('workspace:user_left', ({ socketId, userId }: { socketId: string; userId?: string }) => set(state => ({
      collaborators: state.collaborators.filter(member => member.socketId !== socketId && member.user.userId !== userId),
      peerCursors: Object.fromEntries(Object.entries(state.peerCursors).filter(([key]) => key !== socketId)),
    })));
    socket.on('presence:file_changed', ({ socketId, activeFileId }: { socketId: string; activeFileId: string | null }) => set(state => ({ collaborators: state.collaborators.map(member => member.socketId === socketId ? { ...member, activeFileId } : member) })));
    socket.on('crdt:peer_awareness', (data: PeerCursorInfo) => set(state => ({ peerCursors: { ...state.peerCursors, [data.socketId]: data } })));
    socket.on('crdt:peer_left_file', ({ socketId }: { socketId: string }) => set(state => ({ peerCursors: Object.fromEntries(Object.entries(state.peerCursors).filter(([id]) => id !== socketId)) })));
    socket.on('crdt:saved', ({ fileId, content }: { fileId: string; content: string }) => {
      if (useFileStore.getState().fileContents[fileId] === content) useFileStore.setState(state => ({ dirtyFileIds: state.dirtyFileIds.filter(id => id !== fileId) }));
    });
    socket.on('workspace:files_changed', ({ projectId }: { projectId: string }) => {
      if (get().currentProjectId === projectId) void useFileStore.getState().fetchProjectFiles(projectId);
    });
    socket.on('workspace:permissions_changed', ({ projectId }: { projectId: string }) => {
      if (get().currentProjectId === projectId) void useProjectStore.getState().getProject(projectId);
    });
    socket.on('workspace:error', async (error: { code: string; message: string }) => {
      set({ error: error.message });
      if (error.code === 'SESSION_EXPIRED' && !refreshing) {
        refreshing = true;
        try { await refreshAccessToken(); if (get().socket === socket) { socket.disconnect(); socket.connect(); } }
        catch { set({ error: 'Your session has expired. Please sign in again.' }); }
        finally { refreshing = false; }
      }
    });
    return socket;
  },
  disconnectSocket: () => {
    get().socket?.disconnect(); clearDocuments();
    set({ socket: null, isConnected: false, currentProjectId: null, currentFileId: null, collaborators: [], peerCursors: {}, yDoc: null, isDocumentReady: false, error: null });
  },
  joinWorkspace: (projectId, activeFileId = null) => {
    const previous = get().currentProjectId;
    if (previous && previous !== projectId) get().leaveWorkspace(previous);
    set({ currentProjectId: projectId });
    const socket = get().connectSocket();
    if (socket.connected) socket.emit('workspace:join', { projectId, activeFileId });
  },
  leaveWorkspace: projectId => {
    get().socket?.emit('workspace:leave', { projectId }); clearDocuments();
    set({ currentProjectId: null, currentFileId: null, yDoc: null, isDocumentReady: false, collaborators: [], peerCursors: {} });
  },
  updateActiveFilePresence: (projectId, activeFileId) => {
    const socket = get().socket;
    if (socket?.connected) socket.emit('presence:update_file', { projectId, activeFileId });
  },
  joinFileCRDT: async (fileId, _initialContent, onContentChange) => {
    fileCleanup?.();
    const socket = get().connectSocket();
    const state = documents.get(fileId) || { doc: new Y.Doc(), revision: 0, acknowledged: 0 };
    documents.set(fileId, state);
    const doc = state.doc, text = doc.getText('monaco');
    set({ currentFileId: fileId, yDoc: doc, isDocumentReady: false, peerCursors: {} });
    const send = (update: Uint8Array) => {
      if (!socket.connected || !get().isDocumentReady) return;
      const revision = state.revision;
      socket.timeout(10000).emit('crdt:update', { fileId, update: toBase64(update) }, (error: Error | null, result: any) => {
        if (!error && result?.ok) state.acknowledged = Math.max(state.acknowledged, revision);
        else if (get().currentFileId === fileId) set({ error: result?.error?.message || 'Changes are waiting for reconnection.' });
      });
    };
    const changed = (update: Uint8Array, origin: unknown) => {
      if (origin === 'remote') useFileStore.getState().updateRemoteContent(fileId, text.toString());
      else { state.revision++; useFileStore.getState().updateLocalContent(fileId, text.toString()); send(update); }
      onContentChange?.(text.toString());
    };
    const initial = (data: { fileId: string; state: string }) => {
      if (data.fileId !== fileId) return;
      Y.applyUpdate(doc, fromBase64(data.state), 'remote');
      set({ isDocumentReady: true });
      useFileStore.getState().updateRemoteContent(fileId, text.toString());
      if (state.revision > state.acknowledged) send(Y.encodeStateAsUpdate(doc));
    };
    const remote = (data: { fileId: string; update: string; senderSocketId: string }) => {
      if (data.fileId === fileId && data.senderSocketId !== socket.id) Y.applyUpdate(doc, fromBase64(data.update), 'remote');
    };
    doc.on('update', changed); socket.on('crdt:initial_state', initial); socket.on('crdt:update', remote);
    fileCleanup = () => { doc.off('update', changed); socket.off('crdt:initial_state', initial); socket.off('crdt:update', remote); };
    if (socket.connected) socket.emit('crdt:join_file', { fileId });
  },
  leaveFileCRDT: fileId => {
    get().socket?.emit('crdt:leave_file', { fileId }); fileCleanup?.(); fileCleanup = null;
    set({ currentFileId: null, yDoc: null, isDocumentReady: false, peerCursors: {} });
  },
  sendCRDTUpdate: (fileId, update) => { if (get().socket?.connected) get().socket!.emit('crdt:update', { fileId, update: toBase64(update) }); },
  sendContentChange: (fileId, content) => {
    const doc = get().currentFileId === fileId ? get().yDoc : null;
    if (!doc || !get().isDocumentReady) return;
    const text = doc.getText('monaco'), before = text.toString();
    if (before === content) return;
    let start = 0, end = 0;
    while (start < before.length && start < content.length && before[start] === content[start]) start++;
    while (end < before.length - start && end < content.length - start && before[before.length - 1 - end] === content[content.length - 1 - end]) end++;
    doc.transact(() => { text.delete(start, before.length - start - end); text.insert(start, content.slice(start, content.length - end)); }, 'local');
  },
  flushFile: async fileId => {
    const { socket, currentFileId, isDocumentReady } = get();
    if (!socket?.connected || currentFileId !== fileId || !isDocumentReady) return null;
    return new Promise((resolve, reject) => socket.timeout(10000).emit('crdt:save', { fileId }, (error: Error | null, result: any) => {
      if (error || !result?.ok) reject(new Error(result?.error?.message || 'Unable to save changes. Please reconnect and retry.'));
      else resolve(result.content);
    }));
  },
  broadcastCursor: (fileId, cursor, selection) => { if (get().socket?.connected) get().socket!.emit('crdt:awareness', { fileId, cursor, selection }); },
  clearState: () => get().disconnectSocket(),
}));
