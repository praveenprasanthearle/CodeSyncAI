import React, { useState } from 'react';
import {
  FolderTree,
  FilePlus,
  FolderPlus,
  ChevronsDown,
  ChevronsUp,
  RefreshCw,
  X,
  Check,
  Loader2,
} from 'lucide-react';
import { useFileStore } from '../../stores/fileStore';
import { FileTreeNode } from './FileTreeNode';

interface FileTreeProps {
  projectId: string;
}

export const FileTree: React.FC<FileTreeProps> = ({ projectId }) => {
  const {
    fileTree,
    isLoading,
    isSaving,
    fetchProjectFiles,
    createNode,
    expandAllFolders,
    collapseAllFolders,
  } = useFileStore();

  const [isCreating, setIsCreating] = useState<{
    type: 'file' | 'folder';
    parentId: string | null;
  } | null>(null);
  const [createName, setCreateName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleStartCreate = (parentId: string | null = null, type: 'file' | 'folder' = 'file') => {
    setIsCreating({ type, parentId });
    setCreateName('');
    setError(null);
  };

  const handleCancelCreate = () => {
    setIsCreating(null);
    setCreateName('');
    setError(null);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCreating || !createName.trim()) return;

    setError(null);
    try {
      await createNode(
        projectId,
        createName.trim(),
        isCreating.type,
        isCreating.parentId
      );
      handleCancelCreate();
    } catch (err: any) {
      setError(err.message || 'Failed to create item');
    }
  };

  return (
    <div className="flex flex-col h-full bg-editor-sidebar border-r border-editor-border select-none overflow-hidden">
      {/* File Tree Header Toolbar */}
      <div className="h-9 px-3 border-b border-editor-border bg-surface-300/40 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-300 font-mono">
          <FolderTree className="h-3.5 w-3.5 text-gold-400" />
          <span>Explorer</span>
        </div>

        <div className="flex items-center gap-0.5 text-slate-400">
          <button
            onClick={() => handleStartCreate(null, 'file')}
            className="p-1 rounded hover:bg-surface-200 hover:text-white transition-colors"
            title="New File"
          >
            <FilePlus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleStartCreate(null, 'folder')}
            className="p-1 rounded hover:bg-surface-200 hover:text-white transition-colors"
            title="New Folder"
          >
            <FolderPlus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={expandAllFolders}
            className="p-1 rounded hover:bg-surface-200 hover:text-white transition-colors"
            title="Expand All Folders"
          >
            <ChevronsDown className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={collapseAllFolders}
            className="p-1 rounded hover:bg-surface-200 hover:text-white transition-colors"
            title="Collapse All Folders"
          >
            <ChevronsUp className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => fetchProjectFiles(projectId)}
            className="p-1 rounded hover:bg-surface-200 hover:text-white transition-colors"
            title="Refresh Files"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Creation Input Bar */}
      {isCreating && (
        <form onSubmit={handleCreateSubmit} className="p-2 border-b border-editor-border bg-surface-200/90">
          <div className="text-[10px] font-mono text-gold-300 mb-1 flex items-center justify-between">
            <span>New {isCreating.type === 'file' ? 'File' : 'Folder'}:</span>
            <button type="button" onClick={handleCancelCreate} className="text-slate-400 hover:text-white">
              <X className="h-3 w-3" />
            </button>
          </div>
          <div className="flex items-center gap-1">
            <input
              type="text"
              autoFocus
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder={isCreating.type === 'file' ? 'filename.jsx' : 'folder-name'}
              className="flex-1 rounded border border-gold-400 bg-surface-300 px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
            />
            <button
              type="submit"
              disabled={isSaving}
              className="p-1 rounded bg-gold-400 text-background hover:bg-gold-300 transition-colors"
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5 stroke-[3]" />}
            </button>
          </div>
          {error && <div className="text-[10px] text-rose-400 mt-1">{error}</div>}
        </form>
      )}

      {/* File Tree List */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
        {isLoading && fileTree.length === 0 ? (
          <div className="p-4 space-y-2 text-xs font-mono text-slate-500">
            <div className="h-4 w-3/4 rounded bg-surface-200/40 animate-pulse" />
            <div className="h-4 w-1/2 rounded bg-surface-200/40 animate-pulse" />
            <div className="h-4 w-2/3 rounded bg-surface-200/40 animate-pulse" />
          </div>
        ) : fileTree.length === 0 ? (
          <div className="p-6 text-center text-xs font-mono text-slate-500">
            <p>No files in workspace.</p>
            <button
              onClick={() => handleStartCreate(null, 'file')}
              className="mt-2 text-gold-400 hover:underline inline-flex items-center gap-1"
            >
              <FilePlus className="h-3 w-3" /> Create first file
            </button>
          </div>
        ) : (
          fileTree.map((node) => (
            <FileTreeNode
              key={node.id}
              node={node}
              level={0}
              onOpenCreateModal={handleStartCreate}
            />
          ))
        )}
      </div>
    </div>
  );
};
