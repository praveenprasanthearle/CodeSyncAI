import React, { useState } from 'react';
import {
  X,
  Plus,
  Lock,
  Globe,
  Loader2,
  Atom,
  Server,
  Terminal,
  Cpu,
  Zap,
  FileCode,
  Sparkles,
  Check,
} from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import { ProjectTemplate, ProjectVisibility } from '../../types';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (projectId: string) => void;
}

interface TemplateOption {
  id: ProjectTemplate;
  name: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
  badge: string;
}

const TEMPLATES: TemplateOption[] = [
  {
    id: 'c',
    name: 'C Standard (GCC)',
    category: 'Default Core Compiler',
    icon: Cpu,
    description: 'Default built-in C17/C11 compiler with stdio, POSIX standards, and Makefile support.',
    color: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400',
    badge: 'Default Built-in',
  },
  {
    id: 'cpp',
    name: 'C++ Systems (G++)',
    category: 'Default Core Compiler',
    icon: Cpu,
    description: 'Default built-in C++20 compiler with full Standard Template Library (STL).',
    color: 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/30 text-indigo-400',
    badge: 'Default Built-in',
  },
  {
    id: 'python',
    name: 'Python 3',
    category: 'Scripting & AI',
    icon: Terminal,
    description: 'Python 3.11+ environment for algorithms, scripting, and data structures.',
    color: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 text-yellow-400',
    badge: 'Extension Pack',
  },
  {
    id: 'nodejs',
    name: 'Node.js & Express',
    category: 'Backend Service',
    icon: Server,
    description: 'REST API boilerplate with Express, CORS, and modular architecture.',
    color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400',
    badge: 'Extension Pack',
  },
  {
    id: 'react',
    name: 'React + Vite',
    category: 'Frontend App',
    icon: Atom,
    description: 'Modern SPA with Vite, React 18, and styling ready out of the box.',
    color: 'from-sky-500/20 to-sky-600/10 border-sky-500/30 text-sky-400',
    badge: 'Extension Pack',
  },
  {
    id: 'go',
    name: 'Go Engine',
    category: 'Microservices',
    icon: Zap,
    description: 'Concurrent Go runtime with go.mod dependency setup and goroutines.',
    color: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-400',
    badge: 'Extension Pack',
  },
  {
    id: 'blank',
    name: 'Blank Workspace',
    category: 'Empty Canvas',
    icon: FileCode,
    description: 'Empty project structure to craft custom files from scratch.',
    color: 'from-slate-500/20 to-slate-600/10 border-slate-500/30 text-slate-300',
    badge: 'Clean Slate',
  },
];

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { createProject, isActionLoading } = useProjectStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [template, setTemplate] = useState<ProjectTemplate>('c');
  const [visibility, setVisibility] = useState<ProjectVisibility>('private');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['frontend']);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const cleaned = tagInput.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
      if (cleaned && !tags.includes(cleaned) && tags.length < 5) {
        setTags([...tags, cleaned]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide a valid project name.');
      return;
    }

    try {
      const project = await createProject({
        name: name.trim(),
        description: description.trim(),
        template,
        visibility,
        tags,
      });
      onSuccess(project.id);
    } catch (err: any) {
      setError(err.message || 'Failed to create project.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-card rounded-2xl border border-surface-50 p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200 custom-scrollbar">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-lg p-1.5 text-slate-400 hover:bg-surface-200 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-200 border border-gold-400/30 text-gold-300 shadow-gold-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">Create New Workspace</h3>
            <p className="text-xs text-slate-400">Initialize a collaborative cloud development project</p>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Template Selection Cards */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold mb-2.5">
              1. Choose Environment Template
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TEMPLATES.map((t) => {
                const Icon = t.icon;
                const isSelected = template === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTemplate(t.id)}
                    className={`relative text-left p-3.5 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                      isSelected
                        ? 'border-gold-400 bg-surface-200/90 shadow-gold-sm ring-1 ring-gold-400'
                        : 'border-surface-50 bg-surface-300/40 hover:border-slate-600 hover:bg-surface-200/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-lg bg-surface-300/80 border ${t.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">{t.name}</div>
                          <div className="text-[10px] font-mono text-slate-400">{t.category}</div>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gold-400 text-background">
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{t.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Project Details */}
          <div className="space-y-4">
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
              2. Workspace Details
            </label>

            <div>
              <label className="block text-xs text-slate-300 mb-1 font-medium">Project Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Distributed-Vector-Sync"
                className="w-full rounded-lg border border-surface-50 bg-surface-300/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-gold-400 focus:outline-none focus:ring-1 focus:ring-gold-400 transition-colors"
                maxLength={60}
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1 font-medium">Description (Optional)</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of the workspace goals and architecture..."
                className="w-full rounded-lg border border-surface-50 bg-surface-300/80 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-gold-400 focus:outline-none focus:ring-1 focus:ring-gold-400 transition-colors resize-none"
                maxLength={300}
              />
            </div>

            {/* Visibility Selector */}
            <div>
              <label className="block text-xs text-slate-300 mb-2 font-medium">Access & Visibility</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setVisibility('private')}
                  className={`flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all ${
                    visibility === 'private'
                      ? 'border-gold-400 bg-surface-200/90 text-white ring-1 ring-gold-400'
                      : 'border-surface-50 bg-surface-300/40 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <Lock className="h-4 w-4 text-gold-400 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-white">Private</div>
                    <div className="text-[10px] text-slate-400">Only invited collaborators</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setVisibility('public')}
                  className={`flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all ${
                    visibility === 'public'
                      ? 'border-gold-400 bg-surface-200/90 text-white ring-1 ring-gold-400'
                      : 'border-surface-50 bg-surface-300/40 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <Globe className="h-4 w-4 text-sky-400 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-white">Public</div>
                    <div className="text-[10px] text-slate-400">Anyone with link can view</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Tags Input */}
            <div>
              <label className="block text-xs text-slate-300 mb-1 font-medium">
                Tags (Up to 5)
              </label>
              <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-lg border border-surface-50 bg-surface-300/80 min-h-[42px]">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded bg-gold-400/10 px-2 py-0.5 text-xs font-mono font-medium text-gold-300 border border-gold-400/20"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-gold-100 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {tags.length < 5 && (
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder={tags.length === 0 ? "Type tag & press Enter" : "Add tag..."}
                    className="flex-1 min-w-[120px] bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-50/60">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-medium text-slate-400 hover:bg-surface-200 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isActionLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-gold-500 to-gold-400 px-5 py-2 text-xs font-semibold text-background shadow-md hover:shadow-gold-glow hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {isActionLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Provisioning Workspace...</span>
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create Workspace</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
