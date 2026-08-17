import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../app';
import { User } from '../models/User';
import { Project } from '../models/Project';

describe('Project Management & Collaboration Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  const app = createApp();

  let user1Token: string;
  let user1Id: string;
  let user2Token: string;
  let user2Id: string;
  let user3Token: string;
  let user3Id: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  }, 120000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Project.deleteMany({});

    // Register User 1 (Alice)
    const res1 = await request(app).post('/api/v1/auth/register').send({
      name: 'Alice Developer',
      username: 'alice_dev',
      email: 'alice@codesync.ai',
      password: 'Password123!',
    });
    user1Token = res1.body.data.accessToken;
    user1Id = res1.body.data.user.id;

    // Register User 2 (Bob)
    const res2 = await request(app).post('/api/v1/auth/register').send({
      name: 'Bob Collaborator',
      username: 'bob_collab',
      email: 'bob@codesync.ai',
      password: 'Password123!',
    });
    user2Token = res2.body.data.accessToken;
    user2Id = res2.body.data.user.id;

    // Register User 3 (Charlie)
    const res3 = await request(app).post('/api/v1/auth/register').send({
      name: 'Charlie Stranger',
      username: 'charlie',
      email: 'charlie@codesync.ai',
      password: 'Password123!',
    });
    user3Token = res3.body.data.accessToken;
    user3Id = res3.body.data.user.id;
  });

  describe('POST /api/v1/projects', () => {
    it('should create a project with template and tags successfully', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Realtime Cloud Canvas',
          description: 'A collaborative real-time canvas built with React',
          template: 'react',
          visibility: 'private',
          tags: ['react', 'crdt'],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.project.name).toBe('Realtime Cloud Canvas');
      expect(res.body.data.project.template).toBe('react');
      expect(res.body.data.project.owner.id).toBe(user1Id);
      expect(res.body.data.project.members).toHaveLength(1);
      expect(res.body.data.project.members[0].role).toBe('owner');
    });

    it('should reject project creation if unauthenticated', async () => {
      const res = await request(app).post('/api/v1/projects').send({
        name: 'Secret Project',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/projects', () => {
    beforeEach(async () => {
      // Create Project 1 by Alice
      await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Alice Backend API',
          template: 'nodejs',
          visibility: 'private',
          tags: ['nodejs', 'express'],
        });

      // Create Project 2 by Alice (Shared with Bob)
      const p2 = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Shared Algorithm Lab',
          template: 'python',
          visibility: 'private',
          tags: ['python', 'algo'],
        });

      await request(app)
        .post(`/api/v1/projects/${p2.body.data.project.id}/members`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ emailOrUsername: 'bob_collab', role: 'editor' });

      // Create Project 3 by Bob
      await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          name: 'Bob Frontend App',
          template: 'react',
          visibility: 'private',
          tags: ['react'],
        });
    });

    it('should list all projects accessible to Alice (owned + shared)', async () => {
      const res = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.projects).toHaveLength(2);
      expect(res.body.data.total).toBe(2);
    });

    it('should filter projects owned by user with filter=owned', async () => {
      const res = await request(app)
        .get('/api/v1/projects?filter=owned')
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.projects).toHaveLength(1);
      expect(res.body.data.projects[0].name).toBe('Bob Frontend App');
    });

    it('should filter projects shared with user with filter=shared', async () => {
      const res = await request(app)
        .get('/api/v1/projects?filter=shared')
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.projects).toHaveLength(1);
      expect(res.body.data.projects[0].name).toBe('Shared Algorithm Lab');
    });

    it('should search projects by keyword match', async () => {
      const res = await request(app)
        .get('/api/v1/projects?search=algorithm')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.projects).toHaveLength(1);
      expect(res.body.data.projects[0].name).toBe('Shared Algorithm Lab');
    });
  });

  describe('Collaborator Management & Permissions', () => {
    let projectId: string;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Collaboration Test Project',
          template: 'cpp',
          visibility: 'private',
        });
      projectId = res.body.data.project.id;
    });

    it('should allow owner to invite collaborator by username', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${projectId}/members`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          emailOrUsername: 'bob_collab',
          role: 'editor',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.project.members).toHaveLength(2);
      expect(res.body.data.project.members[1].role).toBe('editor');
      expect(res.body.data.project.members[1].user.username).toBe('bob_collab');
    });

    it('should reject duplicate collaborator invitation', async () => {
      await request(app)
        .post(`/api/v1/projects/${projectId}/members`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ emailOrUsername: 'bob_collab', role: 'editor' });

      const res = await request(app)
        .post(`/api/v1/projects/${projectId}/members`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ emailOrUsername: 'bob_collab', role: 'viewer' });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('MEMBER_EXISTS');
    });

    it('should allow owner to update member role from editor to viewer', async () => {
      await request(app)
        .post(`/api/v1/projects/${projectId}/members`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ emailOrUsername: 'bob_collab', role: 'editor' });

      const res = await request(app)
        .patch(`/api/v1/projects/${projectId}/members/${user2Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ role: 'viewer' });

      expect(res.status).toBe(200);
      const bobMember = res.body.data.project.members.find((m: any) => m.user.id === user2Id);
      expect(bobMember.role).toBe('viewer');
    });

    it('should allow owner to remove collaborator', async () => {
      await request(app)
        .post(`/api/v1/projects/${projectId}/members`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ emailOrUsername: 'bob_collab', role: 'editor' });

      const res = await request(app)
        .delete(`/api/v1/projects/${projectId}/members/${user2Id}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.project.members).toHaveLength(1);
    });

    it('should forbid unauthorized user (Charlie) from accessing private project', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${projectId}`)
        .set('Authorization', `Bearer ${user3Token}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Project Cloning & Deletion', () => {
    let projectId: string;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Original Master Project',
          template: 'go',
          description: 'Production Go Service',
          visibility: 'public',
          tags: ['go', 'microservice'],
        });
      projectId = res.body.data.project.id;
    });

    it('should clone an existing project as a new copy', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${projectId}/clone`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.status).toBe(201);
      expect(res.body.data.project.name).toBe('Original Master Project (Copy)');
      expect(res.body.data.project.owner.id).toBe(user2Id);
      expect(res.body.data.project.template).toBe('go');
    });

    it('should allow owner to delete project', async () => {
      const res = await request(app)
        .delete(`/api/v1/projects/${projectId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);

      // Verify it no longer exists
      const check = await request(app)
        .get(`/api/v1/projects/${projectId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(check.status).toBe(404);
    });
  });
});
