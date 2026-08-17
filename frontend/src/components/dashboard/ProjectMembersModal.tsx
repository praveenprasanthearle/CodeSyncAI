import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Shield,
  Trash2,
  Copy,
  Check,
  Loader2,
  Users,
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
      setSuccessMsg(`Collaborator invited successfully as ${role}.`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto glass-card rounded-2xl border border-surface-50 p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200 custom-scrollbar">
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
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">Collaborator Access</h3>
            <p className="text-xs text-slate-400">
              Manage teammates and realtime editing permissions for <span className="text-gold-300 font-semibold">{project.name}</span>
            </p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-950/40 p-3 text-xs text-emerald-300">
            {successMsg}
          </div>
        )}

        {/* Quick Link Share Bar */}
        <div className="mb-6 rounded-xl border border-surface-50 bg-surface-300/40 p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="p-2 rounded-lg bg-surface-200 border border-surface-50 text-gold-400 shrink-0">
              <LinkIcon className="h-4 w-4" />
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-white">Shareable Workspace Link</div>
              <div className="text-[11px] font-mono text-slate-400 truncate">
                {window.location.origin}/workspace/{project.id}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCopyLink}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all shrink-0 ${
              copied
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-surface-200 hover:bg-surface-100 text-slate-200 border border-surface-50'
            }`}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>

        {/* Invite Form (For Owners and Editors) */}
        {isOwner && (
          <form onSubmit={handleInvite} className="mb-6 space-y-3">
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
              Invite New Collaborator
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                placeholder="colleague@codesync.ai or @username"
                className="flex-1 rounded-lg border border-surface-50 bg-surface-300/80 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-gold-400 focus:outline-none focus:ring-1 focus:ring-gold-400 transition-colors"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}
                className="rounded-lg border border-surface-50 bg-surface-200 px-3 py-2 text-xs text-white focus:border-gold-400 focus:outline-none cursor-pointer"
              >
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
              <button
                type="submit"
                disabled={isActionLoading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-gold-500 to-gold-400 px-3.5 py-2 text-xs font-semibold text-background shadow-md hover:shadow-gold-glow hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
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
        <div className="space-y-3">
          <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
            Active Collaborators ({members.length})
          </label>

          <div className="divide-y divide-surface-50/60 rounded-xl border border-surface-50 bg-surface-300/30 overflow-hidden">
            {members.map((member, index) => {
              const u = member.user;
              const isMemberOwner = member.role === 'owner';

              return (
                <div
                  key={u?.id || index}
                  className="flex items-center justify-between p-3.5 hover:bg-surface-200/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {u?.avatarUrl ? (
                      <img
                        src={u.avatarUrl}
                        alt={u.name || 'User'}
                        className="h-8 w-8 rounded-lg bg-surface-200 object-cover border border-surface-50"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-gold-600 to-gold-400 font-bold text-xs text-background">
                        {(u?.name || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-white">{u?.name || 'User'}</span>
                        {isMemberOwner && (
                          <span title="Project Owner">
                            <Crown className="h-3 w-3 text-gold-400 fill-gold-400" />
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        @{u?.username || 'user'} • {u?.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isMemberOwner ? (
                      <span className="inline-flex items-center gap-1 rounded bg-gold-400/10 px-2 py-0.5 text-[11px] font-mono font-medium text-gold-300 border border-gold-400/20">
                        <Shield className="h-2.5 w-2.5" />
                        Owner
                      </span>
                    ) : isOwner ? (
                      <div className="flex items-center gap-1.5">
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as ProjectRole)}
                          className="rounded border border-surface-50 bg-surface-200 px-2 py-1 text-[11px] text-white focus:border-gold-400 focus:outline-none"
                        >
                          <option value="editor">Editor</option>
                          <option value="viewer">Viewer</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleRemove(u.id)}
                          className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors"
                          title="Remove member"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-surface-100 px-2 py-0.5 text-[11px] font-mono font-medium text-slate-300 border border-surface-50">
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
        <div className="flex items-center justify-end pt-5 mt-6 border-t border-surface-50/60">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-surface-100 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-surface-50 hover:text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
