import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createServer, Server as HttpServer } from 'http';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import * as Y from 'yjs';
import { createApp } from '../app';
import { SocketManager } from '../sockets';
import { YjsDocManager } from '../sockets/yjsManager';
import { User } from '../models/User';
import { Project } from '../models/Project';
import { FileNode } from '../models/FileNode';

describe('Real-Time CRDT Collaboration & Presence Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  let httpServer: HttpServer;
  let serverPort: number;

  let tokenAlice: string;
  let tokenBob: string;
  let projectId: string;
  let fileId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    // Setup HTTP server with SocketManager
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
    await FileNode.deleteMany({});

    // Register Alice
    const res1 = await request(httpServer).post('/api/v1/auth/register').send({
      name: 'Alice Cooper',
      username: 'alice_cooper',
      email: 'alice@codesync.ai',
      password: 'Password123!',
    });
    tokenAlice = res1.body.data.accessToken;

    // Register Bob
    const res2 = await request(httpServer).post('/api/v1/auth/register').send({
      name: 'Bob Marley',
      username: 'bob_marley',
      email: 'bob@codesync.ai',
      password: 'Password123!',
    });
    tokenBob = res2.body.data.accessToken;

    // Create Project
    const projRes = await request(httpServer)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${tokenAlice}`)
      .send({
        name: 'Collaborative Sandbox',
        template: 'blank',
      });
    projectId = projRes.body.data.project.id;

    // Create File
    const fileRes = await request(httpServer)
      .post(`/api/v1/projects/${projectId}/files`)
      .set('Authorization', `Bearer ${tokenAlice}`)
      .send({
        name: 'main.js',
        type: 'file',
        content: 'console.log("Initial seed content");',
      });
    fileId = fileRes.body.data.file.id;
  });

  const createTestClient = (token?: string): ClientSocket => {
    return Client(`http://localhost:${serverPort}`, {
      auth: { token },
      transports: ['websocket'],
      forceNew: true,
    });
  };

  it('should authenticate socket connection and broadcast workspace presence', async () => {
    const socketAlice = createTestClient(tokenAlice);

    await new Promise<void>((resolve) => {
      socketAlice.on('connect', () => {
        socketAlice.emit('workspace:join', { projectId });
      });

      socketAlice.on('workspace:collaborators', (data: any) => {
        expect(data.collaborators).toBeDefined();
        expect(data.collaborators.length).toBeGreaterThan(0);
        expect(data.collaborators[0].user.username).toBe('alice_cooper');
        expect(data.collaborators[0].user.color).toBeDefined();
        socketAlice.disconnect();
        resolve();
      });
    });
  });

  it('should notify peers when another collaborator joins the workspace', async () => {
    const socketAlice = createTestClient(tokenAlice);
    const socketBob = createTestClient(tokenBob);

    await new Promise<void>((resolve) => {
      socketAlice.on('connect', () => {
        socketAlice.emit('workspace:join', { projectId });

        socketAlice.on('workspace:user_joined', (data: any) => {
          expect(data.member.user.username).toBe('bob_marley');
          expect(data.member.user.color).toBeDefined();
          socketAlice.disconnect();
          socketBob.disconnect();
          resolve();
        });

        // Bob connects and joins after Alice is listening
        socketBob.on('connect', () => {
          socketBob.emit('workspace:join', { projectId });
        });
      });
    });
  });

  it('should load initial CRDT document state when joining a file', async () => {
    const socketAlice = createTestClient(tokenAlice);

    await new Promise<void>((resolve) => {
      socketAlice.on('connect', () => {
        socketAlice.emit('crdt:join_file', {
          fileId,
          initialContent: 'console.log("Initial seed content");',
        });
      });

      socketAlice.on('crdt:initial_state', (data: any) => {
        expect(data.fileId).toBe(fileId);
        expect(data.state).toBeDefined();

        // Decode Yjs state
        const binaryState = new Uint8Array(Buffer.from(data.state, 'base64'));
        const clientDoc = new Y.Doc();
        Y.applyUpdate(clientDoc, binaryState);

        const text = clientDoc.getText('monaco').toString();
        expect(text).toBe('console.log("Initial seed content");');

        socketAlice.disconnect();
        resolve();
      });
    });
  });

  it('should synchronize concurrent Yjs CRDT updates between Alice and Bob', async () => {
    const socketAlice = createTestClient(tokenAlice);
    const socketBob = createTestClient(tokenBob);

    const docAlice = new Y.Doc();
    const docBob = new Y.Doc();

    await new Promise<void>((resolve) => {
      // 1. Alice joins file and initializes local Y.Doc
      socketAlice.on('connect', () => {
        socketAlice.emit('crdt:join_file', {
          fileId,
          initialContent: 'console.log("Initial seed content");',
        });
      });

      socketAlice.on('crdt:initial_state', (data: any) => {
        const stateA = new Uint8Array(Buffer.from(data.state, 'base64'));
        Y.applyUpdate(docAlice, stateA);

        // 2. Bob joins file
        socketBob.emit('crdt:join_file', { fileId });
      });

      socketBob.on('crdt:initial_state', (data: any) => {
        const stateB = new Uint8Array(Buffer.from(data.state, 'base64'));
        Y.applyUpdate(docBob, stateB);

        // 3. Alice inserts code and sends update to Bob
        const yTextA = docAlice.getText('monaco');
        docAlice.on('update', (update: Uint8Array) => {
          socketAlice.emit('crdt:update', {
            fileId,
            update: Buffer.from(update).toString('base64'),
          });
        });

        yTextA.insert(yTextA.length, '\nconst sync = true;');
      });

      // 4. Bob receives Alice's update
      socketBob.on('crdt:update', (data: any) => {
        expect(data.fileId).toBe(fileId);
        const updateUint8 = new Uint8Array(Buffer.from(data.update, 'base64'));
        Y.applyUpdate(docBob, updateUint8);

        const textBob = docBob.getText('monaco').toString();
        expect(textBob).toContain('const sync = true;');

        socketAlice.disconnect();
        socketBob.disconnect();
        resolve();
      });
    });
  });

  it('should broadcast cursor and selection awareness to peers', async () => {
    const socketAlice = createTestClient(tokenAlice);
    const socketBob = createTestClient(tokenBob);

    await new Promise<void>((resolve) => {
      socketAlice.on('connect', () => {
        socketAlice.emit('crdt:join_file', { fileId });
      });

      socketBob.on('connect', () => {
        socketBob.emit('crdt:join_file', { fileId });

        socketAlice.on('crdt:peer_awareness', (data: any) => {
          expect(data.fileId).toBe(fileId);
          expect(data.user.username).toBe('bob_marley');
          expect(data.cursor.line).toBe(4);
          expect(data.cursor.column).toBe(12);
          expect(data.selection).toBeDefined();

          socketAlice.disconnect();
          socketBob.disconnect();
          resolve();
        });

        // Bob broadcasts cursor movement
        setTimeout(() => {
          socketBob.emit('crdt:awareness', {
            fileId,
            cursor: { line: 4, column: 12 },
            selection: { startLine: 4, startCol: 5, endLine: 4, endCol: 12 },
          });
        }, 100);
      });
    });
  });

  it('should persist Yjs changes into MongoDB FileNode via flushAll', async () => {
    const yjsManager = YjsDocManager.getInstance();
    const doc = await yjsManager.getOrCreateDoc(fileId, 'Original');
    doc.getText('monaco').insert(8, ' with CRDT modification');

    await yjsManager.flushAll();

    const fileInDb = await FileNode.findById(fileId);
    expect(fileInDb).toBeDefined();
    expect(fileInDb?.content).toContain('with CRDT modification');
  });
});
