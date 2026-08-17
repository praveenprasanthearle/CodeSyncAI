import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Lock,
  Globe,
  Loader2,
  Save,
} from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import { IProject, ProjectVisibility } from '../../types';

interface ProjectSettingsModalProps {
  isOpen: boolean;
  project: IProject | null;
  onClose: () => void;
}

export const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
  isOpen,
  project,
  onClose,
}) => {
  const { updateProject, isActionLoading } = useProjectStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<ProjectVisibility>('private');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (project) {
      setName(project.name || '');
      setDescription(project.description || '');
      setVisibility(project.visibility || 'private');
      setTags(project.tags || []);
      setError(null);
    }
  }, [project]);

  if (!isOpen || !project) return null;

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
      await updateProject(project.id, {
        name: name.trim(),
        description: description.trim(),
        visibility,
        tags,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update project settings.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto glass-card rounded-2xl border border-surface-50 p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200 custom-scrollbar">
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
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">Workspace Settings</h3>
            <p className="text-xs text-slate-400">Configure visibility, metadata, and tags</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-300 mb-1 font-medium">Project Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-surface-50 bg-surface-300/80 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-gold-400 focus:outline-none focus:ring-1 focus:ring-gold-400 transition-colors"
              maxLength={60}
            />
          </div>

          <div>
            <label className="block text-xs text-slate-300 mb-1 font-medium">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description..."
              className="w-full rounded-lg border border-surface-50 bg-surface-300/80 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-gold-400 focus:outline-none focus:ring-1 focus:ring-gold-400 transition-colors resize-none"
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

          {/* Tags */}
          <div>
            <label className="block text-xs text-slate-300 mb-1 font-medium">Tags (Up to 5)</label>
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
                  className="flex-1 min-w-[100px] bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
                />
              )}
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
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-gold-500 to-gold-400 px-4 py-2 text-xs font-semibold text-background shadow-md hover:shadow-gold-glow hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {isActionLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
