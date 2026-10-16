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
    <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs space-y-2.5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-lg border ${
              isInVoice
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}
          >
            <Volume2 className="h-3.5 w-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-900">Voice Channel</h4>
            <p className="text-[10px] text-slate-500 font-mono">
              {isInVoice ? `${peers.length + 1} connected` : 'Ready to join'}
            </p>
          </div>
        </div>

        {isInVoice ? (
          <button
            onClick={() => leaveVoice(projectId)}
            className="p-1.5 rounded-md bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors"
            title="Disconnect"
          >
            <PhoneOff className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            onClick={() => joinVoice(projectId)}
            className="flex items-center gap-1 rounded-md bg-slate-900 hover:bg-slate-800 px-2.5 py-1 text-xs font-medium text-white transition-all shadow-xs"
          >
            <PhoneCall className="h-3 w-3" />
            <span>Join</span>
          </button>
        )}
      </div>

      {audioError && (
        <div className="flex items-center gap-1.5 text-[10px] text-rose-700 bg-rose-50 border border-rose-200 p-2 rounded-lg">
          <AlertCircle className="h-3 w-3 shrink-0 text-rose-600" />
          <span>{audioError}</span>
        </div>
      )}

      {/* Connected Peers List */}
      {isInVoice && (
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          {/* Current User */}
          <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50">
            <div className="flex items-center gap-2">
              <div className="relative">
                <img
                  src={
                    user?.avatarUrl ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username || 'me'}`
                  }
                  alt="avatar"
                  className={`h-5 w-5 rounded-full bg-slate-100 object-cover ring-2 ${
                    speakingSocketIds.length > 0
                      ? 'ring-emerald-500 ring-offset-1 animate-pulse'
                      : 'ring-white'
                  }`}
                />
              </div>
              <span className="text-xs font-medium text-slate-800 truncate max-w-[110px]">
                {user?.name || 'You'} (You)
              </span>
            </div>

            <div className="flex items-center gap-1">
              {isMuted && <MicOff className="h-3 w-3 text-rose-500" />}
              {isDeafened && <Headphones className="h-3 w-3 text-amber-500" />}
            </div>
          </div>

          {/* Remote Peers */}
          {peers.map((peer) => {
            const isSpeaking = speakingSocketIds.includes(peer.socketId);
            return (
              <div
                key={peer.socketId}
                className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50"
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
                      className={`h-5 w-5 rounded-full bg-slate-100 object-cover ring-2 ${
                        isSpeaking
                          ? 'ring-emerald-500 ring-offset-1 animate-pulse'
                          : 'ring-white'
                      }`}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-700 truncate max-w-[110px]">
                    {peer.user.name}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {peer.isMuted && <MicOff className="h-3 w-3 text-rose-500" />}
                  {peer.isDeafened && <Headphones className="h-3 w-3 text-amber-500" />}
                </div>
              </div>
            );
          })}

          {/* Voice Controls Toolbar */}
          <div className="flex items-center justify-center gap-2 pt-1.5">
            <button
              onClick={() => toggleMute(projectId)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                isMuted
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {isMuted ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
              <span>{isMuted ? 'Muted' : 'Mute'}</span>
            </button>

            <button
              onClick={() => toggleDeafen(projectId)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                isDeafened
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Headphones className="h-3 w-3" />
              <span>{isDeafened ? 'Deafened' : 'Deafen'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
