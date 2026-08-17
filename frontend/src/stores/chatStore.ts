import { create } from 'zustand';
import { apiClient } from '../api/client';
import { useCollaborationStore } from './collaborationStore';

export interface IFileReference {
  fileId?: string;
  path: string;
  line?: number;
}

export interface IChatSender {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  email: string;
}

export interface IChatMessage {
  id: string;
  projectId: string;
  sender: IChatSender;
  text: string;
  fileReference?: IFileReference;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ChatState {
  messages: IChatMessage[];
  isLoading: boolean;
  hasMore: boolean;
  typingUsers: Record<string, { username: string; color: string }>;
  unreadCount: number;

  // Actions
  fetchMessages: (projectId: string) => Promise<void>;
  sendMessage: (
    projectId: string,
    text: string,
    fileReference?: IFileReference
  ) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  handleIncomingMessage: (message: IChatMessage) => void;
  setTyping: (projectId: string, isTyping: boolean) => void;
  handleUserTyping: (socketId: string, user: any, isTyping: boolean) => void;
  resetUnread: () => void;
  clearState: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  hasMore: false,
  typingUsers: {},
  unreadCount: 0,

  fetchMessages: async (projectId: string) => {
    set({ isLoading: true });
    try {
      const response: any = await apiClient.get(`/projects/${projectId}/messages?limit=50`);
      set({
        messages: response?.data?.messages || [],
        hasMore: response?.data?.hasMore || false,
      });
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  sendMessage: async (projectId: string, text: string, fileReference?: IFileReference) => {
    const socket = useCollaborationStore.getState().socket;

    if (socket && socket.connected) {
      // Send instantly via Socket.IO for low latency
      socket.emit('chat:send', {
        projectId,
        text,
        fileReference,
      });
      // Clear typing indicator
      socket.emit('chat:typing', { projectId, isTyping: false });
    } else {
      // Fallback to REST API
      const response: any = await apiClient.post(`/projects/${projectId}/messages`, {
        text,
        fileReference,
      });
      const newMsg = response?.data?.message;
      if (newMsg) {
        get().handleIncomingMessage(newMsg);
      }
    }
  },

  deleteMessage: async (messageId: string) => {
    try {
      await apiClient.delete(`/messages/${messageId}`);
      set((state) => ({
        messages: state.messages.filter((m) => m.id !== messageId),
      }));
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  },

  handleIncomingMessage: (message: IChatMessage) => {
    set((state) => {
      const exists = state.messages.some((m) => m.id === message.id);
      if (exists) return state;
      return {
        messages: [...state.messages, message],
        unreadCount: state.unreadCount + 1,
      };
    });
  },

  setTyping: (projectId: string, isTyping: boolean) => {
    const socket = useCollaborationStore.getState().socket;
    if (socket && socket.connected) {
      socket.emit('chat:typing', { projectId, isTyping });
    }
  },

  handleUserTyping: (socketId: string, user: any, isTyping: boolean) => {
    set((state) => {
      const updated = { ...state.typingUsers };
      if (isTyping) {
        updated[socketId] = { username: user.username, color: user.color };
      } else {
        delete updated[socketId];
      }
      return { typingUsers: updated };
    });
  },

  resetUnread: () => {
    set({ unreadCount: 0 });
  },

  clearState: () => {
    set({
      messages: [],
      isLoading: false,
      hasMore: false,
      typingUsers: {},
      unreadCount: 0,
    });
  },
}));
