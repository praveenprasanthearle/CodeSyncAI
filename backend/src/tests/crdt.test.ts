import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
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
import { User } from '../models/User';
import { Project } from '../models/Project';
import { FileNode } from '../models/FileNode';

describe('Real-time collaboration with acknowledged joins', () => {
  let database: MongoMemoryServer, server: HttpServer, manager: SocketManager, url: string;
  let aliceToken: string, bobToken: string, projectId: string, fileId: string;
  const clients: Socket[] = [];
  const documents = YjsDocManager.getInstance();
  beforeAll(async () => {
    database = await createTestDatabase(); await mongoose.connect(database.getUri());
    server = createServer(createApp()); manager = SocketManager.initialize(server);
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    url = `http://127.0.0.1:${(server.address() as any).port}`;
  });
  beforeEach(async () => {
    await User.deleteMany({}); await Project.deleteMany({}); await FileNode.deleteMany({});
    const register = async (name: string) => (await request(server).post('/api/v1/auth/register').send({ name: `${name} Developer`, username: name.toLowerCase(), email: `${name}@codesync.test`, password: 'Password123!' })).body.data.accessToken;
    aliceToken = await register('Alice'); bobToken = await register('Bob');
    const project = await request(server).post('/api/v1/projects').set('Authorization', `Bearer ${aliceToken}`).send({ name: 'Collaboration Test', template: 'blank' });
    projectId = project.body.data.project.id;
    await request(server).post(`/api/v1/projects/${projectId}/members`).set('Authorization', `Bearer ${aliceToken}`).send({ emailOrUsername: 'bob', role: 'editor' });
    const file = await request(server).post(`/api/v1/projects/${projectId}/files`).set('Authorization', `Bearer ${aliceToken}`).send({ name: 'main.js', type: 'file', content: 'console.log("Initial seed content");' });
    fileId = file.body.data.file.id;
  });
  afterEach(async () => { clients.splice(0).forEach(socket => socket.disconnect()); await documents.dispose(); });
  afterAll(async () => { await new Promise<void>(resolve => manager.io.close(() => resolve())); await mongoose.disconnect(); await database.stop(); });
  const connect = (token: string): Promise<Socket> => {
    const socket = io(url, { auth: { token }, transports: ['websocket'], autoConnect: false, reconnection: false }); clients.push(socket);
    return new Promise((resolve, reject) => { socket.once('connect', () => resolve(socket)); socket.once('connect_error', reject); socket.connect(); });
  };
  const event = (socket: Socket, name: string): Promise<any> => new Promise((resolve, reject) => {
    const handler = (data: unknown) => { clearTimeout(timer); resolve(data); };
    const timer = setTimeout(() => { socket.off(name, handler); reject(new Error(`Timed out waiting for ${name}`)); }, 5000);
    socket.once(name, handler);
  });
  const emit = (socket: Socket, name: string, data: unknown): Promise<any> => new Promise((resolve, reject) => socket.timeout(5000).emit(name, data, (error: Error | null, result: any) => {
    if (error) reject(error); else if (!result.ok) reject(new Error(result.error.message)); else resolve(result);
  }));
  const joinFile = async (socket: Socket): Promise<Y.Doc> => {
    const initial = event(socket, 'crdt:initial_state'); await emit(socket, 'crdt:join_file', { fileId });
    const doc = new Y.Doc(); Y.applyUpdate(doc, Buffer.from((await initial).state, 'base64')); return doc;
  };
  it('authenticates and publishes workspace presence', async () => {
    const alice = await connect(aliceToken), presence = event(alice, 'workspace:collaborators');
    await emit(alice, 'workspace:join', { projectId });
    const result = await presence; expect(result.collaborators[0].user.username).toBe('alice'); expect(result.collaborators[0].user.color).toBeDefined();
  });
  it('notifies peers only after the second collaborator has joined', async () => {
    const alice = await connect(aliceToken); await emit(alice, 'workspace:join', { projectId });
    const bob = await connect(bobToken), joined = event(alice, 'workspace:user_joined');
    await emit(bob, 'workspace:join', { projectId }); expect((await joined).member.user.username).toBe('bob');
  });
  it('loads the authoritative initial document', async () => {
    const alice = await connect(aliceToken), doc = await joinFile(alice);
    expect(doc.getText('monaco').toString()).toBe('console.log("Initial seed content");'); doc.destroy();
  });
  it('delivers incremental CRDT updates to a second editor', async () => {
    const alice = await connect(aliceToken), bob = await connect(bobToken);
    const docAlice = await joinFile(alice), docBob = await joinFile(bob);
    const vector = Y.encodeStateVector(docAlice), received = event(bob, 'crdt:update');
    docAlice.getText('monaco').insert(docAlice.getText('monaco').length, '\nconst sync = true;');
    await emit(alice, 'crdt:update', { fileId, update: Buffer.from(Y.encodeStateAsUpdate(docAlice, vector)).toString('base64') });
    Y.applyUpdate(docBob, Buffer.from((await received).update, 'base64'));
    expect(docBob.getText('monaco').toString()).toBe(docAlice.getText('monaco').toString()); docAlice.destroy(); docBob.destroy();
  });
  it('broadcasts cursor awareness after both peers are ready', async () => {
    const alice = await connect(aliceToken), bob = await connect(bobToken);
    (await joinFile(alice)).destroy(); (await joinFile(bob)).destroy();
    const awareness = event(alice, 'crdt:peer_awareness');
    await emit(bob, 'crdt:awareness', { fileId, cursor: { line: 4, column: 12 }, selection: { startLineNumber: 4, startColumn: 5, endLineNumber: 4, endColumn: 12 } });
    const data = await awareness; expect(data.user.username).toBe('bob'); expect(data.cursor).toEqual({ line: 4, column: 12 });
  });
  it('flushes dirty CRDT content to MongoDB', async () => {
    const doc = await documents.getOrCreateDoc(fileId); doc.getText('monaco').insert(0, '// persisted\n');
    await documents.flushAll(); expect((await FileNode.findById(fileId))!.content).toContain('// persisted');
  });
});
