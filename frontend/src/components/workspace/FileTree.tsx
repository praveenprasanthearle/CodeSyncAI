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
    <div className="flex flex-col h-full bg-slate-50/70 border-r border-slate-200/80 select-none overflow-hidden text-slate-800">
      {/* File Tree Header Toolbar */}
      <div className="h-9 px-3 border-b border-slate-200/80 bg-white/70 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 font-mono">
          <FolderTree className="h-3.5 w-3.5 text-slate-400" />
          <span>Explorer</span>
        </div>

        <div className="flex items-center gap-0.5 text-slate-500">
          <button
            onClick={() => handleStartCreate(null, 'file')}
            className="p-1 rounded hover:bg-slate-200/60 hover:text-slate-900 transition-colors"
            title="New File"
          >
            <FilePlus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleStartCreate(null, 'folder')}
            className="p-1 rounded hover:bg-slate-200/60 hover:text-slate-900 transition-colors"
            title="New Folder"
          >
            <FolderPlus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={expandAllFolders}
            className="p-1 rounded hover:bg-slate-200/60 hover:text-slate-900 transition-colors"
            title="Expand All"
          >
            <ChevronsDown className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={collapseAllFolders}
            className="p-1 rounded hover:bg-slate-200/60 hover:text-slate-900 transition-colors"
            title="Collapse All"
          >
            <ChevronsUp className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => fetchProjectFiles(projectId)}
            className="p-1 rounded hover:bg-slate-200/60 hover:text-slate-900 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Creation Input Bar */}
      {isCreating && (
        <form onSubmit={handleCreateSubmit} className="p-2 border-b border-slate-200 bg-white">
          <div className="text-[10px] font-mono text-slate-500 mb-1 flex items-center justify-between">
            <span>New {isCreating.type === 'file' ? 'File' : 'Folder'}:</span>
            <button type="button" onClick={handleCancelCreate} className="text-slate-400 hover:text-slate-700">
              <X className="h-3 w-3" />
            </button>
          </div>
          <div className="flex items-center gap-1">
            <input
              type="text"
              autoFocus
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder={isCreating.type === 'file' ? 'filename.ts' : 'folder-name'}
              className="flex-1 rounded border border-blue-600 bg-white px-2 py-0.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none font-mono"
            />
            <button
              type="submit"
              disabled={isSaving}
              className="p-1 rounded bg-slate-900 text-white hover:bg-slate-800 transition-colors"
            >
              {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 stroke-[3]" />}
            </button>
          </div>
          {error && <div className="text-[10px] text-rose-600 mt-1">{error}</div>}
        </form>
      )}

      {/* File Tree List */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
        {isLoading && fileTree.length === 0 ? (
          <div className="p-3 space-y-2 text-xs font-mono text-slate-400">
            <div className="h-3.5 w-3/4 rounded bg-slate-200/70 animate-pulse" />
            <div className="h-3.5 w-1/2 rounded bg-slate-200/70 animate-pulse" />
            <div className="h-3.5 w-2/3 rounded bg-slate-200/70 animate-pulse" />
          </div>
        ) : fileTree.length === 0 ? (
          <div className="p-5 text-center text-xs font-mono text-slate-400">
            <p>No files in workspace.</p>
            <button
              onClick={() => handleStartCreate(null, 'file')}
              className="mt-2 text-blue-600 hover:underline inline-flex items-center gap-1"
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
