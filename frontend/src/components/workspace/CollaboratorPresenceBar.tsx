import React, { useState, useRef, useEffect } from 'react';
import { Users, FileCode2, Share2, Check } from 'lucide-react';
import { WorkspaceMemberInfo } from '../../stores/collaborationStore';
import { useAuthStore } from '../../stores/authStore';

interface CollaboratorPresenceBarProps {
  collaborators: WorkspaceMemberInfo[];
  activeFileId: string | null;
  onOpenInviteModal?: () => void;
}

export const CollaboratorPresenceBar: React.FC<CollaboratorPresenceBarProps> = ({
  collaborators,
  activeFileId,
  onOpenInviteModal,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user: currentUser } = useAuthStore();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const count = collaborators.length;

  return (
    <div className="relative select-none" ref={dropdownRef}>
      {/* Interactive Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border transition-all ${
          isOpen
            ? 'bg-surface-100 border-gold-400/50 shadow-md shadow-gold-500/10'
            : 'bg-surface-200/80 hover:bg-surface-100 border-surface-50 text-slate-300 hover:text-white'
        }`}
        title="Click to view all active collaborators"
      >
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Users className="h-3.5 w-3.5 text-gold-400" />
          <span className="text-[11px] font-semibold text-slate-200">
            {count} {count === 1 ? 'Online' : 'Online'}
          </span>
        </div>

        {/* Mini Stack of Avatars (Max 3 + extra count) */}
        <div className="flex -space-x-1.5 ml-0.5">
          {collaborators.slice(0, 3).map((member) => {
            const { user } = member;
            const isSameFile = activeFileId && member.activeFileId === activeFileId;
            return (
              <div
                key={member.socketId}
                className="relative"
              >
                <img
                  src={
                    user.avatarUrl ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`
                  }
                  alt={user.username}
                  style={{ borderColor: user.color || '#3b82f6' }}
                  className="h-5 w-5 rounded-full bg-surface-300 object-cover ring-1 ring-background border"
                />
                {isSameFile && (
                  <span
                    style={{ backgroundColor: user.color || '#10b981' }}
                    className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full ring-1 ring-background animate-pulse"
                  />
                )}
              </div>
            );
          })}
          {count > 3 && (
            <div className="h-5 w-5 rounded-full bg-surface-100 border border-surface-50 flex items-center justify-center text-[9px] font-bold text-gold-300 ring-1 ring-background">
              +{count - 3}
            </div>
          )}
        </div>
      </button>

      {/* Glassmorphic Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 top-10 w-72 sm:w-80 rounded-xl bg-surface-300/95 backdrop-blur-2xl border border-surface-50 shadow-2xl z-50 p-3 space-y-3 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-surface-50/70">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-white">Active Collaborators</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              {count} {count === 1 ? 'peer connected' : 'peers connected'}
            </span>
          </div>

          {/* Collaborator List */}
          <div className="max-h-56 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
            {collaborators.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-400 font-mono">
                No active peers in this workspace.
              </div>
            ) : (
              collaborators.map((member) => {
                const { user } = member;
                const isCurrent = currentUser && (currentUser.id === user.userId || currentUser.username === user.username);
                const isSameFile = activeFileId && member.activeFileId === activeFileId;

                return (
                  <div
                    key={member.socketId}
                    className="flex items-center justify-between p-2 rounded-lg bg-surface-200/70 hover:bg-surface-100/90 border border-surface-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={
                            user.avatarUrl ||
                            `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`
                          }
                          alt={user.username}
                          style={{ borderColor: user.color || '#3b82f6' }}
                          className="h-8 w-8 rounded-full bg-surface-400 object-cover ring-2 ring-background border-2"
                        />
                        <span
                          className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-surface-300"
                          style={{ backgroundColor: user.color || '#10b981' }}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-white truncate">
                            {user.name}
                          </span>
                          {isCurrent && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 truncate">
                          @{user.username}
                        </div>
                      </div>
                    </div>

                    {/* Active File / Status Badge */}
                    <div className="text-right shrink-0 ml-2">
                      {isSameFile ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/40">
                          <FileCode2 className="h-3 w-3" /> Same file
                        </span>
                      ) : member.activeFileId ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-mono text-slate-400 bg-surface-300 px-2 py-0.5 rounded border border-surface-50">
                          <FileCode2 className="h-3 w-3 text-gold-400" /> Editing
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono text-slate-500">
                          Browsing
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Action Footer */}
          <div className="pt-2 border-t border-surface-50/70 flex items-center justify-between gap-2">
            <button
              onClick={handleCopyInvite}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-surface-200 hover:bg-surface-100 border border-surface-50 text-[11px] font-medium text-slate-200 hover:text-white transition-all"
            >
              {copiedLink ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="h-3.5 w-3.5 text-sky-400" />
                  <span>Copy Workspace Link</span>
                </>
              )}
            </button>

            {onOpenInviteModal && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenInviteModal();
                }}
                className="py-1.5 px-3 rounded-lg bg-gold-400/20 hover:bg-gold-400/30 border border-gold-400/40 text-[11px] font-semibold text-gold-300 hover:text-gold-200 transition-all"
              >
                Manage
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
