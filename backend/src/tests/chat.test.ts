import { createTestDatabase } from './database';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createServer, Server as HttpServer } from 'http';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { createApp } from '../app';
import { SocketManager } from '../sockets';
import { User } from '../models/User';
import { Project } from '../models/Project';
import { ChatMessage } from '../models/ChatMessage';

describe('In-Project Communication & WebRTC Voice Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  let httpServer: HttpServer;
  let serverPort: number;

  let tokenAlice: string;
  let tokenBob: string;
  let tokenCharlie: string;
  let projectId: string;
  const clients: ClientSocket[] = [];
  afterEach(() => { clients.splice(0).forEach(client => client.disconnect()); });

  beforeAll(async () => {
    mongoServer = await createTestDatabase();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    const app = createApp();
    httpServer = createServer(app);
    SocketManager.initialize(httpServer);

    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        const addr = httpServer.address();
        if (addr && typeof addr !== 'string') {
          serverPort = addr.port;
        }
        resolve();
      });
    });
  }, 120000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
    await new Promise<void>((resolve) => {
      httpServer.close(() => resolve());
    });
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Project.deleteMany({});
    await ChatMessage.deleteMany({});

    // Register Alice (Owner)
    const res1 = await request(httpServer).post('/api/v1/auth/register').send({
      name: 'Alice Cooper',
      username: 'alice_cooper',
      email: 'alice@codesync.ai',
      password: 'Password123!',
    });
    tokenAlice = res1.body.data.accessToken;

    // Register Bob (Collaborator)
    const res2 = await request(httpServer).post('/api/v1/auth/register').send({
      name: 'Bob Marley',
      username: 'bob_marley',
      email: 'bob@codesync.ai',
      password: 'Password123!',
    });
    tokenBob = res2.body.data.accessToken;

    // Register Charlie (Unauthorized)
    const res3 = await request(httpServer).post('/api/v1/auth/register').send({
      name: 'Charlie Brown',
      username: 'charlie_brown',
      email: 'charlie@codesync.ai',
      password: 'Password123!',
    });
    tokenCharlie = res3.body.data.accessToken;

    // Create Project
    const projRes = await request(httpServer)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${tokenAlice}`)
      .send({
        name: 'Chat & Voice Hub',
        template: 'blank',
      });
    projectId = projRes.body.data.project.id;

    // Invite Bob to project
    await request(httpServer)
      .post(`/api/v1/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${tokenAlice}`)
      .send({ emailOrUsername: 'bob_marley', role: 'editor' });
  });

  const createTestClient = (token?: string, autoConnect = true): ClientSocket => {
    const client = Client(`http://localhost:${serverPort}`, {
      auth: { token },
      transports: ['websocket'],
      forceNew: true,
      autoConnect,
    });
    clients.push(client);
    return client;
  };

  describe('REST Message History Endpoints', () => {
    it('should allow sending and retrieving messages in a project workspace', async () => {
      // 1. Alice sends message with a code reference
      const sendRes = await request(httpServer)
        .post(`/api/v1/projects/${projectId}/messages`)
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({
          text: 'Check out this function implementation!',
          fileReference: {
            path: '/src/main.js',
            line: 42,
          },
        });

      expect(sendRes.status).toBe(201);
      expect(sendRes.body.data.message.text).toBe('Check out this function implementation!');
      expect(sendRes.body.data.message.fileReference.path).toBe('/src/main.js');
      expect(sendRes.body.data.message.fileReference.line).toBe(42);
      expect(sendRes.body.data.message.sender.username).toBe('alice_cooper');

      // 2. Bob retrieves messages
      const getRes = await request(httpServer)
        .get(`/api/v1/projects/${projectId}/messages`)
        .set('Authorization', `Bearer ${tokenBob}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.messages.length).toBe(1);
      expect(getRes.body.data.messages[0].text).toBe('Check out this function implementation!');
    });

    it('should allow message author to delete their own message', async () => {
      const sendRes = await request(httpServer)
        .post(`/api/v1/projects/${projectId}/messages`)
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ text: 'Typo to delete' });
      const msgId = sendRes.body.data.message.id;

      const delRes = await request(httpServer)
        .delete(`/api/v1/messages/${msgId}`)
        .set('Authorization', `Bearer ${tokenAlice}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.data.deleted).toBe(true);

      const checkRes = await request(httpServer)
        .get(`/api/v1/projects/${projectId}/messages`)
        .set('Authorization', `Bearer ${tokenAlice}`);
      expect(checkRes.body.data.messages.length).toBe(0);
    });

    it('should reject unauthorized user from accessing project messages', async () => {
      const getRes = await request(httpServer)
        .get(`/api/v1/projects/${projectId}/messages`)
        .set('Authorization', `Bearer ${tokenCharlie}`);

      expect(getRes.status).toBe(403);
      expect(getRes.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Real-Time Socket Chat & Typing Indicators', () => {
    it('should broadcast new chat messages and typing state to peers', async () => {
      const socketAlice = createTestClient(tokenAlice);
      const socketBob = createTestClient(tokenBob);

      await new Promise<void>((resolve) => {
        socketAlice.on('connect', () => {
          socketAlice.emit('workspace:join', { projectId });
        });

        socketBob.on('connect', () => {
          socketBob.emit('workspace:join', { projectId });

          // Alice listens for Bob's typing event
          socketAlice.on('chat:user_typing', (data: any) => {
            expect(data.user.username).toBe('bob_marley');
            expect(data.isTyping).toBe(true);
          });

          // Alice listens for Bob's message
          socketAlice.on('chat:new_message', (data: any) => {
            expect(data.message.text).toBe('Hello Alice from real-time socket!');
            expect(data.message.sender.username).toBe('bob_marley');
            socketAlice.disconnect();
            socketBob.disconnect();
            resolve();
          });

          // Bob types then sends message
          setTimeout(() => {
            socketBob.emit('chat:typing', { projectId, isTyping: true });
            socketBob.emit('chat:send', {
              projectId,
              text: 'Hello Alice from real-time socket!',
            });
          }, 100);
        });
      });
    });
  });

  describe('WebRTC Voice Signaling Protocol', () => {
    it('should coordinate WebRTC voice room join and relay SDP offer/answer', async () => {
      const socketAlice = createTestClient(tokenAlice);
      const socketBob = createTestClient(tokenBob, false);

      await new Promise<void>((resolve) => {
        let bobSocketId: string;

        socketAlice.on('connect', () => {
          socketAlice.emit('webrtc:join_voice', { projectId, isMuted: false });
        });
        socketAlice.once('webrtc:voice_peers', () => socketBob.connect());

        socketAlice.on('webrtc:peer_joined', (data: any) => {
          expect(data.peer.user.username).toBe('bob_marley');
          bobSocketId = data.peer.socketId;

          // Alice sends SDP offer to Bob
          socketAlice.emit('webrtc:offer', {
            targetSocketId: bobSocketId,
            offer: { type: 'offer', sdp: 'v=0\r\no=alice 12345 12345 IN IP4 0.0.0.0...' },
          });
        });

        socketBob.on('connect', () => {
          // Bob joins voice after Alice
          socketBob.emit('webrtc:join_voice', { projectId, isMuted: false });

          // Bob receives SDP offer from Alice
          socketBob.on('webrtc:offer', (data: any) => {
            expect(data.user.username).toBe('alice_cooper');
            expect(data.offer.sdp).toContain('alice');

            // Bob responds with SDP answer
            socketBob.emit('webrtc:answer', {
              targetSocketId: data.senderSocketId,
              answer: { type: 'answer', sdp: 'v=0\r\no=bob 67890 67890 IN IP4 0.0.0.0...' },
            });
          });
        });

        // Alice receives SDP answer from Bob
        socketAlice.on('webrtc:answer', (data: any) => {
          expect(data.user.username).toBe('bob_marley');
          expect(data.answer.sdp).toContain('bob');

          socketAlice.disconnect();
          socketBob.disconnect();
          resolve();
        });
      });
    });
  });
});
