import { describe, it, expect, beforeEach } from 'vitest';
import { useFileStore } from '../stores/fileStore';
import { useCollaborationStore } from '../stores/collaborationStore';
import { useAiStore } from '../stores/aiStore';
import { useExecutionStore } from '../stores/executionStore';
import { updateRemoteCursorDecorations } from '../utils/monacoDecorations';
import { IFileNode } from '../types';

describe('Frontend State Stores & Utilities', () => {
  beforeEach(() => {
    useFileStore.getState().clearState();
    useAiStore.getState().clearHistory();
    useExecutionStore.getState().clearTerminal();
    useCollaborationStore.getState().clearState();
  });

  describe('useFileStore', () => {
    const mockFile1: IFileNode = {
      id: 'file-1',
      projectId: 'proj-1',
      name: 'index.ts',
      path: '/index.ts',
      type: 'file',
      language: 'typescript',
      content: 'console.log("hello");',
      updatedAt: new Date().toISOString(),
    };

    const mockFile2: IFileNode = {
      id: 'file-2',
      projectId: 'proj-1',
      name: 'styles.css',
      path: '/styles.css',
      type: 'file',
      language: 'css',
      content: 'body { margin: 0; }',
      updatedAt: new Date().toISOString(),
    };

    it('should open a file and make it the active tab', async () => {
      await useFileStore.getState().openFile(mockFile1);
      const state = useFileStore.getState();

      expect(state.activeFileId).toBe('file-1');
      expect(state.openTabIds).toContain('file-1');
      expect(state.fileContents['file-1']).toBe('console.log("hello");');
    });

    it('should switch active file when opening another tab', async () => {
      await useFileStore.getState().openFile(mockFile1);
      await useFileStore.getState().openFile(mockFile2);
      const state = useFileStore.getState();

      expect(state.activeFileId).toBe('file-2');
      expect(state.openTabIds).toHaveLength(2);
    });

    it('should close a tab and activate the next available tab', async () => {
      await useFileStore.getState().openFile(mockFile1);
      await useFileStore.getState().openFile(mockFile2);

      useFileStore.getState().closeTab('file-2');
      const state = useFileStore.getState();

      expect(state.openTabIds).toHaveLength(1);
      expect(state.openTabIds).toContain('file-1');
      expect(state.activeFileId).toBe('file-1');
    });

    it('should close other tabs when requested', async () => {
      await useFileStore.getState().openFile(mockFile1);
      await useFileStore.getState().openFile(mockFile2);

      useFileStore.getState().closeOtherTabs('file-1');
      const state = useFileStore.getState();

      expect(state.openTabIds).toEqual(['file-1']);
      expect(state.activeFileId).toBe('file-1');
    });

    it('should close all tabs and reset active file', async () => {
      await useFileStore.getState().openFile(mockFile1);
      await useFileStore.getState().openFile(mockFile2);

      useFileStore.getState().closeAllTabs();
      const state = useFileStore.getState();

      expect(state.openTabIds).toEqual([]);
      expect(state.activeFileId).toBeNull();
    });

    it('should track local edits and mark files as dirty', async () => {
      await useFileStore.getState().openFile(mockFile1);
      useFileStore.getState().updateLocalContent('file-1', 'const x = 100;');

      const state = useFileStore.getState();
      expect(state.fileContents['file-1']).toBe('const x = 100;');
      expect(state.dirtyFileIds).toContain('file-1');
    });

    it('should manage folder expansion toggle states', () => {
      const store = useFileStore.getState();
      store.toggleFolder('folder-1');
      expect(useFileStore.getState().expandedFolderIds).toContain('folder-1');

      store.toggleFolder('folder-1');
      expect(useFileStore.getState().expandedFolderIds).not.toContain('folder-1');
    });
  });

  describe('useAiStore', () => {
    it('should initialize with welcome message and support clearHistory', () => {
      const state = useAiStore.getState();
      expect(state.messages.length).toBeGreaterThan(0);
      expect(state.messages[0].sender).toBe('ai');

      useAiStore.getState().clearHistory();
      const cleared = useAiStore.getState();
      expect(cleared.messages).toHaveLength(1);
      expect(cleared.messages[0].text).toContain('Conversation history cleared');
    });
  });

  describe('useExecutionStore', () => {
    it('should switch active tabs between output and stdin', () => {
      useExecutionStore.getState().setActiveTab('stdin');
      expect(useExecutionStore.getState().activeTab).toBe('stdin');

      useExecutionStore.getState().setActiveTab('output');
      expect(useExecutionStore.getState().activeTab).toBe('output');
    });

    it('should update stdin value and clear terminal', () => {
      useExecutionStore.getState().setStdin('10 20 30\n');
      expect(useExecutionStore.getState().stdin).toBe('10 20 30\n');

      useExecutionStore.getState().clearTerminal();
      expect(useExecutionStore.getState().terminalLines[0].text).toBe('Terminal output cleared.');
    });
  });

  describe('useCollaborationStore', () => {
    it('should initialize with empty collaborator list and clear state cleanly', () => {
      const state = useCollaborationStore.getState();
      expect(state.collaborators).toEqual([]);
      expect(state.peerCursors).toEqual({});

      useCollaborationStore.getState().clearState();
      expect(useCollaborationStore.getState().isConnected).toBe(false);
    });
  });

  describe('monacoDecorations', () => {
    it('should generate deltaDecorations when peers have active cursors and selections', () => {
      const capturedRanges: any[] = [];
      const mockEditor = {
        deltaDecorations: (_prev: string[], newDecs: any[]) => {
          capturedRanges.push(...newDecs);
          return ['dec-1', 'dec-2'];
        },
      };

      const peerCursors = {
        'peer-1': {
          socketId: 'sock-1',
          user: {
            userId: 'user-bob-123',
            name: 'Bob',
            username: 'bob',
            email: 'bob@example.com',
            avatarUrl: '',
            color: '#3b82f6',
          },
          cursor: { line: 5, column: 12 },
          selection: {
            startLineNumber: 5,
            startColumn: 1,
            endLineNumber: 5,
            endColumn: 12,
          },
        },
      };

      const result = updateRemoteCursorDecorations(mockEditor, peerCursors, []);
      expect(result).toEqual(['dec-1', 'dec-2']);
      expect(capturedRanges.length).toBeGreaterThanOrEqual(1);
      expect(capturedRanges[0].range.startLineNumber).toBe(5);
    });

    it('should handle null editor gracefully without throwing', () => {
      const result = updateRemoteCursorDecorations(null, {}, ['old-1']);
      expect(result).toEqual(['old-1']);
    });
  });
});
