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
      return { label: 'C (GCC)', icon: Cpu, color: 'text-blue-600 bg-blue-50 border-blue-200' };
    case 'cpp':
      return { label: 'C++20 (G++)', icon: Cpu, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' };
    case 'react':
      return { label: 'React', icon: Atom, color: 'text-sky-600 bg-sky-50 border-sky-200' };
    case 'nodejs':
      return { label: 'Node.js', icon: Server, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
    case 'python':
      return { label: 'Python 3', icon: Terminal, color: 'text-amber-600 bg-amber-50 border-amber-200' };
    case 'go':
      return { label: 'Go', icon: Zap, color: 'text-cyan-600 bg-cyan-50 border-cyan-200' };
    default:
      return { label: 'Blank', icon: FileCode, color: 'text-slate-600 bg-slate-50 border-slate-200' };
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
    <header className="h-11 border-b border-slate-200/80 bg-white/85 backdrop-blur-md px-3.5 flex items-center justify-between shrink-0 select-none text-slate-800">
      {/* Left Breadcrumb & Workspace Info */}
      <div className="flex items-center gap-2.5 min-w-0">
        <Link
          to="/dashboard"
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 px-1.5 py-1 rounded-md hover:bg-slate-100 transition-colors"
          title="Back to Dashboard"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline font-medium">Projects</span>
        </Link>

        <span className="text-slate-300">/</span>

        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-semibold text-slate-900 truncate max-w-[160px] sm:max-w-xs font-sans">
            {project?.name || 'Workspace'}
          </span>

          {/* Template Badge */}
          <span
            className={`hidden sm:inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-mono font-medium border ${badge.color}`}
          >
            <TemplateIcon className="h-3 w-3" />
            <span>{badge.label}</span>
          </span>

          {/* Visibility */}
          {project?.visibility === 'public' ? (
            <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-mono text-sky-600">
              <Globe className="h-3 w-3" /> Public
            </span>
          ) : (
            <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-mono text-slate-500">
              <Lock className="h-3 w-3" /> Private
            </span>
          )}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {/* Collaborators Presence Bar */}
        <div className="flex items-center mr-1">
          <CollaboratorPresenceBar
            collaborators={collaborators}
            activeFileId={activeFileId}
            onOpenInviteModal={onOpenInviteModal}
          />
        </div>

        {/* Save Button */}
        {dirtyFileIds.length > 0 && (
          <button
            onClick={saveAllDirtyFiles}
            disabled={isSaving}
            className="inline-flex items-center gap-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 text-xs font-medium transition-all"
            title="Save changes (Ctrl+S)"
          >
            {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            <span>Save</span>
          </button>
        )}

        {/* Snapshot */}
        {onOpenSnapshot && (
          <button
            onClick={onOpenSnapshot}
            className="hidden lg:inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition-all"
            title="Snapshot"
          >
            <Camera className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden xl:inline">Snapshot</span>
          </button>
        )}

        {/* History */}
        {onOpenHistory && (
          <button
            onClick={onOpenHistory}
            className="hidden sm:inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition-all"
            title="History"
          >
            <History className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden md:inline">History</span>
          </button>
        )}

        {/* Invite / Share */}
        <button
          onClick={onOpenInviteModal}
          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition-all"
          title="Share workspace"
        >
          <Share2 className="h-3.5 w-3.5 text-slate-500" />
          <span className="hidden sm:inline">Share</span>
        </button>

        {/* Extensions */}
        {onToggleExtensionsPanel && (
          <button
            onClick={onToggleExtensionsPanel}
            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium border transition-all ${
              isExtensionsPanelOpen
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title="Extensions"
          >
            <Boxes className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">Extensions</span>
          </button>
        )}

        {/* AI Assistant */}
        <button
          onClick={onToggleAiPanel}
          className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium border transition-all ${
            isAiPanelOpen
              ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
          title="AI Assistant"
        >
          <Bot className="h-3.5 w-3.5 text-blue-600" />
          <span className="hidden md:inline">AI</span>
        </button>

        {/* Run Button */}
        <button
          onClick={onRunCode}
          disabled={isRunningCode}
          className="inline-flex items-center gap-1 rounded-md bg-emerald-600 hover:bg-emerald-700 px-3 py-1 text-xs font-medium text-white shadow-xs transition-all disabled:opacity-50"
          title="Run code (Ctrl+Enter)"
        >
          {isRunningCode ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Play className="h-3 w-3 fill-white" />
          )}
          <span>Run</span>
        </button>
      </div>
    </header>
  );
};
