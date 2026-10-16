import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Shield,
  Trash2,
  Copy,
  Check,
  Loader2,
  Link as LinkIcon,
  Crown,
} from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import { useAuthStore } from '../../stores/authStore';
import { IProject, ProjectRole } from '../../types';

interface ProjectMembersModalProps {
  isOpen: boolean;
  project: IProject | null;
  onClose: () => void;
}

export const ProjectMembersModal: React.FC<ProjectMembersModalProps> = ({
  isOpen,
  project,
  onClose,
}) => {
  const { user: currentUser } = useAuthStore();
  const { addMember, removeMember, updateMemberRole, isActionLoading } = useProjectStore();

  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('editor');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !project) return null;

  const isOwner = currentUser?.id === project.owner?.id || project.userRole === 'owner';
  const members = project.members || [];

  const handleCopyLink = () => {
    const inviteUrl = `${window.location.origin}/workspace/${project.id}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!emailOrUsername.trim()) {
      setError('Please enter a username or email address.');
      return;
    }

    try {
      await addMember(project.id, emailOrUsername.trim(), role);
      setEmailOrUsername('');
      setSuccessMsg(`Invited collaborator as ${role}.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to invite collaborator.');
    }
  };

  const handleRemove = async (userId: string) => {
    setError(null);
    try {
      await removeMember(project.id, userId);
    } catch (err: any) {
      setError(err.message || 'Failed to remove collaborator.');
    }
  };

  const handleRoleChange = async (userId: string, newRole: ProjectRole) => {
    setError(null);
    try {
      await updateMemberRole(project.id, userId, newRole);
    } catch (err: any) {
      setError(err.message || 'Failed to update member role.');
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
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Members</h2>
          <p className="text-xs text-slate-500">
            Collaborators on <span className="font-semibold text-slate-800">{project.name}</span>
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-700">
            {successMsg}
          </div>
        )}

        {/* Quick Link Share Bar */}
        <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50/70 p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <LinkIcon className="h-4 w-4 text-slate-400 shrink-0" />
            <div className="truncate text-xs font-mono text-slate-600">
              {window.location.origin}/workspace/{project.id}
            </div>
          </div>
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shrink-0"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy link</span>
              </>
            )}
          </button>
        </div>

        {/* Invite Form */}
        {isOwner && (
          <form onSubmit={handleInvite} className="mb-5 space-y-2">
            <label className="block text-xs font-medium text-slate-700">
              Invite collaborator
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                placeholder="colleague@codesync.ai or @username"
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-600 focus:outline-none cursor-pointer"
              >
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
              <button
                type="submit"
                disabled={isActionLoading}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                {isActionLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <UserPlus className="h-3.5 w-3.5" />
                )}
                <span>Invite</span>
              </button>
            </div>
          </form>
        )}

        {/* Members List */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-700">
            Members ({members.length})
          </label>

          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden">
            {members.map((member, index) => {
              const u = member.user;
              const isMemberOwner = member.role === 'owner';

              return (
                <div
                  key={u?.id || index}
                  className="flex items-center justify-between p-3 hover:bg-slate-50/60 transition-colors text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    {u?.avatarUrl ? (
                      <img
                        src={u.avatarUrl}
                        alt={u.name || 'User'}
                        className="h-7 w-7 rounded-md bg-slate-100 object-cover"
                      />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 font-semibold text-xs text-white">
                        {(u?.name || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900">{u?.name || 'User'}</span>
                        {isMemberOwner && (
                          <span title="Owner">
                            <Crown className="h-3 w-3 text-amber-500 fill-amber-500" />
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        @{u?.username || 'user'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isMemberOwner ? (
                      <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-mono font-medium text-slate-600">
                        <Shield className="h-2.5 w-2.5" />
                        Owner
                      </span>
                    ) : isOwner ? (
                      <div className="flex items-center gap-1.5">
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as ProjectRole)}
                          className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-700 focus:border-blue-600 focus:outline-none"
                        >
                          <option value="editor">Editor</option>
                          <option value="viewer">Viewer</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleRemove(u.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-[10px] font-mono font-medium text-slate-600">
                        {member.role}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-4 mt-5 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
