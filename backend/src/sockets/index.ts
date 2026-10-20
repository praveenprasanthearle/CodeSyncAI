import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import { socketAuthMiddleware, AuthenticatedSocket, CollaboratorUser } from './socketAuth';
import { YjsDocManager } from './yjsManager';
import { ChatService } from '../services/chat.service';
import { Project, ProjectRole } from '../models/Project';
import { FileNode } from '../models/FileNode';
import { sendMessageSchema } from '../validations/chat.validation';
import { AppError } from '../middleware/errorHandler';
import { isOriginAllowed } from '../config/cors';

export interface WorkspaceMemberInfo { socketId: string; user: CollaboratorUser; activeFileId?: string | null; joinedAt: Date }
export interface VoicePeerInfo { socketId: string; user: CollaboratorUser; isMuted: boolean; isDeafened: boolean; joinedAt: Date }

export class SocketManager {
  private static instance: SocketManager;
  public io: Server;
  private workspaceMembers = new Map<string, Map<string, WorkspaceMemberInfo>>();
  private voiceRooms = new Map<string, Map<string, VoicePeerInfo>>();
  private yjsManager = YjsDocManager.getInstance();

  private constructor(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: { origin: (origin, cb) => cb(null, isOriginAllowed(origin)), methods: ['GET', 'POST'], credentials: true },
      transports: ['websocket', 'polling'], pingTimeout: 30000, pingInterval: 10000, maxHttpBufferSize: 512 * 1024,
    });
    this.io.use(socketAuthMiddleware);
    this.yjsManager.on('persisted', data => this.io.to(`file:${data.fileId}`).emit('crdt:saved', data));
    this.yjsManager.on('replaced', data => this.io.to(`file:${data.fileId}`).emit('crdt:initial_state', data));
    this.yjsManager.on('persistence_failed', data => this.io.to(`file:${data.fileId}`).emit('workspace:error', { ...data, code: 'SAVE_FAILED', message: 'Changes could not be saved. Reconnect and retry.' }));
    this.io.on('connection', socket => this.initializeEvents(socket as AuthenticatedSocket));
  }
  static initialize(server: HttpServer): SocketManager {
    if (!this.instance) this.instance = new SocketManager(server);
    return this.instance;
  }
  static getInstance(): SocketManager {
    if (!this.instance) throw new Error('SocketManager not initialized!');
    return this.instance;
  }

  static notifyFilesChanged(projectId: string): void {
    this.instance?.io.to(`project:${projectId}`).emit('workspace:files_changed', { projectId });
  }

  static async refreshProjectAccess(projectId: string): Promise<void> {
    if (!this.instance) return;
    const project = await Project.findById(projectId);
    for (const rawSocket of this.instance.io.sockets.sockets.values()) {
      const socket = rawSocket as AuthenticatedSocket;
      const files = Object.entries(socket.data.fileProjects || {}).filter(([, id]) => id === projectId);
      if (socket.data.projectId !== projectId && socket.data.voiceProjectId !== projectId && !files.length) continue;
      if (!project?.hasAccess(socket.data.user!.userId, 'viewer')) {
        if (socket.data.projectId === projectId) this.instance.leaveWorkspace(socket);
        if (socket.data.voiceProjectId === projectId) this.instance.leaveVoice(socket);
        for (const [fileId] of files) { socket.leave(`file:${fileId}`); delete socket.data.fileProjects?.[fileId]; }
        socket.emit('workspace:error', { projectId, code: 'ACCESS_REVOKED', message: 'Your access to this workspace has been removed.' });
      } else socket.emit('workspace:permissions_changed', { projectId, role: project.getMemberRole(socket.data.user!.userId) || 'viewer' });
    }
  }

  private async projectAccess(socket: AuthenticatedSocket, projectId: string, role: ProjectRole = 'viewer') {
    if (typeof projectId !== 'string' || !mongoose.isValidObjectId(projectId)) throw new AppError('Invalid project identifier.', 400, 'INVALID_PROJECT_ID');
    const project = await Project.findById(projectId);
    if (!project || !project.hasAccess(socket.data.user!.userId, role)) throw new AppError('You do not have permission to access this workspace.', 403, 'FORBIDDEN');
    return project;
  }

  private async fileAccess(socket: AuthenticatedSocket, fileId: string, role: ProjectRole = 'viewer') {
    if (typeof fileId !== 'string' || !mongoose.isValidObjectId(fileId)) throw new AppError('Invalid file identifier.', 400, 'INVALID_FILE_ID');
    const file = await FileNode.findById(fileId);
    if (!file || file.type !== 'file') throw new AppError('File not found.', 404, 'FILE_NOT_FOUND');
    const projectId = file.projectId.toString();
    if (socket.data.projectId && socket.data.projectId !== projectId) throw new AppError('This file belongs to a different workspace.', 403, 'FORBIDDEN');
    await this.projectAccess(socket, projectId, role);
    return file;
  }

  private leaveVoice(socket: AuthenticatedSocket): void {
    const projectId = socket.data.voiceProjectId;
    if (!projectId) return;
    socket.leave(`voice:${projectId}`);
    this.voiceRooms.get(projectId)?.delete(socket.id);
    if (!this.voiceRooms.get(projectId)?.size) this.voiceRooms.delete(projectId);
    socket.to(`voice:${projectId}`).emit('webrtc:peer_left', { socketId: socket.id, userId: socket.data.user!.userId });
    socket.data.voiceProjectId = undefined;
  }

  private leaveWorkspace(socket: AuthenticatedSocket): void {
    const projectId = socket.data.projectId;
    this.leaveVoice(socket);
    for (const room of socket.rooms) if (room.startsWith('file:')) socket.leave(room);
    if (projectId) {
      socket.leave(`project:${projectId}`);
      const members = this.workspaceMembers.get(projectId);
      members?.delete(socket.id);
      const sameUserStillPresent = Array.from(members?.values() || []).some(m => m.user.userId === socket.data.user!.userId);
      socket.to(`project:${projectId}`).emit('workspace:user_left', { socketId: socket.id, ...(sameUserStillPresent ? {} : { userId: socket.data.user!.userId }) });
      this.io.to(`project:${projectId}`).emit('workspace:collaborators', { collaborators: Array.from(members?.values() || []) });
      if (!members?.size) this.workspaceMembers.delete(projectId);
    }
    socket.data.projectId = undefined;
    socket.data.activeFileId = null;
  }

  private initializeEvents(socket: AuthenticatedSocket): void {
    const user = socket.data.user!;
    if (socket.data.accessTokenExpiresAt) {
      const timer = setTimeout(() => {
        socket.emit('workspace:error', { code: 'SESSION_EXPIRED', message: 'Refreshing your session…' });
        socket.disconnect(true);
      }, Math.max(1, socket.data.accessTokenExpiresAt - Date.now()));
      timer.unref(); socket.once('disconnect', () => clearTimeout(timer));
    }
    // Serialize client events so join/authorization finishes before subsequent mutations.
    let queue = Promise.resolve();
    const on = (event: string, handler: (data: any) => unknown | Promise<unknown>) => {
      socket.on(event, (payload: unknown, ack?: (result: unknown) => void) => {
        queue = queue.then(async () => {
          try {
            if (!socket.connected) return;
            if (socket.data.accessTokenExpiresAt && Date.now() >= socket.data.accessTokenExpiresAt) throw new AppError('Your session has expired.', 401, 'SESSION_EXPIRED');
            if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new AppError('Invalid event payload.', 400, 'INVALID_PAYLOAD');
            const result = await handler(payload);
            if (typeof ack === 'function') ack({ ok: true, ...(result && typeof result === 'object' ? result : {}) });
          } catch (err) {
            const error = err instanceof AppError ? { code: err.code, message: err.message } : { code: 'INVALID_EVENT', message: 'The workspace event could not be processed.' };
            socket.emit('workspace:error', { event, ...error });
            if (typeof ack === 'function') ack({ ok: false, error });
          }
        });
      });
    };

    on('workspace:join', async ({ projectId, activeFileId }) => {
      await this.projectAccess(socket, projectId);
      if (socket.data.projectId !== projectId) this.leaveWorkspace(socket);
      socket.data.projectId = projectId;
      socket.data.activeFileId = activeFileId || null;
      await socket.join(`project:${projectId}`);
      if (!this.workspaceMembers.has(projectId)) this.workspaceMembers.set(projectId, new Map());
      const member = { socketId: socket.id, user, activeFileId: socket.data.activeFileId, joinedAt: new Date() };
      this.workspaceMembers.get(projectId)!.set(socket.id, member);
      this.io.to(`project:${projectId}`).emit('workspace:collaborators', { collaborators: Array.from(this.workspaceMembers.get(projectId)!.values()) });
      socket.to(`project:${projectId}`).emit('workspace:user_joined', { member });
    });
    on('workspace:leave', () => this.leaveWorkspace(socket));
    on('presence:update_file', async ({ projectId, activeFileId }) => {
      const id = projectId || socket.data.projectId;
      await this.projectAccess(socket, id);
      if (!socket.rooms.has(`project:${id}`)) throw new AppError('Join this workspace first.', 403, 'FORBIDDEN');
      if (activeFileId) await this.fileAccess(socket, activeFileId);
      socket.data.activeFileId = activeFileId || null;
      const member = this.workspaceMembers.get(id)?.get(socket.id);
      if (member) member.activeFileId = activeFileId;
      socket.to(`project:${id}`).emit('presence:file_changed', { socketId: socket.id, userId: user.userId, activeFileId });
    });
    on('crdt:join_file', async ({ fileId }) => {
      const file = await this.fileAccess(socket, fileId);
      // Only persisted server content may seed a document; a client cannot overwrite it on join.
      await this.yjsManager.getOrCreateDoc(fileId);
      await socket.join(`file:${fileId}`);
      socket.data.fileProjects = { ...socket.data.fileProjects, [fileId]: file.projectId.toString() };
      const state = await this.yjsManager.encodeFullState(fileId);
      socket.emit('crdt:initial_state', { fileId, state: Buffer.from(state).toString('base64') });
      socket.to(`file:${fileId}`).emit('crdt:peer_joined_file', { fileId, socketId: socket.id, user });
    });
    on('crdt:update', async ({ fileId, update }) => {
      await this.fileAccess(socket, fileId, 'editor');
      if (!socket.rooms.has(`file:${fileId}`)) throw new AppError('Join this file before editing.', 403, 'FORBIDDEN');
      if (typeof update !== 'string' || update.length > 350000 || !/^[A-Za-z0-9+/]*={0,2}$/.test(update)) throw new AppError('Invalid or oversized document update.', 400, 'INVALID_UPDATE');
      const binary = new Uint8Array(Buffer.from(update, 'base64'));
      await this.yjsManager.applyUpdate(fileId, binary);
      socket.to(`file:${fileId}`).emit('crdt:update', { fileId, update, senderSocketId: socket.id });
    });
    on('crdt:save', async ({ fileId }) => {
      await this.fileAccess(socket, fileId, 'editor');
      if (!socket.rooms.has(`file:${fileId}`)) throw new AppError('Join this file before saving.', 403, 'FORBIDDEN');
      await this.yjsManager.persistDocToDatabase(fileId);
      return { content: this.yjsManager.getTextContent(fileId) };
    });
    on('crdt:content_change', () => { throw new AppError('Use CRDT updates to preserve concurrent edits.', 400, 'CRDT_PROTOCOL_REQUIRED'); });
    on('crdt:awareness', async ({ fileId, cursor, selection }) => {
      await this.fileAccess(socket, fileId);
      if (!socket.rooms.has(`file:${fileId}`)) throw new AppError('Join this file first.', 403, 'FORBIDDEN');
      if (!Number.isInteger(cursor?.line) || !Number.isInteger(cursor?.column) || cursor.line < 1 || cursor.column < 1) return;
      socket.to(`file:${fileId}`).emit('crdt:peer_awareness', { fileId, socketId: socket.id, user, cursor, selection });
    });
    on('crdt:leave_file', ({ fileId }) => {
      socket.leave(`file:${fileId}`);
      delete socket.data.fileProjects?.[fileId];
      socket.to(`file:${fileId}`).emit('crdt:peer_left_file', { fileId, socketId: socket.id, userId: user.userId });
    });
    on('chat:send', async ({ projectId, ...input }) => {
      await this.projectAccess(socket, projectId);
      const message = await ChatService.sendMessage(projectId, user.userId, sendMessageSchema.parse(input));
      this.io.to(`project:${projectId}`).emit('chat:new_message', { message });
    });
    on('chat:typing', async ({ projectId, isTyping }) => {
      await this.projectAccess(socket, projectId);
      socket.to(`project:${projectId}`).emit('chat:user_typing', { socketId: socket.id, user, isTyping: !!isTyping });
    });
    on('webrtc:join_voice', async ({ projectId, isMuted = false, isDeafened = false }) => {
      await this.projectAccess(socket, projectId);
      this.leaveVoice(socket);
      const peers = this.voiceRooms.get(projectId) || new Map<string, VoicePeerInfo>();
      this.voiceRooms.set(projectId, peers);
      const existing = Array.from(peers.values());
      const peer = { socketId: socket.id, user, isMuted: !!isMuted, isDeafened: !!isDeafened, joinedAt: new Date() };
      peers.set(socket.id, peer);
      socket.data.voiceProjectId = projectId;
      await socket.join(`voice:${projectId}`);
      socket.emit('webrtc:voice_peers', { peers: existing });
      socket.to(`voice:${projectId}`).emit('webrtc:peer_joined', { peer });
    });
    for (const event of ['offer', 'answer', 'ice_candidate']) {
      on(`webrtc:${event}`, async data => {
        const projectId = socket.data.voiceProjectId;
        if (!projectId || !this.voiceRooms.get(projectId)?.has(data.targetSocketId)) throw new AppError('Voice signaling is restricted to peers in the same voice room.', 403, 'FORBIDDEN');
        await this.projectAccess(socket, projectId);
        const field = event === 'ice_candidate' ? 'candidate' : event;
        this.io.to(data.targetSocketId).emit(`webrtc:${event}`, { senderSocketId: socket.id, user, [field]: data[field] });
      });
    }
    on('webrtc:mute_status', async ({ isMuted, isDeafened }) => {
      const id = socket.data.voiceProjectId;
      if (!id) return;
      await this.projectAccess(socket, id);
      const peer = this.voiceRooms.get(id)?.get(socket.id);
      if (peer) { peer.isMuted = !!isMuted; peer.isDeafened = !!isDeafened; }
      socket.to(`voice:${id}`).emit('webrtc:peer_mute_status', { socketId: socket.id, isMuted: !!isMuted, isDeafened: !!isDeafened });
    });
    on('webrtc:leave_voice', () => this.leaveVoice(socket));
    socket.on('disconnect', () => this.leaveWorkspace(socket));
  }
}
