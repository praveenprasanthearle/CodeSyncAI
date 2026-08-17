import React from 'react';
import {
  Mic,
  MicOff,
  Headphones,
  PhoneCall,
  PhoneOff,
  Volume2,
  AlertCircle,
} from 'lucide-react';
import { useVoiceStore } from '../../stores/voiceStore';
import { useAuthStore } from '../../stores/authStore';

interface VoiceChannelWidgetProps {
  projectId: string;
}

export const VoiceChannelWidget: React.FC<VoiceChannelWidgetProps> = ({ projectId }) => {
  const { user } = useAuthStore();
  const {
    isInVoice,
    isMuted,
    isDeafened,
    peers,
    speakingSocketIds,
    audioError,
    joinVoice,
    leaveVoice,
    toggleMute,
    toggleDeafen,
  } = useVoiceStore();

  return (
    <div className="rounded-xl border border-surface-50/80 bg-surface-400 p-3 text-xs space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-lg border ${
              isInVoice
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-surface-200 text-slate-400 border-surface-50'
            }`}
          >
            <Volume2 className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Voice Channel</h4>
            <p className="text-[10px] text-slate-400 font-mono">
              {isInVoice ? `${peers.length + 1} Connected` : 'Ready to join'}
            </p>
          </div>
        </div>

        {isInVoice ? (
          <button
            onClick={() => leaveVoice(projectId)}
            className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 transition-colors"
            title="Disconnect from voice"
          >
            <PhoneOff className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            onClick={() => joinVoice(projectId)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition-all shadow-sm"
          >
            <PhoneCall className="h-3.5 w-3.5" />
            <span>Join</span>
          </button>
        )}
      </div>

      {audioError && (
        <div className="flex items-center gap-1.5 text-[10px] text-rose-400 bg-rose-950/40 border border-rose-800/40 p-2 rounded-lg">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{audioError}</span>
        </div>
      )}

      {/* Connected Peers List */}
      {isInVoice && (
        <div className="space-y-2 pt-1 border-t border-surface-50/60">
          {/* Current User */}
          <div className="flex items-center justify-between p-1.5 rounded-lg bg-surface-300/60">
            <div className="flex items-center gap-2">
              <div className="relative">
                <img
                  src={
                    user?.avatarUrl ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username || 'me'}`
                  }
                  alt="avatar"
                  className={`h-6 w-6 rounded-full bg-surface-200 object-cover ring-2 ${
                    speakingSocketIds.length > 0
                      ? 'ring-emerald-400 ring-offset-1 ring-offset-surface-400 animate-pulse'
                      : 'ring-surface-50'
                  }`}
                />
              </div>
              <span className="text-xs font-medium text-white truncate max-w-[110px]">
                {user?.name || 'You'} (You)
              </span>
            </div>

            <div className="flex items-center gap-1">
              {isMuted && <MicOff className="h-3.5 w-3.5 text-rose-400" />}
              {isDeafened && <Headphones className="h-3.5 w-3.5 text-amber-400" />}
            </div>
          </div>

          {/* Remote Peers */}
          {peers.map((peer) => {
            const isSpeaking = speakingSocketIds.includes(peer.socketId);
            return (
              <div
                key={peer.socketId}
                className="flex items-center justify-between p-1.5 rounded-lg bg-surface-300/60"
              >
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <img
                      src={
                        peer.user.avatarUrl ||
                        `https://api.dicebear.com/7.x/bottts/svg?seed=${peer.user.username}`
                      }
                      alt={peer.user.username}
                      style={{ borderColor: peer.user.color }}
                      className={`h-6 w-6 rounded-full bg-surface-200 object-cover ring-2 ${
                        isSpeaking
                          ? 'ring-emerald-400 ring-offset-1 ring-offset-surface-400 animate-pulse'
                          : 'ring-surface-50'
                      }`}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-200 truncate max-w-[110px]">
                    {peer.user.name}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {peer.isMuted && <MicOff className="h-3.5 w-3.5 text-rose-400" />}
                  {peer.isDeafened && <Headphones className="h-3.5 w-3.5 text-amber-400" />}
                </div>
              </div>
            );
          })}

          {/* Voice Controls Toolbar */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => toggleMute(projectId)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                isMuted
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-surface-200 text-slate-200 border-surface-50 hover:text-white'
              }`}
            >
              {isMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
              <span>{isMuted ? 'Muted' : 'Mute'}</span>
            </button>

            <button
              onClick={() => toggleDeafen(projectId)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                isDeafened
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-surface-200 text-slate-200 border-surface-50 hover:text-white'
              }`}
            >
              <Headphones className="h-3.5 w-3.5" />
              <span>{isDeafened ? 'Deafened' : 'Deafen'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
