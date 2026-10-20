import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import * as Y from 'yjs';
import { createTestDatabase } from './database';
import { User } from '../models/User';
import { Project, IProjectDocument } from '../models/Project';
import { FileNode } from '../models/FileNode';
import { YjsDocManager } from '../sockets/yjsManager';
import { SnapshotService } from '../services/snapshot.service';
import { FileService } from '../services/file.service';
import { ProjectService } from '../services/project.service';

describe('Document persistence, snapshots and cloning', () => {
  let database: MongoMemoryServer, userId: string, project: IProjectDocument, fileId: string;
  const documents = YjsDocManager.getInstance();
  beforeAll(async () => {
    database = await createTestDatabase(); await mongoose.connect(database.getUri());
    const user = await User.create({ name: 'Document Tester', username: 'document_tester', email: 'documents@example.test', password: 'Password123!' }); userId = user.id;
  });
  beforeEach(async () => {
    project = await Project.create({ name: 'Document reliability', owner: userId, members: [{ user: userId, role: 'owner' }] });
    const file = await FileService.createNode(project.id, userId, { name: 'main.js', type: 'file', content: 'original', parentId: null }); fileId = file.id;
  });
  afterEach(async () => { await documents.dispose(); });
  afterAll(async () => { await mongoose.disconnect(); await database.stop(); });

  it('shares one server document across simultaneous first joins', async () => {
    const [first, second] = await Promise.all([documents.getOrCreateDoc(fileId), documents.getOrCreateDoc(fileId)]);
    expect(first).toBe(second); expect(first.getText('monaco').toString()).toBe('original');
  });
  it('merges concurrent updates and persists the converged state', async () => {
    const state = await documents.encodeFullState(fileId);
    const alice = new Y.Doc(), bob = new Y.Doc(); Y.applyUpdate(alice, state); Y.applyUpdate(bob, state);
    const vector = Y.encodeStateVector(alice);
    alice.getText('monaco').insert(0, 'Alice '); bob.getText('monaco').insert(0, 'Bob ');
    await documents.applyUpdate(fileId, Y.encodeStateAsUpdate(bob, vector));
    await documents.applyUpdate(fileId, Y.encodeStateAsUpdate(alice, vector));
    await documents.flushAll();
    const content = (await FileNode.findById(fileId))!.content;
    expect(content).toContain('Alice'); expect(content).toContain('Bob'); expect(content).toContain('original');
    alice.destroy(); bob.destroy();
  });
  it('captures pending edits in a snapshot before the debounce timer runs', async () => {
    (await documents.getOrCreateDoc(fileId)).getText('monaco').insert(8, ' latest');
    const snapshot = await SnapshotService.createSnapshot(project.id, userId, 'Immediate capture');
    expect(snapshot.files.find(file => file.path === '/main.js')?.content).toBe('original latest');
  });
  it('preserves file identity and updates existing CRDT peers on restore', async () => {
    const doc = await documents.getOrCreateDoc(fileId);
    const peer = new Y.Doc(); Y.applyUpdate(peer, Y.encodeStateAsUpdate(doc));
    const snapshot = await SnapshotService.createSnapshot(project.id, userId, 'Before change');
    doc.getText('monaco').insert(8, ' changed');
    await SnapshotService.restoreSnapshot(snapshot.id, userId);
    const restored = await FileNode.findOne({ projectId: project.id, path: '/main.js' });
    expect(restored!.id).toBe(fileId); expect(restored!.content).toBe('original');
    Y.applyUpdate(peer, await documents.encodeFullState(fileId));
    expect(peer.getText('monaco').toString()).toBe('original'); peer.destroy();
  });
  it('removes files absent from a snapshot and repairs file counts', async () => {
    const snapshot = await SnapshotService.createSnapshot(project.id, userId, 'One file');
    await FileService.createNode(project.id, userId, { name: 'extra.js', type: 'file', content: 'extra', parentId: null });
    await SnapshotService.restoreSnapshot(snapshot.id, userId);
    expect(await FileNode.countDocuments({ projectId: project.id, type: 'file' })).toBe(1);
    expect((await Project.findById(project.id))!.fileCount).toBe(1);
  });
  it('rejects stale whole-file saves while a newer collaborative document is active', async () => {
    (await documents.getOrCreateDoc(fileId)).getText('monaco').insert(8, ' newer');
    await expect(FileService.updateFileContent(fileId, userId, 'stale')).rejects.toMatchObject({ code: 'EDIT_CONFLICT' });
    await documents.flushAll(); expect((await FileNode.findById(fileId))!.content).toBe('original newer');
  });
  it('treats dots in folder paths literally during deletion', async () => {
    const first = await FileService.createNode(project.id, userId, { name: 'a.b', type: 'folder', parentId: null });
    const other = await FileService.createNode(project.id, userId, { name: 'aXb', type: 'folder', parentId: null });
    await FileService.createNode(project.id, userId, { name: 'first.js', type: 'file', parentId: first.id, content: 'first' });
    const survivor = await FileService.createNode(project.id, userId, { name: 'other.js', type: 'file', parentId: other.id, content: 'keep' });
    await FileService.deleteNode(first.id, userId);
    expect((await FileNode.findById(survivor.id))?.content).toBe('keep');
  });
  it('clones actual files, directory relationships and pending edits', async () => {
    const folder = await FileService.createNode(project.id, userId, { name: 'src', type: 'folder', parentId: null });
    await FileService.createNode(project.id, userId, { name: 'nested.js', type: 'file', parentId: folder.id, content: 'nested' });
    (await documents.getOrCreateDoc(fileId)).getText('monaco').insert(8, ' latest');
    const clone = await ProjectService.cloneProject(project, userId);
    const copied = await FileNode.find({ projectId: clone.id });
    expect(copied).toHaveLength(3);
    expect(copied.find(file => file.path === '/main.js')?.content).toBe('original latest');
    expect(copied.find(file => file.path === '/src/nested.js')?.parentId?.toString()).toBe(copied.find(file => file.path === '/src')?.id);
    expect(clone.fileCount).toBe(2);
  });
});
