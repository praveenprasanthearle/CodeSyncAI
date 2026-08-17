import React, { useRef, useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { useFileStore } from '../../stores/fileStore';
import { getFileIcon } from './FileTreeNode';
import { IFileNode } from '../../types';

interface EditorTabsProps {
  files: IFileNode[];
}

export const EditorTabs: React.FC<EditorTabsProps> = ({ files }) => {
  const {
    activeFileId,
    openTabIds,
    dirtyFileIds,
    isSaving,
    openFile,
    closeTab,
    closeOtherTabs,
    closeAllTabs,
    saveFile,
    saveAllDirtyFiles,
  } = useFileStore();

  const [contextMenu, setContextMenu] = useState<{
    fileId: string;
    x: number;
    y: number;
  } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    if (contextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [contextMenu]);

  // Find file object from file ID (search recursive tree)
  const findFileById = (id: string, list: IFileNode[]): IFileNode | null => {
    for (const node of list) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findFileById(id, node.children);
        if (found) return found;
      }
    }
    return null;
  };

  const handleContextMenu = (e: React.MouseEvent, fileId: string) => {
    e.preventDefault();
    setContextMenu({
      fileId,
      x: e.clientX,
      y: e.clientY,
    });
  };

  if (openTabIds.length === 0) {
    return (
      <div className="h-9 border-b border-editor-border bg-editor-inactiveTab flex items-center px-4 text-xs font-mono text-slate-500 select-none">
        No open files
      </div>
    );
  }

  return (
    <div className="h-9 border-b border-editor-border bg-editor-inactiveTab flex items-center justify-between overflow-x-auto custom-scrollbar select-none">
      {/* Tabs List */}
      <div className="flex items-center h-full overflow-x-auto min-w-0">
        {openTabIds.map((tabId) => {
          const file = findFileById(tabId, files);
          if (!file) return null;

          const isActive = activeFileId === tabId;
          const isDirty = dirtyFileIds.includes(tabId);

          return (
            <div
              key={tabId}
              onClick={() => openFile(file)}
              onContextMenu={(e) => handleContextMenu(e, tabId)}
              className={`group relative flex items-center gap-2 h-full px-3 text-xs font-mono border-r border-editor-border cursor-pointer transition-all shrink-0 ${
                isActive
                  ? 'bg-editor-activeTab text-white border-t-2 border-t-gold-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-surface-300/60'
              }`}
            >
              {getFileIcon(file.name, file.type)}
              <span className="truncate max-w-[140px]">{file.name}</span>

              {/* Dirty indicator or Close button */}
              <div className="flex items-center shrink-0 ml-1">
                {isDirty && (
                  <span
                    className="h-2 w-2 rounded-full bg-gold-400 group-hover:hidden"
                    title="Unsaved changes"
                  />
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tabId);
                  }}
                  className={`p-0.5 rounded text-slate-400 hover:text-white hover:bg-surface-200 ${
                    isDirty ? 'hidden group-hover:block' : ''
                  }`}
                  title="Close tab"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-1.5 px-3 shrink-0">
        {dirtyFileIds.length > 0 && (
          <button
            onClick={saveAllDirtyFiles}
            disabled={isSaving}
            className="inline-flex items-center gap-1 rounded bg-gold-400/10 hover:bg-gold-400/20 text-gold-300 px-2 py-0.5 text-[11px] font-mono border border-gold-400/30 transition-all"
            title="Save all dirty files (Ctrl+S)"
          >
            <Save className="h-3 w-3" />
            <span>Save ({dirtyFileIds.length})</span>
          </button>
        )}
      </div>

      {/* Tab Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed w-36 rounded-lg border border-surface-50 bg-surface-200/95 backdrop-blur-xl shadow-2xl py-1 z-50 text-xs animate-in fade-in duration-100 font-mono"
        >
          <button
            onClick={() => {
              saveFile(contextMenu.fileId);
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 text-slate-300 hover:bg-surface-100 hover:text-white"
          >
            Save File
          </button>
          <button
            onClick={() => {
              closeTab(contextMenu.fileId);
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 text-slate-300 hover:bg-surface-100 hover:text-white"
          >
            Close
          </button>
          <button
            onClick={() => {
              closeOtherTabs(contextMenu.fileId);
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 text-slate-300 hover:bg-surface-100 hover:text-white"
          >
            Close Others
          </button>
          <button
            onClick={() => {
              closeAllTabs();
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 text-slate-300 hover:bg-surface-100 hover:text-white"
          >
            Close All
          </button>
        </div>
      )}
    </div>
  );
};
