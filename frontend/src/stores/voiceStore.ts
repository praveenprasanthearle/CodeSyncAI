import { create } from 'zustand';
import { useCollaborationStore, CollaboratorUser } from './collaborationStore';

export interface VoicePeer {
  socketId: string;
  user: CollaboratorUser;
  isMuted: boolean;
  isDeafened: boolean;
}

interface VoiceState {
  isInVoice: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  peers: VoicePeer[];
  speakingSocketIds: string[];
  audioError: string | null;

  // Actions
  joinVoice: (projectId: string) => Promise<void>;
  leaveVoice: (projectId: string) => void;
  toggleMute: (projectId: string) => void;
  toggleDeafen: (projectId: string) => void;
  clearState: () => void;
}

// Full-Mesh WebRTC Connection Cache
const peerConnections = new Map<string, RTCPeerConnection>();
const remoteAudioElements = new Map<string, HTMLAudioElement>();
let localStream: MediaStream | null = null;
let audioContext: AudioContext | null = null;
let speakingInterval: any = null;

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const useVoiceStore = create<VoiceState>((set, get) => ({
  isInVoice: false,
  isMuted: false,
  isDeafened: false,
  peers: [],
  speakingSocketIds: [],
  audioError: null,

  joinVoice: async (projectId: string) => {
    const socket = useCollaborationStore.getState().connectSocket();
    set({ audioError: null });

    try {
      // 1. Capture local microphone audio stream
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error(
          'Microphone access requires a secure context (HTTPS/localhost) or enabling chrome://flags/#unsafely-treat-insecure-origin-as-secure for remote LAN HTTP testing.'
        );
      }

      localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      // 2. Setup local speaking detection with AudioContext
      try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(localStream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        speakingInterval = setInterval(() => {
          if (!get().isInVoice || get().isMuted) {
            set((state) => ({
              speakingSocketIds: state.speakingSocketIds.filter((id) => id !== socket.id),
            }));
            return;
          }

          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          const isSpeaking = average > 25;

          set((state) => {
            const hasMe = state.speakingSocketIds.includes(socket.id || 'me');
            if (isSpeaking && !hasMe) {
              return { speakingSocketIds: [...state.speakingSocketIds, socket.id || 'me'] };
            } else if (!isSpeaking && hasMe) {
              return { speakingSocketIds: state.speakingSocketIds.filter((id) => id !== (socket.id || 'me')) };
            }
            return state;
          });
        }, 150);
      } catch (_e) {
        // AudioContext optional for visualizer
      }

      // 3. Helper to create RTCPeerConnection to a peer
      const createPeerConnection = (peerSocketId: string, _peerUser: CollaboratorUser, isInitiator: boolean) => {
        if (peerConnections.has(peerSocketId)) {
          return peerConnections.get(peerSocketId)!;
        }

        const pc = new RTCPeerConnection(RTC_CONFIG);
        peerConnections.set(peerSocketId, pc);

        // Add local tracks
        if (localStream) {
          localStream.getTracks().forEach((track) => pc.addTrack(track, localStream!));
        }

        // Send ICE candidate to peer
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('webrtc:ice_candidate', {
              targetSocketId: peerSocketId,
              candidate: event.candidate,
            });
          }
        };

        // Handle incoming remote audio track
        pc.ontrack = (event) => {
          const [remoteStream] = event.streams;
          let audioEl = remoteAudioElements.get(peerSocketId);
          if (!audioEl) {
            audioEl = new Audio();
            audioEl.autoplay = true;
            audioEl.muted = get().isDeafened;
            remoteAudioElements.set(peerSocketId, audioEl);
          }
          audioEl.srcObject = remoteStream;
        };

        // If initiator, create and send SDP offer
        if (isInitiator) {
          pc.onnegotiationneeded = async () => {
            try {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              socket.emit('webrtc:offer', {
                targetSocketId: peerSocketId,
                offer,
              });
            } catch (err) {
              console.error('Error creating SDP offer:', err);
            }
          };
        }

        return pc;
      };

      // 4. Setup WebRTC socket listeners
      socket.off('webrtc:voice_peers');
      socket.off('webrtc:peer_joined');
      socket.off('webrtc:offer');
      socket.off('webrtc:answer');
      socket.off('webrtc:ice_candidate');
      socket.off('webrtc:peer_mute_status');
      socket.off('webrtc:peer_left');

      // Existing peers in voice room
      socket.on('webrtc:voice_peers', ({ peers }: { peers: VoicePeer[] }) => {
        set({ peers });
        for (const peer of peers) {
          if (peer.socketId !== socket.id) {
            createPeerConnection(peer.socketId, peer.user, true);
          }
        }
      });

      // New peer joined voice room
      socket.on('webrtc:peer_joined', ({ peer }: { peer: VoicePeer }) => {
        set((state) => {
          const exists = state.peers.some((p) => p.socketId === peer.socketId);
          if (exists) return state;
          return { peers: [...state.peers, peer] };
        });
      });

      // Received SDP offer from peer
      socket.on('webrtc:offer', async ({ senderSocketId, user, offer }) => {
        const pc = createPeerConnection(senderSocketId, user, false);
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('webrtc:answer', {
            targetSocketId: senderSocketId,
            answer,
          });
        } catch (err) {
          console.error('Error handling SDP offer:', err);
        }
      });

      // Received SDP answer from peer
      socket.on('webrtc:answer', async ({ senderSocketId, answer }) => {
        const pc = peerConnections.get(senderSocketId);
        if (pc) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
          } catch (err) {
            console.error('Error handling SDP answer:', err);
          }
        }
      });

      // Received ICE candidate from peer
      socket.on('webrtc:ice_candidate', async ({ senderSocketId, candidate }) => {
        const pc = peerConnections.get(senderSocketId);
        if (pc && candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.error('Error adding ICE candidate:', err);
          }
        }
      });

      // Peer mute status changed
      socket.on('webrtc:peer_mute_status', ({ socketId, isMuted, isDeafened }) => {
        set((state) => ({
          peers: state.peers.map((p) =>
            p.socketId === socketId ? { ...p, isMuted, isDeafened } : p
          ),
        }));
      });

      // Peer left voice room
      socket.on('webrtc:peer_left', ({ socketId }) => {
        const pc = peerConnections.get(socketId);
        if (pc) {
          pc.close();
          peerConnections.delete(socketId);
        }
        const audio = remoteAudioElements.get(socketId);
        if (audio) {
          audio.srcObject = null;
          remoteAudioElements.delete(socketId);
        }

        set((state) => ({
          peers: state.peers.filter((p) => p.socketId !== socketId),
          speakingSocketIds: state.speakingSocketIds.filter((id) => id !== socketId),
        }));
      });

      // 5. Emit join event to server
      socket.emit('webrtc:join_voice', {
        projectId,
        isMuted: get().isMuted,
        isDeafened: get().isDeafened,
      });

      set({ isInVoice: true });
    } catch (err: any) {
      console.error('Microphone access failed:', err);
      set({
        audioError: err.message || 'Microphone access denied or unavailable.',
        isInVoice: false,
      });
    }
  },

  leaveVoice: (projectId: string) => {
    const socket = useCollaborationStore.getState().socket;
    if (socket && socket.connected) {
      socket.emit('webrtc:leave_voice', { projectId });
    }

    // Stop local mic stream
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      localStream = null;
    }

    if (speakingInterval) {
      clearInterval(speakingInterval);
      speakingInterval = null;
    }

    if (audioContext) {
      audioContext.close().catch(() => {});
      audioContext = null;
    }

    // Close all peer connections
    for (const pc of peerConnections.values()) {
      pc.close();
    }
    peerConnections.clear();

    // Clean remote audio elements
    for (const audio of remoteAudioElements.values()) {
      audio.srcObject = null;
    }
    remoteAudioElements.clear();

    set({
      isInVoice: false,
      peers: [],
      speakingSocketIds: [],
    });
  },

  toggleMute: (projectId: string) => {
    const newMute = !get().isMuted;
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !newMute;
      });
    }

    const socket = useCollaborationStore.getState().socket;
    if (socket && socket.connected) {
      socket.emit('webrtc:mute_status', {
        projectId,
        isMuted: newMute,
        isDeafened: get().isDeafened,
      });
    }

    set({ isMuted: newMute });
  },

  toggleDeafen: (projectId: string) => {
    const newDeafen = !get().isDeafened;
    // Mute or unmute all incoming audio elements
    for (const audio of remoteAudioElements.values()) {
      audio.muted = newDeafen;
    }

    const socket = useCollaborationStore.getState().socket;
    if (socket && socket.connected) {
      socket.emit('webrtc:mute_status', {
        projectId,
        isMuted: get().isMuted,
        isDeafened: newDeafen,
      });
    }

    set({ isDeafened: newDeafen });
  },

  clearState: () => {
    get().leaveVoice('');
    set({
      isInVoice: false,
      isMuted: false,
      isDeafened: false,
      peers: [],
      speakingSocketIds: [],
      audioError: null,
    });
  },
}));
