import React, { useEffect, useState } from 'react';
import {
  History,
  GitCommit,
  RotateCcw,
  Trash2,
  X,
  FileCode2,
  Check,
  AlertTriangle,
  Loader2,
  Calendar,
  HardDrive,
} from 'lucide-react';
import { useSnapshotStore, ISnapshot } from '../../stores/snapshotStore';
import { useFileStore } from '../../stores/fileStore';

interface VersionHistoryDrawerProps {
  isOpen: boolean;
  projectId: string;
  onClose: () => void;
  onOpenCreateSnapshot: () => void;
}

export const VersionHistoryDrawer: React.FC<VersionHistoryDrawerProps> = ({
  isOpen,
  projectId,
  onClose,
  onOpenCreateSnapshot,
}) => {
  const {
    snapshots,
    isLoading,
    isRestoring,
    selectedSnapshot,
    fetchSnapshots,
    restoreSnapshot,
    deleteSnapshot,
    setSelectedSnapshot,
  } = useSnapshotStore();

  const { fetchProjectFiles } = useFileStore();

  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && projectId) {
      fetchSnapshots(projectId);
    }
  }, [isOpen, projectId, fetchSnapshots]);

  if (!isOpen) return null;

  const handleRestore = async (snapshot: ISnapshot) => {
    try {
      await restoreSnapshot(snapshot.id);
      await fetchProjectFiles(projectId);
      setRestoreSuccess(true);
      setConfirmRestoreId(null);
      setTimeout(() => {
        setRestoreSuccess(false);
      }, 2500);
    } catch (err) {
      console.error('Failed to restore snapshot:', err);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-96 bg-surface-300 border-l border-editor-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 select-none">
      {/* Header */}
      <div className="h-12 px-4 border-b border-editor-border bg-surface-400 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-gold-400" />
          <h3 className="text-sm font-bold text-white">Version History</h3>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-surface-200 text-slate-300 border border-surface-50">
            {snapshots.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCreateSnapshot}
            className="text-[11px] font-bold text-background bg-gold-400 hover:bg-gold-300 px-2.5 py-1 rounded transition-colors"
          >
            + New Snapshot
          </button>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {restoreSuccess && (
        <div className="p-3 bg-emerald-950/60 border-b border-emerald-800/40 text-emerald-300 text-xs flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>Workspace files successfully restored to snapshot state!</span>
        </div>
      )}

      {/* Snapshot List & Detail View */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-xs font-sans">
        {isLoading && snapshots.length === 0 ? (
          <div className="flex items-center justify-center p-8 text-slate-500 font-mono text-xs">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span>Loading version history...</span>
          </div>
        ) : snapshots.length === 0 ? (
          <div className="text-center p-8 space-y-3">
            <History className="h-10 w-10 text-slate-600 mx-auto" />
            <p className="text-slate-400 font-medium">No snapshots taken yet.</p>
            <p className="text-slate-500 text-[11px]">
              Capture milestone commits to rollback code at any time.
            </p>
            <button
              onClick={onOpenCreateSnapshot}
              className="px-3 py-1.5 rounded-lg bg-gold-400 hover:bg-gold-300 text-background font-bold text-xs transition-all shadow-sm"
            >
              Take First Snapshot
            </button>
          </div>
        ) : (
          snapshots.map((snap) => {
            const isSelected = selectedSnapshot?.id === snap.id;
            const isConfirming = confirmRestoreId === snap.id;

            return (
              <div
                key={snap.id}
                className={`rounded-xl border transition-all p-3 space-y-2.5 ${
                  isSelected
                    ? 'border-gold-400/60 bg-surface-200/90 shadow-md'
                    : 'border-surface-50 bg-surface-400/60 hover:border-surface-50/90'
                }`}
              >
                {/* Top Title & Commit */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-gold-400/10 text-gold-400 border border-gold-400/30">
                      <GitCommit className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-xs">{snap.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                        <Calendar className="h-3 w-3 text-slate-500" />
                        {new Date(snap.createdAt).toLocaleDateString()}{' '}
                        {new Date(snap.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteSnapshot(snap.id)}
                    className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                    title="Delete snapshot"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {snap.description && (
                  <p className="text-[11px] text-slate-300 font-mono pl-6">
                    {snap.description}
                  </p>
                )}

                {/* Metadata Pills */}
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-surface-50/60">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <FileCode2 className="h-3 w-3 text-sky-400" />
                      {snap.fileCount} files
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <HardDrive className="h-3 w-3 text-slate-500" />
                      {(snap.totalSizeBytes / 1024).toFixed(1)} KB
                    </span>
                  </div>

                  <span className="text-slate-400">by {snap.createdBy?.name || 'User'}</span>
                </div>

                {/* Restore Confirmation Box */}
                {isConfirming ? (
                  <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/40 space-y-2">
                    <div className="flex items-center gap-1.5 text-amber-300 text-[11px] font-semibold">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <span>Overwrite current workspace with this version?</span>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setConfirmRestoreId(null)}
                        className="px-2 py-1 rounded bg-surface-200 text-slate-300 hover:text-white text-[10px]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleRestore(snap)}
                        disabled={isRestoring}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] transition-all"
                      >
                        {isRestoring ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RotateCcw className="h-3 w-3" />
                        )}
                        <span>Yes, Restore</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() =>
                        setSelectedSnapshot(isSelected ? null : snap)
                      }
                      className="px-2 py-1 rounded bg-surface-200 hover:bg-surface-100 text-slate-300 text-[10px] font-mono transition-colors"
                    >
                      {isSelected ? 'Hide Files' : 'View Files'}
                    </button>
                    <button
                      onClick={() => setConfirmRestoreId(snap.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-gold-400/10 hover:bg-gold-400/20 text-gold-300 border border-gold-400/30 text-[10px] font-mono transition-colors"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Restore</span>
                    </button>
                  </div>
                )}

                {/* Expanded Captured Files List */}
                {isSelected && snap.files && (
                  <div className="p-2 rounded-lg bg-surface-300 border border-surface-50 space-y-1 font-mono text-[10px] text-slate-300">
                    <span className="font-semibold text-gold-400 block mb-1">
                      Captured Snapshot Files:
                    </span>
                    {snap.files.map((f, idx) => (
                      <div key={idx} className="truncate text-slate-300 flex items-center gap-1">
                        <FileCode2 className="h-3 w-3 text-slate-500 shrink-0" />
                        <span className="truncate">{f.path}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
