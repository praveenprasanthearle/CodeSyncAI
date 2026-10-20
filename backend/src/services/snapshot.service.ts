import { Types } from 'mongoose';
import { Snapshot, ISnapshot } from '../models/Snapshot';
import { FileNode } from '../models/FileNode';
import { Project } from '../models/Project';
import { AppError } from '../middleware/errorHandler';
import { YjsDocManager } from '../sockets/yjsManager';
import { SocketManager } from '../sockets';

export class SnapshotService {
  /**
   * Create a point-in-time snapshot of all files in a project
   */
  static async createSnapshot(
    projectId: string,
    userId: string,
    name: string,
    description = ''
  ): Promise<ISnapshot> {
    const project = await Project.findById(projectId);
    if (!project) throw new AppError('Project not found', 404);

    await YjsDocManager.getInstance().flushAll();

    // Fetch all files in the project
    const fileNodes = await FileNode.find({ projectId, type: 'file' });

    let totalSizeBytes = 0;
    const files = fileNodes.map((fn) => {
      const content = fn.content || '';
      const size = Buffer.byteLength(content, 'utf8');
      totalSizeBytes += size;
      return {
        path: fn.path,
        name: fn.name,
        content,
        language: fn.language || 'plaintext',
      };
    });

    const snapshot = await Snapshot.create({
      projectId: new Types.ObjectId(projectId),
      name,
      description,
      createdBy: new Types.ObjectId(userId),
      files,
      fileCount: files.length,
      totalSizeBytes,
    });

    return snapshot.populate('createdBy', 'name username avatarUrl');
  }

  /**
   * List all snapshots for a project
   */
  static async listSnapshots(projectId: string): Promise<ISnapshot[]> {
    return Snapshot.find({ projectId })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name username avatarUrl');
  }

  /**
   * Get single snapshot details by ID
   */
  static async getSnapshotById(snapshotId: string, userId: string): Promise<ISnapshot> {
    const snapshot = await Snapshot.findById(snapshotId).populate(
      'createdBy',
      'name username avatarUrl'
    );
    if (!snapshot) throw new AppError('Snapshot not found', 404);
    const project = await Project.findById(snapshot.projectId);
    if (!project?.hasAccess(userId, 'viewer')) throw new AppError('You cannot access this snapshot.', 403, 'FORBIDDEN');
    return snapshot;
  }

  /**
   * Restore project files to a historical snapshot state
   */
  static async restoreSnapshot(snapshotId: string, userId: string): Promise<{ restoredCount: number }> {
    const snapshot = await Snapshot.findById(snapshotId);
    if (!snapshot) throw new AppError('Snapshot not found', 404);
    const project = await Project.findById(snapshot.projectId);
    if (!project?.hasAccess(userId, 'editor')) throw new AppError('Only project editors can restore snapshots.', 403, 'FORBIDDEN');

    const projectId = snapshot.projectId.toString();

    await YjsDocManager.getInstance().flushAll();
    // Preserve IDs at matching paths so connected editors can receive the restore.
    const expected = new Map<string, 'file' | 'folder'>();
    for (const file of snapshot.files) {
      expected.set(file.path, 'file');
      const parts = file.path.split('/').filter(Boolean);
      for (let index = 1; index < parts.length; index++) expected.set('/' + parts.slice(0, index).join('/'), 'folder');
    }
    const current = await FileNode.find({ projectId });
    const removed = current.filter(node => expected.get(node.path) !== node.type);
    await Promise.all(removed.map(node => YjsDocManager.getInstance().removeDoc(node.id)));
    if (removed.length) await FileNode.deleteMany({ _id: { $in: removed.map(node => node._id) } });

    // 2. Re-create all snapshot files and necessary parent folders
    let restoredCount = 0;
    for (const snapFile of snapshot.files) {
      const parts = snapFile.path.split('/').filter(Boolean);
      let currentParentId: Types.ObjectId | null = null;
      let currentPath = '';

      // Ensure directory hierarchy exists
      for (let i = 0; i < parts.length - 1; i++) {
        const folderName = parts[i];
        currentPath = `${currentPath}/${folderName}`;

        let folder = await FileNode.findOne({
          projectId,
          path: currentPath,
          type: 'folder',
        });

        if (!folder) {
          folder = await FileNode.create({
            projectId: new Types.ObjectId(projectId),
            name: folderName,
            type: 'folder',
            path: currentPath,
            parentId: currentParentId,
          });
        }
        currentParentId = folder._id as Types.ObjectId;
      }

      // Create file node
      const createdFile = await FileNode.findOneAndUpdate(
        { projectId, path: snapFile.path, type: 'file' },
        { $set: { name: snapFile.name, parentId: currentParentId, content: snapFile.content, language: snapFile.language, size: Buffer.byteLength(snapFile.content, 'utf8'), lastModifiedBy: new Types.ObjectId(userId) } },
        { upsert: true, new: true, runValidators: true }
      );

      // Synchronize in-memory Yjs doc if active
      YjsDocManager.getInstance().setDocContent(createdFile.id, snapFile.content);
      restoredCount++;
    }

    await Project.findByIdAndUpdate(projectId, { fileCount: restoredCount, lastActivityAt: new Date() });
    SocketManager.notifyFilesChanged(projectId);
    return { restoredCount };
  }

  /**
   * Delete snapshot
   */
  static async deleteSnapshot(snapshotId: string, userId: string): Promise<void> {
    const snapshot = await Snapshot.findById(snapshotId);
    if (!snapshot) throw new AppError('Snapshot not found', 404);

    const project = await Project.findById(snapshot.projectId);
    const isOwner = project?.owner.toString() === userId;
    const isCreator = snapshot.createdBy.toString() === userId;

    if (!project?.hasAccess(userId, 'editor') || (!isOwner && !isCreator)) {
      throw new AppError('You do not have permission to delete this snapshot', 403);
    }

    await Snapshot.findByIdAndDelete(snapshotId);
  }
}
