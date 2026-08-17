import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { socketAuthMiddleware, AuthenticatedSocket, CollaboratorUser } from './socketAuth';
import { YjsDocManager } from './yjsManager';
import { ChatService } from '../services/chat.service';

export interface WorkspaceMemberInfo {
  socketId: string;
  user: CollaboratorUser;
  activeFileId?: string | null;
  joinedAt: Date;
}

export interface VoicePeerInfo {
  socketId: string;
  user: CollaboratorUser;
  isMuted: boolean;
  isDeafened: boolean;
  joinedAt: Date;
}

export class SocketManager {
  private static instance: SocketManager;
  public io: Server;
  private workspaceMembers: Map<string, Map<string, WorkspaceMemberInfo>> = new Map();
  private voiceRooms: Map<string, Map<string, VoicePeerInfo>> = new Map();
  private yjsManager: YjsDocManager;

  private constructor(httpServer: HttpServer) {
    this.yjsManager = YjsDocManager.getInstance();

    this.io = new Server(httpServer, {
      cors: {
        origin: (requestOrigin, callback) => {
          callback(null, requestOrigin || true);
        },
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 30000,
      pingInterval: 10000,
    });

    // Authenticate socket connections
    this.io.use(socketAuthMiddleware);

    this.initializeEvents();
  }

  public static initialize(httpServer: HttpServer): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager(httpServer);
    }
    return SocketManager.instance;
  }

  public static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      throw new Error('SocketManager not initialized!');
    }
    return SocketManager.instance;
  }

  private initializeEvents(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      const user = socket.data.user!;

      // -------------------------------------------------------------
      // 1. Workspace Presence Lifecycle
      // -------------------------------------------------------------
      socket.on('workspace:join', ({ projectId, activeFileId }) => {
        if (!projectId) return;

        socket.data.projectId = projectId;
        socket.data.activeFileId = activeFileId || null;

        const roomName = `project:${projectId}`;
        socket.join(roomName);

        if (!this.workspaceMembers.has(projectId)) {
          this.workspaceMembers.set(projectId, new Map());
        }

        const memberInfo: WorkspaceMemberInfo = {
          socketId: socket.id,
          user,
          activeFileId: socket.data.activeFileId,
          joinedAt: new Date(),
        };

        this.workspaceMembers.get(projectId)!.set(socket.id, memberInfo);

        // Send existing collaborators list to newly joined member
        const allMembers = Array.from(this.workspaceMembers.get(projectId)!.values());
        socket.emit('workspace:collaborators', { collaborators: allMembers });

        // Broadcast join event to all other peers in workspace
        socket.to(roomName).emit('workspace:user_joined', { member: memberInfo });
      });

      socket.on('workspace:leave', ({ projectId }) => {
        const pId = projectId || socket.data.projectId;
        if (!pId) return;

        const roomName = `project:${pId}`;
        socket.leave(roomName);

        if (this.workspaceMembers.has(pId)) {
          this.workspaceMembers.get(pId)!.delete(socket.id);
          if (this.workspaceMembers.get(pId)!.size === 0) {
            this.workspaceMembers.delete(pId);
          }
        }

        socket.to(roomName).emit('workspace:user_left', {
          socketId: socket.id,
          userId: user.userId,
        });
      });

      socket.on('presence:update_file', ({ projectId, activeFileId }) => {
        const pId = projectId || socket.data.projectId;
        if (!pId) return;

        socket.data.activeFileId = activeFileId;

        if (this.workspaceMembers.has(pId) && this.workspaceMembers.get(pId)!.has(socket.id)) {
          const member = this.workspaceMembers.get(pId)!.get(socket.id)!;
          member.activeFileId = activeFileId;
        }

        socket.to(`project:${pId}`).emit('presence:file_changed', {
          socketId: socket.id,
          userId: user.userId,
          activeFileId,
        });
      });

      // -------------------------------------------------------------
      // 2. Real-Time Yjs CRDT Synchronization
      // -------------------------------------------------------------
      socket.on('crdt:join_file', async ({ fileId, initialContent }) => {
        if (!fileId) return;

        const fileRoom = `file:${fileId}`;
        socket.join(fileRoom);

        try {
          await this.yjsManager.getOrCreateDoc(fileId, initialContent);
          const fullState = await this.yjsManager.encodeFullState(fileId);

          socket.emit('crdt:initial_state', {
            fileId,
            state: Buffer.from(fullState).toString('base64'),
          });

          socket.to(fileRoom).emit('crdt:peer_joined_file', {
            fileId,
            socketId: socket.id,
            user,
          });
        } catch (err) {
          console.error(`[SocketManager] Failed to send initial CRDT state for ${fileId}:`, err);
        }
      });

      socket.on('crdt:update', async ({ fileId, update }) => {
        if (!fileId || !update) return;

        try {
          let uint8Update: Uint8Array;
          if (typeof update === 'string') {
            uint8Update = new Uint8Array(Buffer.from(update, 'base64'));
          } else if (Buffer.isBuffer(update)) {
            uint8Update = new Uint8Array(update);
          } else if (update instanceof Uint8Array) {
            uint8Update = update;
          } else {
            uint8Update = new Uint8Array(update);
          }

          await this.yjsManager.applyUpdate(fileId, uint8Update);

          const base64Update = Buffer.from(uint8Update).toString('base64');
          socket.to(`file:${fileId}`).emit('crdt:update', {
            fileId,
            update: base64Update,
            senderSocketId: socket.id,
          });
        } catch (err) {
          console.error(`[SocketManager] Error handling CRDT update for ${fileId}:`, err);
        }
      });

      socket.on('crdt:content_change', ({ projectId, fileId, content }: { projectId?: string; fileId: string; content: string }) => {
        if (!fileId) return;

        const pId = projectId || socket.data.projectId;
        // Update in-memory Yjs doc state and schedule debounced persistence
        this.yjsManager.setDocContent(fileId, content);

        // Broadcast live content change to all other peers in file and workspace
        socket.to(`file:${fileId}`).emit('crdt:remote_content', {
          fileId,
          content,
          senderSocketId: socket.id,
          user,
        });

        if (pId) {
          socket.to(`project:${pId}`).emit('crdt:remote_content', {
            fileId,
            content,
            senderSocketId: socket.id,
            user,
          });
        }
      });

      socket.on('crdt:awareness', ({ fileId, cursor, selection }) => {
        if (!fileId) return;

        const pId = socket.data.projectId;
        socket.to(`file:${fileId}`).emit('crdt:peer_awareness', {
          fileId,
          socketId: socket.id,
          user,
          cursor,
          selection,
        });

        if (pId) {
          socket.to(`project:${pId}`).emit('crdt:peer_awareness', {
            fileId,
            socketId: socket.id,
            user,
            cursor,
            selection,
          });
        }
      });

      socket.on('crdt:leave_file', ({ fileId }) => {
        if (!fileId) return;
        const fileRoom = `file:${fileId}`;
        socket.leave(fileRoom);
        socket.to(fileRoom).emit('crdt:peer_left_file', {
          fileId,
          socketId: socket.id,
          userId: user.userId,
        });
      });

      // -------------------------------------------------------------
      // 3. Real-Time In-Project Chat
      // -------------------------------------------------------------
      socket.on('chat:send', async ({ projectId, text, fileReference }) => {
        if (!projectId || !text) return;

        try {
          const message = await ChatService.sendMessage(projectId, user.userId, {
            text,
            fileReference,
          });

          this.io.to(`project:${projectId}`).emit('chat:new_message', { message });
        } catch (err) {
          console.error(`[SocketManager] Error saving chat message:`, err);
        }
      });

      socket.on('chat:typing', ({ projectId, isTyping }) => {
        if (!projectId) return;

        socket.to(`project:${projectId}`).emit('chat:user_typing', {
          socketId: socket.id,
          user,
          isTyping,
        });
      });

      // -------------------------------------------------------------
      // 4. WebRTC Voice Communication Signaling
      // -------------------------------------------------------------
      socket.on('webrtc:join_voice', ({ projectId, isMuted = false, isDeafened = false }) => {
        if (!projectId) return;

        const voiceRoom = `voice:${projectId}`;
        socket.join(voiceRoom);

        if (!this.voiceRooms.has(projectId)) {
          this.voiceRooms.set(projectId, new Map());
        }

        const peerInfo: VoicePeerInfo = {
          socketId: socket.id,
          user,
          isMuted,
          isDeafened,
          joinedAt: new Date(),
        };

        const existingPeers = Array.from(this.voiceRooms.get(projectId)!.values());
        this.voiceRooms.get(projectId)!.set(socket.id, peerInfo);

        // Send existing voice room peers to caller
        socket.emit('webrtc:voice_peers', { peers: existingPeers });

        // Notify other peers in voice room
        socket.to(voiceRoom).emit('webrtc:peer_joined', { peer: peerInfo });
      });

      socket.on('webrtc:offer', ({ targetSocketId, offer }) => {
        if (!targetSocketId || !offer) return;
        this.io.to(targetSocketId).emit('webrtc:offer', {
          senderSocketId: socket.id,
          user,
          offer,
        });
      });

      socket.on('webrtc:answer', ({ targetSocketId, answer }) => {
        if (!targetSocketId || !answer) return;
        this.io.to(targetSocketId).emit('webrtc:answer', {
          senderSocketId: socket.id,
          user,
          answer,
        });
      });

      socket.on('webrtc:ice_candidate', ({ targetSocketId, candidate }) => {
        if (!targetSocketId || !candidate) return;
        this.io.to(targetSocketId).emit('webrtc:ice_candidate', {
          senderSocketId: socket.id,
          candidate,
        });
      });

      socket.on('webrtc:mute_status', ({ projectId, isMuted, isDeafened }) => {
        const pId = projectId || socket.data.projectId;
        if (!pId || !this.voiceRooms.has(pId)) return;

        if (this.voiceRooms.get(pId)!.has(socket.id)) {
          const peer = this.voiceRooms.get(pId)!.get(socket.id)!;
          peer.isMuted = isMuted;
          peer.isDeafened = isDeafened;
        }

        socket.to(`voice:${pId}`).emit('webrtc:peer_mute_status', {
          socketId: socket.id,
          isMuted,
          isDeafened,
        });
      });

      socket.on('webrtc:leave_voice', ({ projectId }) => {
        const pId = projectId || socket.data.projectId;
        if (!pId) return;

        socket.leave(`voice:${pId}`);

        if (this.voiceRooms.has(pId)) {
          this.voiceRooms.get(pId)!.delete(socket.id);
          if (this.voiceRooms.get(pId)!.size === 0) {
            this.voiceRooms.delete(pId);
          }
        }

        socket.to(`voice:${pId}`).emit('webrtc:peer_left', {
          socketId: socket.id,
          userId: user.userId,
        });
      });

      // -------------------------------------------------------------
      // 5. Disconnect Lifecycle
      // -------------------------------------------------------------
      socket.on('disconnect', () => {
        const pId = socket.data.projectId;
        if (pId) {
          // Cleanup workspace presence
          if (this.workspaceMembers.has(pId)) {
            this.workspaceMembers.get(pId)!.delete(socket.id);
            if (this.workspaceMembers.get(pId)!.size === 0) {
              this.workspaceMembers.delete(pId);
            }
            socket.to(`project:${pId}`).emit('workspace:user_left', {
              socketId: socket.id,
              userId: user.userId,
            });
          }

          // Cleanup voice presence
          if (this.voiceRooms.has(pId)) {
            this.voiceRooms.get(pId)!.delete(socket.id);
            if (this.voiceRooms.get(pId)!.size === 0) {
              this.voiceRooms.delete(pId);
            }
            socket.to(`voice:${pId}`).emit('webrtc:peer_left', {
              socketId: socket.id,
              userId: user.userId,
            });
          }
        }
      });
    });
  }
}
