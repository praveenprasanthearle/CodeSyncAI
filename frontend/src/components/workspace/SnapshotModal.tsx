import React, { useState } from 'react';
import { Camera, X, Loader2, GitCommit, Check } from 'lucide-react';
import { useSnapshotStore } from '../../stores/snapshotStore';

interface SnapshotModalProps {
  isOpen: boolean;
  projectId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SnapshotModal: React.FC<SnapshotModalProps> = ({
  isOpen,
  projectId,
  onClose,
  onSuccess,
}) => {
  const { createSnapshot, isLoading } = useSnapshotStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setError(null);
    try {
      await createSnapshot(projectId, name.trim(), description.trim());
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setName('');
        setDescription('');
        if (onSuccess) onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to capture snapshot');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl border border-surface-50 bg-surface-300 p-6 shadow-2xl space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gold-400/10 text-gold-400 border border-gold-400/30">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Create Version Snapshot</h3>
              <p className="text-xs text-slate-400">Save full point-in-time state of all workspace files</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-surface-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/40 text-xs text-rose-300">
            {error}
          </div>
        )}

        {isSuccess ? (
          <div className="py-6 flex flex-col items-center justify-center space-y-2 text-center">
            <div className="h-10 w-10 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
              <Check className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-white">Snapshot Captured Successfully!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 font-mono">
                Snapshot Title / Commit Message *
              </label>
              <div className="relative">
                <GitCommit className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. v1.1.0 - Refactored CRDT sync"
                  className="w-full rounded-lg border border-surface-50 bg-surface-200 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-gold-400 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 font-mono">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details of changes made in this milestone..."
                rows={3}
                className="w-full rounded-lg border border-surface-50 bg-surface-200 p-3 text-xs text-white placeholder-slate-500 focus:border-gold-400 focus:outline-none resize-none font-mono custom-scrollbar"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-surface-50 bg-surface-200 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isLoading || !name.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gold-400 hover:bg-gold-300 text-xs font-bold text-background transition-all shadow-md disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Capturing...</span>
                  </>
                ) : (
                  <>
                    <Camera className="h-3.5 w-3.5" />
                    <span>Create Snapshot</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
