import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Globe,
  Loader2,
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
      setError('Please provide a project name.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto glass-card rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-glass-dropdown animate-in zoom-in-95 duration-150 custom-scrollbar">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Title */}
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Project settings</h2>
          <p className="text-xs text-slate-500">Configure name, visibility, and tags</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Project name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors"
              maxLength={60}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 resize-none transition-colors"
              maxLength={200}
            />
          </div>

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

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
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
              className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              {isActionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Save changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
