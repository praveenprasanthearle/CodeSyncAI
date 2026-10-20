import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createServer, Server as HttpServer } from 'http';
import { io, Socket } from 'socket.io-client';
import * as Y from 'yjs';
import { createTestDatabase } from './database';
import { createApp } from '../app';
import { SocketManager } from '../sockets';
import { YjsDocManager } from '../sockets/yjsManager';
import { Project } from '../models/Project';
import { FileNode } from '../models/FileNode';
import { Snapshot } from '../models/Snapshot';

describe('Workspace authorization across HTTP, CRDT and voice', () => {
  let database: MongoMemoryServer, server: HttpServer, manager: SocketManager, url: string;
  let projectId: string, fileId: string, snapshotId: string;
  const users: Record<string, { id: string; token: string }> = {};
  const clients: Socket[] = [];
  beforeAll(async () => {
    database = await createTestDatabase(); await mongoose.connect(database.getUri());
    server = createServer(createApp()); manager = SocketManager.initialize(server);
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    url = `http://127.0.0.1:${(server.address() as any).port}`;
    for (const name of ['owner', 'editor', 'viewer', 'stranger']) {
      const response = await request(server).post('/api/v1/auth/register').send({ name: `Test ${name}`, username: `security_${name}`, email: `${name}@security.test`, password: 'Password123!' });
      users[name] = { id: response.body.data.user.id, token: response.body.data.accessToken };
    }
  });
  beforeEach(async () => {
    const response = await request(server).post('/api/v1/projects').set('Authorization', `Bearer ${users.owner.token}`).send({ name: 'Private Workspace', template: 'blank', visibility: 'private' });
    projectId = response.body.data.project.id;
    for (const role of ['editor', 'viewer']) await request(server).post(`/api/v1/projects/${projectId}/members`).set('Authorization', `Bearer ${users.owner.token}`).send({ emailOrUsername: `security_${role}`, role });
    const file = await request(server).post(`/api/v1/projects/${projectId}/files`).set('Authorization', `Bearer ${users.owner.token}`).send({ name: 'main.js', type: 'file', content: 'const protectedValue = 42;' });
    fileId = file.body.data.file.id;
    const snapshot = await request(server).post(`/api/v1/projects/${projectId}/snapshots`).set('Authorization', `Bearer ${users.owner.token}`).send({ name: 'Protected snapshot' });
    snapshotId = snapshot.body.data.snapshot.id;
  });
  afterEach(async () => { clients.splice(0).forEach(socket => socket.disconnect()); await YjsDocManager.getInstance().flushAll(); });
  afterAll(async () => {
    clients.forEach(socket => socket.disconnect());
    await new Promise<void>(resolve => manager.io.close(() => resolve()));
    await YjsDocManager.getInstance().dispose(); await mongoose.disconnect(); await database.stop();
  });
  const connect = (role?: string): Promise<Socket> => {
    const socket = io(url, { auth: { token: role ? users[role].token : undefined }, autoConnect: false, transports: ['websocket'], reconnection: false });
    clients.push(socket);
    return new Promise((resolve, reject) => { socket.once('connect', () => resolve(socket)); socket.once('connect_error', reject); socket.connect(); });
  };
  const emit = (socket: Socket, event: string, payload: unknown): Promise<any> => new Promise((resolve, reject) => socket.timeout(3000).emit(event, payload, (error: Error | null, result: unknown) => error ? reject(error) : resolve(result)));

  it('rejects unauthenticated socket connections', async () => {
    await expect(connect()).rejects.toThrow('AUTHENTICATION_REQUIRED');
  });
  it('blocks outsiders from private workspace presence and file contents', async () => {
    const stranger = await connect('stranger');
    expect((await emit(stranger, 'workspace:join', { projectId })).error.code).toBe('FORBIDDEN');
    expect((await emit(stranger, 'crdt:join_file', { fileId })).error.code).toBe('FORBIDDEN');
    expect(manager.io.sockets.sockets.get(stranger.id!)?.rooms.has(`file:${fileId}`)).toBe(false);
  });
  it('lets viewers read but denies document mutations', async () => {
    const viewer = await connect('viewer');
    expect((await emit(viewer, 'crdt:join_file', { fileId })).ok).toBe(true);
    const update = Buffer.from(Y.encodeStateAsUpdate(new Y.Doc())).toString('base64');
    expect((await emit(viewer, 'crdt:update', { fileId, update })).error.code).toBe('FORBIDDEN');
    expect(YjsDocManager.getInstance().getTextContent(fileId)).toBe('const protectedValue = 42;');
  });
  it('ignores client-provided seed text when loading a file', async () => {
    const editor = await connect('editor');
    const initial = new Promise<any>(resolve => editor.once('crdt:initial_state', resolve));
    await emit(editor, 'crdt:join_file', { fileId, initialContent: 'erase server content' });
    const doc = new Y.Doc(); Y.applyUpdate(doc, Buffer.from((await initial).state, 'base64'));
    expect(doc.getText('monaco').toString()).toBe('const protectedValue = 42;'); doc.destroy();
  });
  it('prevents cross-workspace file access even for a user who owns both projects', async () => {
    const owner = await connect('owner');
    const other = await Project.create({ name: 'Other project', owner: users.owner.id });
    const file = await FileNode.create({ projectId: other.id, name: 'other.js', path: '/other.js', type: 'file', content: 'other' });
    await emit(owner, 'workspace:join', { projectId });
    expect((await emit(owner, 'crdt:join_file', { fileId: file.id })).error.code).toBe('FORBIDDEN');
  });
  it('blocks unauthorized chat and voice signaling', async () => {
    const owner = await connect('owner'), stranger = await connect('stranger');
    expect((await emit(stranger, 'chat:send', { projectId, text: 'intrusion' })).error.code).toBe('FORBIDDEN');
    expect((await emit(stranger, 'webrtc:join_voice', { projectId })).error.code).toBe('FORBIDDEN');
    expect((await emit(stranger, 'webrtc:offer', { targetSocketId: owner.id, offer: { type: 'offer', sdp: 'invalid' } })).error.code).toBe('FORBIDDEN');
  });
  it('evicts a removed collaborator from already joined document rooms', async () => {
    const editor = await connect('editor');
    await emit(editor, 'workspace:join', { projectId }); await emit(editor, 'crdt:join_file', { fileId });
    const removed = new Promise<any>(resolve => editor.once('workspace:error', resolve));
    const response = await request(server).delete(`/api/v1/projects/${projectId}/members/${users.editor.id}`).set('Authorization', `Bearer ${users.owner.token}`);
    expect(response.status).toBe(200); expect((await removed).code).toBe('ACCESS_REVOKED');
    expect(manager.io.sockets.sockets.get(editor.id!)?.rooms.has(`file:${fileId}`)).toBe(false);
    expect((await emit(editor, 'crdt:join_file', { fileId })).error.code).toBe('FORBIDDEN');
  });
  it('checks access for individual snapshot reads and restores', async () => {
    expect((await request(server).get(`/api/v1/snapshots/${snapshotId}`).set('Authorization', `Bearer ${users.stranger.token}`)).status).toBe(403);
    expect((await request(server).post(`/api/v1/snapshots/${snapshotId}/restore`).set('Authorization', `Bearer ${users.viewer.token}`)).status).toBe(403);
    expect(await FileNode.findById(fileId)).not.toBeNull();
  });
  it('returns correct roles after populating owner and member documents', async () => {
    const response = await request(server).get(`/api/v1/projects/${projectId}`).set('Authorization', `Bearer ${users.editor.token}`);
    expect(response.body.data.project.userRole).toBe('editor');
  });
  it('does not let a snapshot creator delete it after being downgraded to viewer', async () => {
    await Snapshot.findByIdAndUpdate(snapshotId, { createdBy: users.viewer.id });
    const response = await request(server).delete(`/api/v1/snapshots/${snapshotId}`).set('Authorization', `Bearer ${users.viewer.token}`);
    expect(response.status).toBe(403);
  });
});
