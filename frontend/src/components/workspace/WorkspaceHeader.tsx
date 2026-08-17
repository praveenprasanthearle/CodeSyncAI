import React from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  Share2,
  Play,
  Bot,
  Save,
  Lock,
  Globe,
  Loader2,
  Atom,
  Server,
  Terminal,
  Cpu,
  Zap,
  FileCode,
  History,
  Camera,
  Boxes,
} from 'lucide-react';
import { IProject, ProjectTemplate } from '../../types';
import { useFileStore } from '../../stores/fileStore';
import { useCollaborationStore } from '../../stores/collaborationStore';
import { CollaboratorPresenceBar } from './CollaboratorPresenceBar';

interface WorkspaceHeaderProps {
  project: IProject | null;
  activeFileId: string | null;
  onOpenInviteModal: () => void;
  onToggleAiPanel: () => void;
  isAiPanelOpen: boolean;
  onToggleExtensionsPanel?: () => void;
  isExtensionsPanelOpen?: boolean;
  onOpenHistory?: () => void;
  onOpenSnapshot?: () => void;
  onRunCode: () => void;
  isRunningCode?: boolean;
}

const getTemplateBadge = (template?: ProjectTemplate) => {
  switch (template) {
    case 'c':
      return { label: 'C Standard (GCC)', icon: Cpu, color: 'text-blue-400 bg-blue-400/10 border-blue-400/30' };
    case 'cpp':
      return { label: 'C++20 (G++)', icon: Cpu, color: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/30' };
    case 'react':
      return { label: 'React', icon: Atom, color: 'text-sky-400 bg-sky-400/10 border-sky-400/30' };
    case 'nodejs':
      return { label: 'Node.js', icon: Server, color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' };
    case 'python':
      return { label: 'Python 3', icon: Terminal, color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30' };
    case 'go':
      return { label: 'Go', icon: Zap, color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30' };
    default:
      return { label: 'Blank', icon: FileCode, color: 'text-slate-300 bg-slate-400/10 border-slate-400/30' };
  }
};

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  project,
  activeFileId,
  onOpenInviteModal,
  onToggleAiPanel,
  isAiPanelOpen,
  onToggleExtensionsPanel,
  isExtensionsPanelOpen = false,
  onOpenHistory,
  onOpenSnapshot,
  onRunCode,
  isRunningCode = false,
}) => {
  const { dirtyFileIds, isSaving, saveAllDirtyFiles } = useFileStore();
  const { collaborators } = useCollaborationStore();
  const badge = getTemplateBadge(project?.template);
  const TemplateIcon = badge.icon;

  return (
    <header className="h-12 border-b border-editor-border bg-surface-300/90 backdrop-blur-xl px-4 flex items-center justify-between shrink-0 select-none">
      {/* Left Breadcrumb & Workspace Info */}
      <div className="flex items-center gap-3 min-w-0">
        <Link
          to="/dashboard"
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-surface-200 transition-colors"
          title="Back to Dashboard"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>

        <span className="text-slate-600">/</span>

        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-bold text-white truncate max-w-[180px] sm:max-w-xs font-sans">
            {project?.name || 'Workspace'}
          </span>

          {/* Template Badge */}
          <span
            className={`hidden sm:inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-mono font-medium border ${badge.color}`}
          >
            <TemplateIcon className="h-3 w-3" />
            <span>{badge.label}</span>
          </span>

          {/* Visibility */}
          {project?.visibility === 'public' ? (
            <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-mono text-sky-400">
              <Globe className="h-3 w-3" /> Public
            </span>
          ) : (
            <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-mono text-slate-400">
              <Lock className="h-3 w-3" /> Private
            </span>
          )}
        </div>
      </div>

      {/* Right Action Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Live Collaborators Presence Stack */}
        <div className="hidden lg:flex items-center mr-1">
          <CollaboratorPresenceBar
            collaborators={collaborators}
            activeFileId={activeFileId}
          />
        </div>

        {/* Save Button */}
        {dirtyFileIds.length > 0 && (
          <button
            onClick={saveAllDirtyFiles}
            disabled={isSaving}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-surface-200 hover:bg-surface-100 text-gold-300 border border-gold-400/40 px-3 py-1.5 text-xs font-medium transition-all"
            title="Save changes (Ctrl+S)"
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            <span>Save</span>
          </button>
        )}

        {/* Snapshot / Version History Button */}
        {onOpenSnapshot && (
          <button
            onClick={onOpenSnapshot}
            className="hidden lg:inline-flex items-center gap-1.5 rounded-lg bg-surface-200 hover:bg-surface-100 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white border border-surface-50 transition-all"
            title="Take a point-in-time snapshot"
          >
            <Camera className="h-3.5 w-3.5 text-gold-400" />
            <span className="hidden xl:inline">Snapshot</span>
          </button>
        )}

        {onOpenHistory && (
          <button
            onClick={onOpenHistory}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-surface-200 hover:bg-surface-100 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white border border-surface-50 transition-all"
            title="View point-in-time version history & snapshots"
          >
            <History className="h-3.5 w-3.5 text-gold-400" />
            <span className="hidden md:inline">History</span>
          </button>
        )}

        {/* Invite Button */}
        <button
          onClick={onOpenInviteModal}
          className="inline-flex items-center gap-1.5 rounded-lg bg-surface-200 hover:bg-surface-100 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white border border-surface-50 transition-all"
        >
          <Share2 className="h-3.5 w-3.5 text-sky-400" />
          <span className="hidden sm:inline">Collaborate</span>
        </button>

        {/* Extensions Marketplace Button */}
        {onToggleExtensionsPanel && (
          <button
            onClick={onToggleExtensionsPanel}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border transition-all ${
              isExtensionsPanelOpen
                ? 'bg-gold-400/20 text-gold-300 border-gold-400/40 shadow-sm'
                : 'bg-surface-200 text-slate-300 border-surface-50 hover:text-white'
            }`}
            title="Manage Language Compilers & Extensions (Default: C & C++)"
          >
            <Boxes className="h-3.5 w-3.5 text-gold-400" />
            <span className="hidden xl:inline">Extensions</span>
          </button>
        )}

        {/* AI Assistant Toggle Button */}
        <button
          onClick={onToggleAiPanel}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border transition-all ${
            isAiPanelOpen
              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm'
              : 'bg-surface-200 text-slate-300 border-surface-50 hover:text-white'
          }`}
        >
          <Bot className="h-3.5 w-3.5 text-purple-400" />
          <span className="hidden md:inline">AI Pair</span>
        </button>

        {/* Run Code Button */}
        <button
          onClick={onRunCode}
          disabled={isRunningCode}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md hover:shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {isRunningCode ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Play className="h-3.5 w-3.5 fill-white" />
          )}
          <span>Run</span>
        </button>
      </div>
    </header>
  );
};
