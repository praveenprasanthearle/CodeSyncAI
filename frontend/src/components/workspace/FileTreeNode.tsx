import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  Atom,
  Server,
  Terminal,
  Cpu,
  Zap,
  MoreVertical,
  Edit2,
  Trash2,
  Copy,
  Plus,
  FolderPlus,
} from 'lucide-react';
import { IFileNode } from '../../types';
import { useFileStore } from '../../stores/fileStore';

interface FileTreeNodeProps {
  node: IFileNode;
  level?: number;
  onOpenCreateModal?: (parentId: string | null, type: 'file' | 'folder') => void;
}

export const getFileIcon = (name: string, type: 'file' | 'folder', isExpanded = false) => {
  if (type === 'folder') {
    return isExpanded ? (
      <FolderOpen className="h-4 w-4 text-amber-500 shrink-0" />
    ) : (
      <Folder className="h-4 w-4 text-amber-500/90 shrink-0" />
    );
  }

  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'jsx':
    case 'tsx':
      return <Atom className="h-4 w-4 text-sky-600 shrink-0" />;
    case 'js':
    case 'ts':
    case 'mjs':
      return <Server className="h-4 w-4 text-emerald-600 shrink-0" />;
    case 'py':
      return <Terminal className="h-4 w-4 text-amber-600 shrink-0" />;
    case 'cpp':
    case 'c':
    case 'h':
    case 'hpp':
      return <Cpu className="h-4 w-4 text-blue-600 shrink-0" />;
    case 'go':
      return <Zap className="h-4 w-4 text-cyan-600 shrink-0" />;
    case 'html':
      return <FileCode className="h-4 w-4 text-orange-500 shrink-0" />;
    case 'css':
    case 'scss':
      return <FileCode className="h-4 w-4 text-pink-500 shrink-0" />;
    case 'json':
      return <FileText className="h-4 w-4 text-amber-600 shrink-0" />;
    case 'md':
      return <FileText className="h-4 w-4 text-purple-600 shrink-0" />;
    default:
      return <FileCode className="h-4 w-4 text-slate-400 shrink-0" />;
  }
};

export const FileTreeNode: React.FC<FileTreeNodeProps> = ({
  node,
  level = 0,
  onOpenCreateModal,
}) => {
  const {
    activeFileId,
    expandedFolderIds,
    dirtyFileIds,
    openFile,
    toggleFolder,
    renameNode,
    deleteNode,
  } = useFileStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(node.name);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isExpanded = expandedFolderIds.includes(node.id);
  const isActive = activeFileId === node.id;
  const isDirty = dirtyFileIds.includes(node.id);

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.type === 'folder') {
      toggleFolder(node.id);
    } else {
      openFile(node);
    }
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || editName === node.name) {
      setIsEditing(false);
      return;
    }
    try {
      await renameNode(node.id, editName.trim());
      setIsEditing(false);
    } catch (_err) {
      // Error handled by store
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    if (window.confirm(`Delete "${node.name}" permanently?`)) {
      await deleteNode(node.id);
    }
  };

  const handleCopyPath = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    navigator.clipboard.writeText(node.path);
  };

  return (
    <div>
      <div
        onClick={handleClick}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        className={`group relative flex items-center justify-between py-1 pr-2 rounded-md text-xs font-mono select-none cursor-pointer transition-colors ${
          isActive
            ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-600 font-semibold'
            : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/50'
        }`}
      >
        {/* Node Icon & Label */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {node.type === 'folder' && (
            <span className="text-slate-400 hover:text-slate-600">
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </span>
          )}

          {getFileIcon(node.name, node.type, isExpanded)}

          {isEditing ? (
            <form onSubmit={handleRenameSubmit} className="flex-1 mr-2" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={() => setIsEditing(false)}
                className="w-full rounded border border-blue-600 bg-white px-1 py-0.5 text-xs text-slate-900 focus:outline-none"
              />
            </form>
          ) : (
            <span className="truncate">{node.name}</span>
          )}

          {/* Dirty Indicator */}
          {isDirty && <span className="h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0 ml-1" title="Unsaved changes" />}
        </div>

        {/* Hover Actions */}
        <div
          className="relative opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity"
          onClick={(e) => e.stopPropagation()}
          ref={menuRef}
        >
          {node.type === 'folder' && onOpenCreateModal && (
            <>
              <button
                onClick={() => onOpenCreateModal(node.id, 'file')}
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
                title="New File"
              >
                <Plus className="h-3 w-3" />
              </button>
              <button
                onClick={() => onOpenCreateModal(node.id, 'folder')}
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
                title="New Folder"
              >
                <FolderPlus className="h-3 w-3" />
              </button>
            </>
          )}

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
            title="More actions"
          >
            <MoreVertical className="h-3 w-3" />
          </button>

          {/* Context Menu Dropdown */}
          {isMenuOpen && (
            <div className="absolute right-0 top-6 w-36 rounded-lg border border-slate-200 bg-white/95 backdrop-blur-xl shadow-glass-dropdown py-1 z-40 text-xs animate-in fade-in duration-100">
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsEditing(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
              >
                <Edit2 className="h-3 w-3 text-slate-500" />
                <span>Rename</span>
              </button>
              <button
                onClick={handleCopyPath}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
              >
                <Copy className="h-3 w-3 text-slate-500" />
                <span>Copy Path</span>
              </button>
              <div className="border-t border-slate-100 my-0.5" />
              <button
                onClick={handleDelete}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-rose-600 hover:bg-rose-50"
              >
                <Trash2 className="h-3 w-3" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recursive Children for Folders */}
      {node.type === 'folder' && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onOpenCreateModal={onOpenCreateModal}
            />
          ))}
        </div>
      )}
    </div>
  );
};
