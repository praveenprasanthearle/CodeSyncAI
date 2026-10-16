import React, { useState, useRef, useEffect } from 'react';
import { Share2, Check } from 'lucide-react';
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
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs transition-colors ${
          isOpen
            ? 'bg-slate-100 border-slate-300 text-slate-900'
            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
        }`}
        title="View online collaborators"
      >
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        <span className="font-mono text-[11px] font-medium text-slate-700">
          {count} online
        </span>

        {/* Mini Stack */}
        <div className="flex -space-x-1 ml-0.5">
          {collaborators.slice(0, 3).map((member) => {
            const { user } = member;
            const isSameFile = activeFileId && member.activeFileId === activeFileId;
            return (
              <div key={member.socketId} className="relative">
                <img
                  src={
                    user.avatarUrl ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`
                  }
                  alt={user.username}
                  style={{ borderColor: user.color || '#3b82f6' }}
                  className="h-4.5 w-4.5 rounded-full bg-slate-100 object-cover ring-1 ring-white border"
                />
                {isSameFile && (
                  <span
                    style={{ backgroundColor: user.color || '#10b981' }}
                    className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full ring-1 ring-white"
                  />
                )}
              </div>
            );
          })}
          {count > 3 && (
            <div className="h-4.5 w-4.5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-600 ring-1 ring-white">
              +{count - 3}
            </div>
          )}
        </div>
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="absolute right-0 top-9 w-64 rounded-xl border border-slate-200 bg-white/95 backdrop-blur-xl shadow-glass-dropdown p-2.5 z-50 animate-in fade-in duration-100 text-xs">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <span className="font-semibold text-slate-900">Active Collaborators</span>
            <span className="text-[10px] font-mono text-slate-400">{count} connected</span>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1.5 custom-scrollbar">
            {collaborators.map((c) => {
              const isSelf = c.user.userId === currentUser?.id;
              return (
                <div
                  key={c.socketId}
                  className="flex items-center justify-between p-1.5 rounded-md hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={
                        c.user.avatarUrl ||
                        `https://api.dicebear.com/7.x/bottts/svg?seed=${c.user.username}`
                      }
                      alt={c.user.name}
                      style={{ borderColor: c.user.color || '#3b82f6' }}
                      className="h-6 w-6 rounded-full border bg-slate-100 object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-medium text-slate-800 truncate">
                        {c.user.name} {isSelf && '(You)'}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        @{c.user.username}
                      </div>
                    </div>
                  </div>

                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: c.user.color || '#3b82f6' }}
                    title={`Cursor color: ${c.user.color || 'blue'}`}
                  />
                </div>
              );
            })}
          </div>

          <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between gap-2">
            <button
              onClick={handleCopyInvite}
              className="flex-1 flex items-center justify-center gap-1 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 py-1 text-[11px] font-medium text-slate-700 transition-colors"
            >
              {copiedLink ? (
                <>
                  <Check className="h-3 w-3 text-emerald-600" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Share2 className="h-3 w-3" />
                  <span>Copy invite</span>
                </>
              )}
            </button>
            {onOpenInviteModal && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenInviteModal();
                }}
                className="rounded-md bg-slate-900 hover:bg-slate-800 text-white px-2.5 py-1 text-[11px] font-medium transition-colors"
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
