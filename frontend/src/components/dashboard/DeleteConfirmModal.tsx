import React, { useState } from 'react';
import { X, AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import { IProject } from '../../types';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  project: IProject | null;
  onClose: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  project,
  onClose,
}) => {
  const { deleteProject, isActionLoading } = useProjectStore();
  const [confirmName, setConfirmName] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !project) return null;

  const isConfirmed = confirmName.trim() === project.name.trim();

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirmed) return;

    setError(null);
    try {
      await deleteProject(project.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete workspace.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md glass-card rounded-2xl border border-rose-500/30 p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-lg p-1.5 text-slate-400 hover:bg-surface-200 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Delete Workspace</h3>
            <p className="text-xs text-rose-300/80">This action cannot be undone</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          Are you sure you want to permanently delete{' '}
          <span className="font-bold text-white font-mono bg-surface-200 px-1.5 py-0.5 rounded border border-surface-50">
            {project.name}
          </span>
          ? All files, collaborative state, and history will be erased.
        </p>

        <form onSubmit={handleDelete} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">
              Type <span className="font-semibold text-white font-mono">{project.name}</span> to confirm:
            </label>
            <input
              type="text"
              required
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={project.name}
              className="w-full rounded-lg border border-surface-50 bg-surface-300/80 px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-50/60">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-medium text-slate-400 hover:bg-surface-200 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isConfirmed || isActionLoading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 px-4 py-2 text-xs font-semibold text-white shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isActionLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Permanently</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
