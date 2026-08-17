import { create } from 'zustand';
import { IFileNode } from '../types';
import { apiClient } from '../api/client';

interface FileState {
  fileTree: IFileNode[];
  activeFileId: string | null;
  openTabIds: string[];
  fileContents: Record<string, string>;
  dirtyFileIds: string[];
  expandedFolderIds: string[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // Actions
  fetchProjectFiles: (projectId: string) => Promise<void>;
  openFile: (file: IFileNode) => Promise<void>;
  closeTab: (fileId: string) => void;
  closeOtherTabs: (fileId: string) => void;
  closeAllTabs: () => void;
  updateLocalContent: (fileId: string, content: string) => void;
  updateRemoteContent: (fileId: string, content: string) => void;
  saveFile: (fileId: string) => Promise<void>;
  saveAllDirtyFiles: () => Promise<void>;
  createNode: (
    projectId: string,
    name: string,
    type: 'file' | 'folder',
    parentId?: string | null,
    content?: string
  ) => Promise<IFileNode>;
  renameNode: (fileId: string, newName: string) => Promise<IFileNode>;
  deleteNode: (fileId: string) => Promise<void>;
  toggleFolder: (folderId: string) => void;
  expandAllFolders: () => void;
  collapseAllFolders: () => void;
  clearState: () => void;
}

export const useFileStore = create<FileState>((set, get) => ({
  fileTree: [],
  activeFileId: null,
  openTabIds: [],
  fileContents: {},
  dirtyFileIds: [],
  expandedFolderIds: [],
  isLoading: false,
  isSaving: false,
  error: null,

  fetchProjectFiles: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response: any = await apiClient.get(`/projects/${projectId}/files`);
      const tree: IFileNode[] = response?.data?.files || [];

      // Auto-expand all top-level folders
      const initialExpanded: string[] = [];
      const collectFolders = (nodes: IFileNode[]) => {
        for (const n of nodes) {
          if (n.type === 'folder') {
            initialExpanded.push(n.id);
            if (n.children) collectFolders(n.children);
          }
        }
      };
      collectFolders(tree);

      set({
        fileTree: tree,
        expandedFolderIds: initialExpanded,
      });

      // Auto-open first file (e.g. App.jsx, main.py, README.md) if no tab is open
      const { activeFileId, openTabIds } = get();
      if (!activeFileId && openTabIds.length === 0) {
        const findFirstFile = (nodes: IFileNode[]): IFileNode | null => {
          for (const n of nodes) {
            if (n.type === 'file') return n;
            if (n.children) {
              const found = findFirstFile(n.children);
              if (found) return found;
            }
          }
          return null;
        };
        const first = findFirstFile(tree);
        if (first) {
          get().openFile(first);
        }
      }
    } catch (err: any) {
      set({ error: err.message || 'Failed to load project files' });
    } finally {
      set({ isLoading: false });
    }
  },

  openFile: async (file: IFileNode) => {
    if (file.type === 'folder') return;

    const { openTabIds, fileContents } = get();
    const updatedTabs = openTabIds.includes(file.id) ? openTabIds : [...openTabIds, file.id];

    // If content not yet in cache, fetch it
    if (fileContents[file.id] === undefined) {
      try {
        const response: any = await apiClient.get(`/files/${file.id}`);
        const content = response?.data?.file?.content ?? file.content ?? '';
        set((state) => ({
          activeFileId: file.id,
          openTabIds: updatedTabs,
          fileContents: { ...state.fileContents, [file.id]: content },
        }));
        return;
      } catch (_err) {
        // Use file.content if fetch fails (e.g. offline or unit tests)
        set((state) => ({
          activeFileId: file.id,
          openTabIds: updatedTabs,
          fileContents: { ...state.fileContents, [file.id]: file.content ?? '' },
        }));
        return;
      }
    }

    set({
      activeFileId: file.id,
      openTabIds: updatedTabs,
    });
  },

  closeTab: (fileId: string) => {
    const { openTabIds, activeFileId } = get();
    const newTabs = openTabIds.filter((id) => id !== fileId);
    let newActiveId = activeFileId;

    if (activeFileId === fileId) {
      if (newTabs.length > 0) {
        const closedIndex = openTabIds.indexOf(fileId);
        newActiveId = newTabs[Math.min(closedIndex, newTabs.length - 1)];
      } else {
        newActiveId = null;
      }
    }

    set({
      openTabIds: newTabs,
      activeFileId: newActiveId,
      dirtyFileIds: get().dirtyFileIds.filter((id) => id !== fileId),
    });
  },

  closeOtherTabs: (fileId: string) => {
    set({
      openTabIds: [fileId],
      activeFileId: fileId,
      dirtyFileIds: get().dirtyFileIds.filter((id) => id === fileId),
    });
  },

  closeAllTabs: () => {
    set({
      openTabIds: [],
      activeFileId: null,
      dirtyFileIds: [],
    });
  },

  updateLocalContent: (fileId: string, content: string) => {
    const { fileContents, dirtyFileIds } = get();
    const updatedContents = { ...fileContents, [fileId]: content };
    const updatedDirty = dirtyFileIds.includes(fileId) ? dirtyFileIds : [...dirtyFileIds, fileId];

    set({
      fileContents: updatedContents,
      dirtyFileIds: updatedDirty,
    });
  },

  updateRemoteContent: (fileId: string, content: string) => {
    const { fileContents } = get();
    if (fileContents[fileId] !== content) {
      set({
        fileContents: { ...fileContents, [fileId]: content },
      });
    }
  },

  saveFile: async (fileId: string) => {
    const { fileContents, dirtyFileIds } = get();
    const content = fileContents[fileId];
    if (content === undefined) return;

    set({ isSaving: true });
    try {
      await apiClient.put(`/files/${fileId}`, { content });
      set({
        dirtyFileIds: dirtyFileIds.filter((id) => id !== fileId),
      });
    } catch (err: any) {
      set({ error: err.message || 'Failed to save file' });
    } finally {
      set({ isSaving: false });
    }
  },

  saveAllDirtyFiles: async () => {
    const { dirtyFileIds, saveFile } = get();
    await Promise.all(dirtyFileIds.map((id) => saveFile(id)));
  },

  createNode: async (projectId, name, type, parentId = null, content = '') => {
    set({ isSaving: true, error: null });
    try {
      const response: any = await apiClient.post(`/projects/${projectId}/files`, {
        name,
        type,
        parentId,
        content,
      });
      const newNode: IFileNode = response.data.file;

      // Refresh file tree
      await get().fetchProjectFiles(projectId);

      // If created a file, auto open it
      if (newNode.type === 'file') {
        get().openFile(newNode);
      }

      return newNode;
    } catch (err: any) {
      set({ error: err.message || 'Failed to create item' });
      throw err;
    } finally {
      set({ isSaving: false });
    }
  },

  renameNode: async (fileId, newName) => {
    set({ isSaving: true, error: null });
    try {
      const response: any = await apiClient.put(`/files/${fileId}`, { name: newName });
      const updatedNode = response.data.file;

      if (updatedNode.projectId) {
        await get().fetchProjectFiles(updatedNode.projectId);
      }

      return updatedNode;
    } catch (err: any) {
      set({ error: err.message || 'Failed to rename item' });
      throw err;
    } finally {
      set({ isSaving: false });
    }
  },

  deleteNode: async (fileId) => {
    set({ isSaving: true, error: null });
    try {
      const { activeFileId, openTabIds, closeTab } = get();
      if (openTabIds.includes(fileId) || activeFileId === fileId) {
        closeTab(fileId);
      }

      await apiClient.delete(`/files/${fileId}`);
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete item' });
      throw err;
    } finally {
      set({ isSaving: false });
    }
  },

  toggleFolder: (folderId: string) => {
    const { expandedFolderIds } = get();
    const isExpanded = expandedFolderIds.includes(folderId);
    set({
      expandedFolderIds: isExpanded
        ? expandedFolderIds.filter((id) => id !== folderId)
        : [...expandedFolderIds, folderId],
    });
  },

  expandAllFolders: () => {
    const { fileTree } = get();
    const folderIds: string[] = [];
    const collect = (nodes: IFileNode[]) => {
      for (const n of nodes) {
        if (n.type === 'folder') {
          folderIds.push(n.id);
          if (n.children) collect(n.children);
        }
      }
    };
    collect(fileTree);
    set({ expandedFolderIds: folderIds });
  },

  collapseAllFolders: () => {
    set({ expandedFolderIds: [] });
  },

  clearState: () => {
    set({
      fileTree: [],
      activeFileId: null,
      openTabIds: [],
      fileContents: {},
      dirtyFileIds: [],
      expandedFolderIds: [],
      error: null,
    });
  },
}));
