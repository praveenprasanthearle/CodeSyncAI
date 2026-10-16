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
    <div className="fixed inset-y-0 right-0 z-50 w-96 bg-white border-l border-slate-200/80 shadow-glass-dropdown flex flex-col animate-in slide-in-from-right duration-200 select-none">
      {/* Header */}
      <div className="h-12 px-4 border-b border-slate-200/80 bg-slate-50/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">Version History</h3>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            {snapshots.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCreateSnapshot}
            className="text-[11px] font-medium text-white bg-slate-900 hover:bg-slate-800 px-2.5 py-1 rounded-md transition-colors shadow-xs"
          >
            + New Snapshot
          </button>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1 rounded-md transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {restoreSuccess && (
        <div className="p-3 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-600" />
          <span>Workspace files successfully restored to snapshot state!</span>
        </div>
      )}

      {/* Snapshot List & Detail View */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar text-xs font-sans">
        {isLoading && snapshots.length === 0 ? (
          <div className="flex items-center justify-center p-8 text-slate-500 font-mono text-xs">
            <Loader2 className="h-4 w-4 animate-spin mr-2 text-blue-600" />
            <span>Loading version history...</span>
          </div>
        ) : snapshots.length === 0 ? (
          <div className="text-center p-8 space-y-3">
            <History className="h-10 w-10 text-slate-400 mx-auto" />
            <p className="text-slate-700 font-medium">No snapshots taken yet.</p>
            <p className="text-slate-500 text-[11px]">
              Capture milestone commits to rollback code at any time.
            </p>
            <button
              onClick={onOpenCreateSnapshot}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-all shadow-xs"
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
                    ? 'border-blue-400/80 bg-blue-50/30 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
                }`}
              >
                {/* Top Title & Commit */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-blue-50 text-blue-600 border border-blue-200">
                      <GitCommit className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 text-xs">{snap.name}</h4>
                      <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                        <Calendar className="h-3 w-3 text-slate-400" />
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
                    className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                    title="Delete snapshot"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {snap.description && (
                  <p className="text-[11px] text-slate-600 font-mono pl-6">
                    {snap.description}
                  </p>
                )}

                {/* Metadata Pills */}
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <FileCode2 className="h-3 w-3 text-blue-600" />
                      {snap.fileCount} files
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <HardDrive className="h-3 w-3 text-slate-400" />
                      {(snap.totalSizeBytes / 1024).toFixed(1)} KB
                    </span>
                  </div>

                  <span className="text-slate-500">by {snap.createdBy?.name || 'User'}</span>
                </div>

                {/* Restore Confirmation Box */}
                {isConfirming ? (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 space-y-2">
                    <div className="flex items-center gap-1.5 text-amber-800 text-[11px] font-medium">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      <span>Overwrite current workspace with this version?</span>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setConfirmRestoreId(null)}
                        className="px-2 py-1 rounded bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 text-[10px]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleRestore(snap)}
                        disabled={isRestoring}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-medium text-[10px] transition-all"
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
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-mono transition-colors"
                    >
                      {isSelected ? 'Hide Files' : 'View Files'}
                    </button>
                    <button
                      onClick={() => setConfirmRestoreId(snap.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-mono transition-colors"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Restore</span>
                    </button>
                  </div>
                )}

                {/* Expanded Captured Files List */}
                {isSelected && snap.files && (
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 space-y-1 font-mono text-[10px] text-slate-700">
                    <span className="font-semibold text-blue-600 block mb-1">
                      Captured Snapshot Files:
                    </span>
                    {snap.files.map((f, idx) => (
                      <div key={idx} className="truncate text-slate-600 flex items-center gap-1">
                        <FileCode2 className="h-3 w-3 text-slate-400 shrink-0" />
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
