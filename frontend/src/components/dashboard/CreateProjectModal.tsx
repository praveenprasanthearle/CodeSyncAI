import React, { useState } from 'react';
import {
  X,
  Lock,
  Globe,
  Loader2,
  Atom,
  Server,
  Terminal,
  Cpu,
  Zap,
  FileCode,
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
    name: 'C (GCC)',
    category: 'C17 standard',
    icon: Cpu,
    description: 'C compiler with stdio, POSIX, and makefile support.',
    color: 'bg-blue-50 border-blue-200 text-blue-600',
    badge: 'Core',
  },
  {
    id: 'cpp',
    name: 'C++ (G++)',
    category: 'C++20 standard',
    icon: Cpu,
    description: 'C++ compiler with full standard template library (STL).',
    color: 'bg-indigo-50 border-indigo-200 text-indigo-600',
    badge: 'Core',
  },
  {
    id: 'python',
    name: 'Python',
    category: 'Python 3',
    icon: Terminal,
    description: 'Python environment for algorithms, scripting, and web.',
    color: 'bg-amber-50 border-amber-200 text-amber-600',
    badge: 'Extension',
  },
  {
    id: 'nodejs',
    name: 'Node.js',
    category: 'Express backend',
    icon: Server,
    description: 'Node.js runtime with Express server starter.',
    color: 'bg-emerald-50 border-emerald-200 text-emerald-600',
    badge: 'Extension',
  },
  {
    id: 'react',
    name: 'React',
    category: 'Vite + React 18',
    icon: Atom,
    description: 'Frontend SPA starter with Vite and React.',
    color: 'bg-sky-50 border-sky-200 text-sky-600',
    badge: 'Extension',
  },
  {
    id: 'go',
    name: 'Go',
    category: 'Go runtime',
    icon: Zap,
    description: 'Go runtime with go.mod dependency setup.',
    color: 'bg-cyan-50 border-cyan-200 text-cyan-600',
    badge: 'Extension',
  },
  {
    id: 'blank',
    name: 'Blank',
    category: 'Empty workspace',
    icon: FileCode,
    description: 'Empty project to craft custom files from scratch.',
    color: 'bg-slate-50 border-slate-200 text-slate-600',
    badge: 'Blank',
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
      setError('Please provide a project name.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto glass-card rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-glass-dropdown animate-in zoom-in-95 duration-150 custom-scrollbar">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Title */}
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">New project</h2>
          <p className="text-xs text-slate-500">Configure your cloud development environment</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Template Selection */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">
              Template
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TEMPLATES.map((t) => {
                const Icon = t.icon;
                const isSelected = template === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTemplate(t.id)}
                    className={`relative text-left p-2.5 rounded-xl border transition-all text-xs flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-600 shadow-xs'
                        : 'border-slate-200 bg-white/70 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className={`p-1.5 rounded-lg border ${t.color}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      {isSelected && <Check className="h-3.5 w-3.5 text-blue-600 stroke-[3]" />}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 truncate">{t.name}</div>
                      <div className="text-[10px] text-slate-500 truncate">{t.category}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Project Details */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Project name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-awesome-app"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors"
              maxLength={60}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of this project..."
              rows={2}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 resize-none transition-colors"
              maxLength={200}
            />
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Visibility</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setVisibility('private')}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-xs transition-colors ${
                  visibility === 'private'
                    ? 'border-blue-600 bg-blue-50/70 text-slate-900 font-medium'
                    : 'border-slate-200 bg-white/70 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Lock className="h-3.5 w-3.5 text-slate-500" />
                <div>
                  <div className="font-semibold text-slate-900">Private</div>
                  <div className="text-[10px] text-slate-500">Only invited members</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setVisibility('public')}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-xs transition-colors ${
                  visibility === 'public'
                    ? 'border-blue-600 bg-blue-50/70 text-slate-900 font-medium'
                    : 'border-slate-200 bg-white/70 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Globe className="h-3.5 w-3.5 text-sky-500" />
                <div>
                  <div className="font-semibold text-slate-900">Public</div>
                  <div className="text-[10px] text-slate-500">Accessible by link</div>
                </div>
              </button>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Tags (press Enter)</label>
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-mono text-slate-700 border border-slate-200"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            {tags.length < 5 && (
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Add tag..."
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none font-mono"
              />
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isActionLoading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              {isActionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Create project</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
