import { create } from 'zustand';
import { apiClient } from '../api/client';

export interface ISnapshotFile {
  path: string;
  name: string;
  content: string;
  language: string;
}

export interface ISnapshot {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  createdBy: {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string;
  };
  files: ISnapshotFile[];
  fileCount: number;
  totalSizeBytes: number;
  createdAt: string;
}

interface SnapshotState {
  snapshots: ISnapshot[];
  isLoading: boolean;
  isRestoring: boolean;
  selectedSnapshot: ISnapshot | null;
  error: string | null;

  // Actions
  fetchSnapshots: (projectId: string) => Promise<void>;
  createSnapshot: (projectId: string, name: string, description?: string) => Promise<ISnapshot>;
  restoreSnapshot: (snapshotId: string) => Promise<number>;
  deleteSnapshot: (snapshotId: string) => Promise<void>;
  setSelectedSnapshot: (snapshot: ISnapshot | null) => void;
}

export const useSnapshotStore = create<SnapshotState>((set) => ({
  snapshots: [],
  isLoading: false,
  isRestoring: false,
  selectedSnapshot: null,
  error: null,

  fetchSnapshots: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      const res: any = await apiClient.get(`/projects/${projectId}/snapshots`);
      set({ snapshots: res?.data?.snapshots || [] });
    } catch (err: any) {
      set({ error: err.response?.data?.error?.message || err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  createSnapshot: async (projectId: string, name: string, description = '') => {
    set({ isLoading: true, error: null });
    try {
      const res: any = await apiClient.post(`/projects/${projectId}/snapshots`, {
        name,
        description,
      });
      const newSnapshot = res?.data?.snapshot;
      set((state) => ({ snapshots: [newSnapshot, ...state.snapshots] }));
      return newSnapshot;
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message;
      set({ error: msg });
      throw new Error(msg);
    } finally {
      set({ isLoading: false });
    }
  },

  restoreSnapshot: async (snapshotId: string) => {
    set({ isRestoring: true, error: null });
    try {
      const res: any = await apiClient.post(`/snapshots/${snapshotId}/restore`);
      return res?.data?.restoredCount || 0;
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message;
      set({ error: msg });
      throw new Error(msg);
    } finally {
      set({ isRestoring: false });
    }
  },

  deleteSnapshot: async (snapshotId: string) => {
    try {
      await apiClient.delete(`/snapshots/${snapshotId}`);
      set((state) => ({
        snapshots: state.snapshots.filter((s) => s.id !== snapshotId),
        selectedSnapshot:
          state.selectedSnapshot?.id === snapshotId ? null : state.selectedSnapshot,
      }));
    } catch (err: any) {
      set({ error: err.response?.data?.error?.message || err.message });
    }
  },

  setSelectedSnapshot: (snapshot: ISnapshot | null) => {
    set({ selectedSnapshot: snapshot });
  },
}));
