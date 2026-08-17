import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../app';
import { User } from '../models/User';
import { Project } from '../models/Project';
import { FileNode } from '../models/FileNode';

describe('Virtual File System (VFS) Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  const app = createApp();

  let userToken: string;
  let userId: string;
  let collaboratorToken: string;
  let viewerToken: string;

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
    await FileNode.deleteMany({});

    // Register User (Owner)
    const res1 = await request(app).post('/api/v1/auth/register').send({
      name: 'Ada Dev',
      username: 'ada_dev',
      email: 'ada@codesync.ai',
      password: 'Password123!',
    });
    userToken = res1.body.data.accessToken;
    userId = res1.body.data.user.id;

    // Register Collaborator
    const res2 = await request(app).post('/api/v1/auth/register').send({
      name: 'Bob Editor',
      username: 'bob_editor',
      email: 'bob@codesync.ai',
      password: 'Password123!',
    });
    collaboratorToken = res2.body.data.accessToken;

    // Register Viewer
    const res3 = await request(app).post('/api/v1/auth/register').send({
      name: 'Charlie Viewer',
      username: 'charlie_viewer',
      email: 'charlie@codesync.ai',
      password: 'Password123!',
    });
    viewerToken = res3.body.data.accessToken;
  });

  describe('Template Auto-Seeding & File Tree Retrieval', () => {
    it('should automatically seed React starter files on project creation', async () => {
      const projRes = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'React Starter Project',
          template: 'react',
        });

      const projectId = projRes.body.data.project.id;
      expect(projectId).toBeDefined();

      // Retrieve file tree
      const treeRes = await request(app)
        .get(`/api/v1/projects/${projectId}/files`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(treeRes.status).toBe(200);
      expect(treeRes.body.success).toBe(true);

      const files = treeRes.body.data.files;
      expect(files.length).toBeGreaterThan(0);

      // Verify root items include src folder, index.html, package.json, README.md
      const srcFolder = files.find((f: any) => f.name === 'src' && f.type === 'folder');
      const indexHtml = files.find((f: any) => f.name === 'index.html' && f.type === 'file');
      const packageJson = files.find((f: any) => f.name === 'package.json' && f.type === 'file');

      expect(srcFolder).toBeDefined();
      expect(indexHtml).toBeDefined();
      expect(packageJson).toBeDefined();

      // Verify src folder contains children (App.jsx, main.jsx, index.css)
      expect(srcFolder.children).toBeDefined();
      expect(srcFolder.children.length).toBeGreaterThanOrEqual(2);
      const appJsx = srcFolder.children.find((f: any) => f.name === 'App.jsx');
      expect(appJsx).toBeDefined();
      expect(appJsx.language).toBe('javascript');
    });
  });

  describe('File & Directory CRUD Operations', () => {
    let projectId: string;

    beforeEach(async () => {
      const projRes = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'VFS Test Lab',
          template: 'blank',
        });
      projectId = projRes.body.data.project.id;
    });

    it('should create a directory and a nested file inside it', async () => {
      // 1. Create directory 'utils'
      const folderRes = await request(app)
        .post(`/api/v1/projects/${projectId}/files`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'utils',
          type: 'folder',
        });

      expect(folderRes.status).toBe(201);
      expect(folderRes.body.data.file.path).toBe('/utils');
      const folderId = folderRes.body.data.file.id;

      // 2. Create file 'math.ts' inside 'utils'
      const fileRes = await request(app)
        .post(`/api/v1/projects/${projectId}/files`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'math.ts',
          type: 'file',
          parentId: folderId,
          content: 'export const add = (a: number, b: number) => a + b;',
        });

      expect(fileRes.status).toBe(201);
      expect(fileRes.body.data.file.path).toBe('/utils/math.ts');
      expect(fileRes.body.data.file.language).toBe('typescript');
      expect(fileRes.body.data.file.size).toBeGreaterThan(0);
    });

    it('should reject creating duplicate file with the same path', async () => {
      await request(app)
        .post(`/api/v1/projects/${projectId}/files`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'config.json',
          type: 'file',
        });

      const duplicateRes = await request(app)
        .post(`/api/v1/projects/${projectId}/files`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'config.json',
          type: 'file',
        });

      expect(duplicateRes.status).toBe(409);
      expect(duplicateRes.body.error.code).toBe('NODE_EXISTS');
    });

    it('should update file content and recalculate size', async () => {
      const fileRes = await request(app)
        .post(`/api/v1/projects/${projectId}/files`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'data.txt',
          type: 'file',
          content: 'Initial text',
        });
      const fileId = fileRes.body.data.file.id;

      const updateRes = await request(app)
        .put(`/api/v1/files/${fileId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          content: 'Updated content for CodeSync AI realtime sync.',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.file.content).toBe('Updated content for CodeSync AI realtime sync.');
      expect(updateRes.body.data.file.size).toBe(Buffer.byteLength('Updated content for CodeSync AI realtime sync.'));
    });

    it('should rename a folder and update paths of all child files', async () => {
      // Create folder /components
      const folderRes = await request(app)
        .post(`/api/v1/projects/${projectId}/files`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'components', type: 'folder' });
      const folderId = folderRes.body.data.file.id;

      // Create /components/Button.tsx
      const fileRes = await request(app)
        .post(`/api/v1/projects/${projectId}/files`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Button.tsx',
          type: 'file',
          parentId: folderId,
          content: 'export const Button = () => <button>Click</button>;',
        });
      const fileId = fileRes.body.data.file.id;

      // Rename folder 'components' -> 'widgets'
      const renameRes = await request(app)
        .put(`/api/v1/files/${folderId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'widgets' });

      expect(renameRes.status).toBe(200);
      expect(renameRes.body.data.file.path).toBe('/widgets');

      // Verify child file path was updated to /widgets/Button.tsx
      const childCheck = await request(app)
        .get(`/api/v1/files/${fileId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(childCheck.status).toBe(200);
      expect(childCheck.body.data.file.path).toBe('/widgets/Button.tsx');
    });

    it('should delete a directory and cascade delete all nested children', async () => {
      const folderRes = await request(app)
        .post(`/api/v1/projects/${projectId}/files`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'temp', type: 'folder' });
      const folderId = folderRes.body.data.file.id;

      const fileRes = await request(app)
        .post(`/api/v1/projects/${projectId}/files`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'test.log', type: 'file', parentId: folderId });
      const fileId = fileRes.body.data.file.id;

      // Delete directory 'temp'
      const delRes = await request(app)
        .delete(`/api/v1/files/${folderId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(delRes.status).toBe(200);

      // Verify child file was also deleted
      const childCheck = await request(app)
        .get(`/api/v1/files/${fileId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(childCheck.status).toBe(404);
    });

    it('should forbid viewer from creating or modifying files', async () => {
      // Invite Charlie as viewer
      await request(app)
        .post(`/api/v1/projects/${projectId}/members`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ emailOrUsername: 'charlie_viewer', role: 'viewer' });

      const failCreate = await request(app)
        .post(`/api/v1/projects/${projectId}/files`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ name: 'unauthorized.js', type: 'file' });

      expect(failCreate.status).toBe(403);
      expect(failCreate.body.error.code).toBe('FORBIDDEN');
    });
  });
});
