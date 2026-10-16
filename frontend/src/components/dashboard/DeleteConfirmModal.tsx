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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md glass-card rounded-2xl border border-rose-200 p-6 sm:p-7 shadow-glass-dropdown animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 border border-rose-200 text-rose-600">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Delete project</h2>
            <p className="text-[11px] text-rose-600">This action is permanent and cannot be undone</p>
          </div>
        </div>

        {error && (
          <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
            {error}
          </div>
        )}

        <p className="text-xs text-slate-600 leading-relaxed mb-3">
          Are you sure you want to delete{' '}
          <span className="font-semibold text-slate-900 font-mono bg-slate-100 px-1 py-0.5 rounded border border-slate-200">
            {project.name}
          </span>
          ? All files, history, and collaborative state will be erased.
        </p>

        <form onSubmit={handleDelete} className="space-y-3">
          <div>
            <label className="block text-xs text-slate-600 mb-1">
              Type <span className="font-semibold text-slate-900 font-mono">{project.name}</span> to confirm:
            </label>
            <input
              type="text"
              required
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={project.name}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono"
            />
          </div>

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
              disabled={!isConfirmed || isActionLoading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isActionLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete project</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
