import React from 'react';
import { Users, FileCode2 } from 'lucide-react';
import { WorkspaceMemberInfo } from '../../stores/collaborationStore';

interface CollaboratorPresenceBarProps {
  collaborators: WorkspaceMemberInfo[];
  activeFileId: string | null;
}

export const CollaboratorPresenceBar: React.FC<CollaboratorPresenceBarProps> = ({
  collaborators,
  activeFileId,
}) => {
  return (
    <div className="flex items-center gap-2 select-none">
      <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 mr-1">
        <Users className="h-3.5 w-3.5 text-gold-400" />
        <span className="text-[11px] font-semibold text-slate-300">
          {collaborators.length} Online
        </span>
      </div>

      <div className="flex -space-x-2 overflow-hidden">
        {collaborators.map((member) => {
          const isSameFile = activeFileId && member.activeFileId === activeFileId;
          const { user } = member;

          return (
            <div
              key={member.socketId}
              className="relative group cursor-pointer"
              title={`${user.name} (@${user.username})${isSameFile ? ' — Viewing this file' : ''}`}
            >
              <img
                src={
                  user.avatarUrl ||
                  `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`
                }
                alt={user.username}
                style={{ borderColor: user.color }}
                className={`h-7 w-7 rounded-full bg-surface-200 object-cover ring-2 ring-background border-2 transition-transform group-hover:scale-110 group-hover:z-30`}
              />

              {/* Same file indicator pip */}
              {isSameFile && (
                <span
                  style={{ backgroundColor: user.color }}
                  className="absolute bottom-0 right-0 h-2 w-2 rounded-full ring-1 ring-background animate-pulse"
                />
              )}

              {/* Hover Tooltip Popup */}
              <div className="absolute right-0 top-8 hidden group-hover:flex flex-col items-center z-50 pointer-events-none">
                <div className="rounded-lg bg-surface-100 border border-surface-50 px-2.5 py-1 shadow-2xl text-[10px] font-mono text-white whitespace-nowrap">
                  <div className="font-bold text-slate-200 flex items-center gap-1">
                    <span
                      className="h-2 w-2 rounded-full inline-block"
                      style={{ backgroundColor: user.color }}
                    />
                    {user.name}
                  </div>
                  <div className="text-slate-400">@{user.username}</div>
                  {isSameFile && (
                    <div className="text-gold-300 mt-0.5 flex items-center gap-1">
                      <FileCode2 className="h-3 w-3" /> Same file
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
