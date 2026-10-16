import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import * as Y from 'yjs';
import { useFileStore } from './fileStore';
import { getSocketUrl } from '../utils/network';

export interface CollaboratorUser {
  userId: string;
  username: string;
  email: string;
  name: string;
  avatarUrl: string;
  color: string;
}

export interface WorkspaceMemberInfo {
  socketId: string;
  user: CollaboratorUser;
  activeFileId?: string | null;
  joinedAt: string;
}

export interface PeerCursorInfo {
  socketId: string;
  user: CollaboratorUser;
  cursor: { line: number; column: number };
  selection?: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
}

interface CollaborationState {
  socket: Socket | null;
  isConnected: boolean;
  currentProjectId: string | null;
  currentFileId: string | null;
  collaborators: WorkspaceMemberInfo[];
  peerCursors: Record<string, PeerCursorInfo>;
  yDoc: Y.Doc | null;

  // Actions
  connectSocket: () => Socket;
  disconnectSocket: () => void;
  joinWorkspace: (projectId: string, activeFileId?: string | null) => void;
  leaveWorkspace: (projectId: string) => void;
  updateActiveFilePresence: (projectId: string, activeFileId: string | null) => void;
  joinFileCRDT: (
    fileId: string,
    initialContent?: string,
    onContentChange?: (content: string) => void
  ) => Promise<void>;
  leaveFileCRDT: (fileId: string) => void;
  sendCRDTUpdate: (fileId: string, update: Uint8Array) => void;
  sendContentChange: (fileId: string, content: string) => void;
  broadcastCursor: (
    fileId: string,
    cursor: { line: number; column: number },
    selection?: any
  ) => void;
  clearState: () => void;
}


export const useCollaborationStore = create<CollaborationState>((set, get) => ({
  socket: null,
  isConnected: false,
  currentProjectId: null,
  currentFileId: null,
  collaborators: [],
  peerCursors: {},
  yDoc: null,

  connectSocket: () => {
    const existingSocket = get().socket;
    if (existingSocket && existingSocket.connected) {
      return existingSocket;
    }

    const token = localStorage.getItem('codesync_access_token');
    const socket = io(getSocketUrl(), {
      auth: { token: token || '' },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      set({ isConnected: true, socket });

      // Rejoin workspace if disconnected and reconnected
      const { currentProjectId, currentFileId } = get();
      if (currentProjectId) {
        get().joinWorkspace(currentProjectId, currentFileId);
      }
    });

    socket.on('disconnect', () => {
      set({ isConnected: false });
    });

    // Workspace Presence Listeners
    socket.on('workspace:collaborators', ({ collaborators }: { collaborators: WorkspaceMemberInfo[] }) => {
      // Deduplicate by userId to ensure single count per user
      const map = new Map<string, WorkspaceMemberInfo>();
      for (const member of collaborators) {
        map.set(member.user.userId, member);
      }
      set({ collaborators: Array.from(map.values()) });
    });

    socket.on('workspace:user_joined', ({ member }: { member: WorkspaceMemberInfo }) => {
      set((state) => {
        // Remove any prior entry for the same user or socket
        const filtered = state.collaborators.filter(
          (c) => c.user.userId !== member.user.userId && c.socketId !== member.socketId
        );
        return { collaborators: [...filtered, member] };
      });
    });

    socket.on('workspace:user_left', ({ socketId, userId }: { socketId: string; userId?: string }) => {
      set((state) => ({
        collaborators: state.collaborators.filter(
          (c) => c.socketId !== socketId && (!userId || c.user.userId !== userId)
        ),
        peerCursors: Object.fromEntries(
          Object.entries(state.peerCursors).filter(
            ([key, val]) => key !== socketId && (!userId || val.user.userId !== userId)
          )
        ),
      }));
    });

    socket.on(
      'presence:file_changed',
      ({ socketId, activeFileId }: { socketId: string; activeFileId: string | null }) => {
        set((state) => ({
          collaborators: state.collaborators.map((c) =>
            c.socketId === socketId ? { ...c, activeFileId } : c
          ),
        }));
      }
    );

    // CRDT Awareness Listeners
    socket.on('crdt:peer_awareness', (data: PeerCursorInfo) => {
      set((state) => ({
        peerCursors: {
          ...state.peerCursors,
          [data.socketId]: data,
        },
      }));
    });

    socket.on('crdt:peer_left_file', ({ socketId }: { socketId: string }) => {
      set((state) => ({
        peerCursors: Object.fromEntries(
          Object.entries(state.peerCursors).filter(([key]) => key !== socketId)
        ),
      }));
    });

    // Real-Time Content Synchronization Listener
    socket.on(
      'crdt:remote_content',
      ({ fileId, content, senderSocketId }: { fileId: string; content: string; senderSocketId: string }) => {
        if (senderSocketId === socket.id) return;
        useFileStore.getState().updateRemoteContent(fileId, content);
      }
    );

    set({ socket });
    return socket;
  },

  disconnectSocket: () => {
    const { socket, currentProjectId } = get();
    if (socket) {
      if (currentProjectId) {
        socket.emit('workspace:leave', { projectId: currentProjectId });
      }
      socket.disconnect();
    }
    set({
      socket: null,
      isConnected: false,
      collaborators: [],
      peerCursors: {},
      yDoc: null,
    });
  },

  joinWorkspace: (projectId: string, activeFileId: string | null = null) => {
    const socket = get().connectSocket();
    set({ currentProjectId: projectId });
    socket.emit('workspace:join', { projectId, activeFileId });
  },

  leaveWorkspace: (projectId: string) => {
    const { socket } = get();
    if (socket) {
      socket.emit('workspace:leave', { projectId });
    }
    set({ currentProjectId: null, collaborators: [], peerCursors: {} });
  },

  updateActiveFilePresence: (projectId: string, activeFileId: string | null) => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit('presence:update_file', { projectId, activeFileId });
    }
  },

  joinFileCRDT: async (fileId: string, initialContent = '', onContentChange) => {
    const socket = get().connectSocket();
    set({ currentFileId: fileId, peerCursors: {} });

    const doc = new Y.Doc();
    const yText = doc.getText('monaco');

    // Subscribe to remote updates from server
    const handleInitialState = (data: { fileId: string; state: string }) => {
      if (data.fileId !== fileId) return;
      const binary = new Uint8Array(
        atob(data.state)
          .split('')
          .map((c) => c.charCodeAt(0))
      );
      Y.applyUpdate(doc, binary);
      if (onContentChange) {
        onContentChange(yText.toString());
      }
    };

    const handleRemoteUpdate = (data: { fileId: string; update: string; senderSocketId: string }) => {
      if (data.fileId !== fileId || data.senderSocketId === socket.id) return;
      const binary = new Uint8Array(
        atob(data.update)
          .split('')
          .map((c) => c.charCodeAt(0))
      );
      Y.applyUpdate(doc, binary);
      if (onContentChange) {
        onContentChange(yText.toString());
      }
    };

    socket.off('crdt:initial_state');
    socket.off('crdt:update');

    socket.on('crdt:initial_state', handleInitialState);
    socket.on('crdt:update', handleRemoteUpdate);

    // Request initial document state
    socket.emit('crdt:join_file', { fileId, initialContent });

    // Broadcast local updates to peers
    doc.on('update', (update: Uint8Array, origin: any) => {
      if (origin !== 'remote') {
        const base64 = btoa(String.fromCharCode(...update));
        socket.emit('crdt:update', { fileId, update: base64 });
      }
    });

    set({ yDoc: doc });
  },

  leaveFileCRDT: (fileId: string) => {
    const { socket } = get();
    if (socket) {
      socket.emit('crdt:leave_file', { fileId });
      socket.off('crdt:initial_state');
      socket.off('crdt:update');
    }
    set({ currentFileId: null, peerCursors: {}, yDoc: null });
  },

  sendCRDTUpdate: (fileId: string, update: Uint8Array) => {
    const { socket } = get();
    if (socket && socket.connected) {
      const base64 = btoa(String.fromCharCode(...update));
      socket.emit('crdt:update', { fileId, update: base64 });
    }
  },

  sendContentChange: (fileId: string, content: string) => {
    const { socket, currentProjectId, yDoc } = get();
    if (yDoc) {
      const yText = yDoc.getText('monaco');
      if (yText.toString() !== content) {
        yDoc.transact(() => {
          yText.delete(0, yText.length);
          yText.insert(0, content);
        }, 'local');
      }
    }
    if (socket && socket.connected) {
      socket.emit('crdt:content_change', {
        projectId: currentProjectId,
        fileId,
        content,
      });
    }
  },

  broadcastCursor: (fileId: string, cursor: { line: number; column: number }, selection) => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit('crdt:awareness', { fileId, cursor, selection });
    }
  },

  clearState: () => {
    get().disconnectSocket();
  },
}));
