import { createTestDatabase } from './database';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../app';
import { User } from '../models/User';
import { Project } from '../models/Project';
import { FileNode } from '../models/FileNode';

describe('Version Snapshots & Git Tooling Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  const app = createApp();

  let aliceToken: string;
  let bobToken: string;
  let charlieToken: string;

  let aliceId: string;
  let bobId: string;
  let charlieId: string;

  let projectId: string;
  let snapshotId: string;

  beforeAll(async () => {
    mongoServer = await createTestDatabase();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    // 1. Register Alice (Project Owner)
    const aliceRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Alice Owner',
      username: 'alice_snap',
      email: 'alice_snap@codesync.dev',
      password: 'Password123!',
    });
    aliceToken = aliceRes.body.data.accessToken;
    aliceId = aliceRes.body.data.user.id;

    // 2. Register Bob (Collaborator Viewer)
    const bobRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Bob Viewer',
      username: 'bob_snap',
      email: 'bob_snap@codesync.dev',
      password: 'Password123!',
    });
    bobToken = bobRes.body.data.accessToken;
    bobId = bobRes.body.data.user.id;

    // 3. Register Charlie (Unrelated User)
    const charlieRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Charlie Stranger',
      username: 'charlie_snap',
      email: 'charlie_snap@codesync.dev',
      password: 'Password123!',
    });
    charlieToken = charlieRes.body.data.accessToken;
    charlieId = charlieRes.body.data.user.id;

    // 4. Create Project with React template (auto-seeds files)
    const projRes = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        name: 'Snapshot Demo Workspace',
        template: 'react',
        isPublic: false,
      });
    projectId = projRes.body.data.project.id;

    // 5. Add Bob as viewer
    await request(app)
      .post(`/api/v1/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        emailOrUsername: 'bob_snap',
        role: 'viewer',
      });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('POST /api/v1/projects/:id/snapshots', () => {
    it('should allow project owner to take a snapshot of current workspace files', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${projectId}/snapshots`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          name: 'v1.0.0 Initial Stable Release',
          description: 'Baseline starter React workspace setup',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.snapshot.name).toBe('v1.0.0 Initial Stable Release');
      expect(res.body.data.snapshot.fileCount).toBeGreaterThanOrEqual(3);
      expect(res.body.data.snapshot.files.length).toBeGreaterThanOrEqual(3);
      expect(res.body.data.snapshot.totalSizeBytes).toBeGreaterThan(0);

      snapshotId = res.body.data.snapshot.id;
    });

    it('should forbid viewer (Bob) from creating a snapshot', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${projectId}/snapshots`)
        .set('Authorization', `Bearer ${bobToken}`)
        .send({
          name: 'Unauthorized Snapshot',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/projects/:id/snapshots', () => {
    it('should list all snapshots for authorized workspace members', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${projectId}/snapshots`)
        .set('Authorization', `Bearer ${bobToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.snapshots.length).toBe(1);
      expect(res.body.data.snapshots[0].name).toBe('v1.0.0 Initial Stable Release');
    });

    it('should reject unauthorized user (Charlie) from listing snapshots', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${projectId}/snapshots`)
        .set('Authorization', `Bearer ${charlieToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/snapshots/:id', () => {
    it('should retrieve single snapshot details and file list', async () => {
      const res = await request(app)
        .get(`/api/v1/snapshots/${snapshotId}`)
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.snapshot.id).toBe(snapshotId);
      expect(res.body.data.snapshot.files.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/v1/snapshots/:id/restore', () => {
    it('should restore workspace files to snapshot state after files are modified or deleted', async () => {
      // Modify workspace by deleting a file and creating a garbage file
      await FileNode.deleteMany({ projectId, path: '/src/App.jsx' });
      await FileNode.create({
        projectId: new mongoose.Types.ObjectId(projectId),
        name: 'temporary_buggy_file.js',
        type: 'file',
        path: '/temporary_buggy_file.js',
        content: 'broken code',
      });

      // Verify file tree is altered
      let filesBeforeRestore = await FileNode.find({ projectId, type: 'file' });
      expect(filesBeforeRestore.some((f) => f.name === 'temporary_buggy_file.js')).toBe(true);

      // 1-Click Restore Snapshot
      const restoreRes = await request(app)
        .post(`/api/v1/snapshots/${snapshotId}/restore`)
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(restoreRes.status).toBe(200);
      expect(restoreRes.body.success).toBe(true);
      expect(restoreRes.body.data.restoredCount).toBeGreaterThanOrEqual(3);

      // Verify workspace is fully restored
      const filesAfterRestore = await FileNode.find({ projectId, type: 'file' });
      expect(filesAfterRestore.some((f) => f.name === 'temporary_buggy_file.js')).toBe(false);
      expect(filesAfterRestore.some((f) => f.path === '/src/App.jsx')).toBe(true);
    });
  });

  describe('DELETE /api/v1/snapshots/:id', () => {
    it('should allow owner to delete a historical snapshot', async () => {
      const res = await request(app)
        .delete(`/api/v1/snapshots/${snapshotId}`)
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const check = await request(app)
        .get(`/api/v1/snapshots/${snapshotId}`)
        .set('Authorization', `Bearer ${aliceToken}`);
      expect(check.status).toBe(404);
    });
  });
});
