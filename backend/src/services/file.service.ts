import { FileNode, detectLanguage } from '../models/FileNode';
import { Project } from '../models/Project';
import { AppError } from '../middleware/errorHandler';
import { CreateFileNodeInput, RenameNodeInput } from '../validations/file.validation';
import mongoose from 'mongoose';
import { YjsDocManager } from '../sockets/yjsManager';
import { SocketManager } from '../sockets';

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export interface FileTreeNode {
  id: string;
  projectId: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  parentId: string | null;
  language: string;
  size: number;
  isLocked: boolean;
  children?: FileTreeNode[];
  updatedAt: string;
  createdAt: string;
}

export class FileService {
  /**
   * Retrieve nested recursive file tree for a project
   */
  static async getProjectFileTree(projectId: string): Promise<FileTreeNode[]> {
    const projectObjectId = new mongoose.Types.ObjectId(projectId);
    const nodes = await FileNode.find({ projectId: projectObjectId }).sort({
      type: -1, // Folders first
      name: 1,  // Alphabetical
    });

    const nodeMap = new Map<string, FileTreeNode>();
    const rootNodes: FileTreeNode[] = [];

    // First pass: convert to tree node structures
    for (const node of nodes) {
      const json: any = node.toJSON();
      const treeNode: FileTreeNode = {
        id: json.id,
        projectId: json.projectId,
        name: json.name,
        path: json.path,
        type: json.type,
        parentId: json.parentId,
        language: json.language,
        size: json.size,
        isLocked: json.isLocked,
        children: json.type === 'folder' ? [] : undefined,
        updatedAt: json.updatedAt,
        createdAt: json.createdAt,
      };
      nodeMap.set(json.id, treeNode);
    }

    // Second pass: attach children to parents
    for (const node of nodes) {
      const json: any = node.toJSON();
      const treeNode = nodeMap.get(json.id)!;

      if (json.parentId && nodeMap.has(json.parentId)) {
        const parent = nodeMap.get(json.parentId)!;
        if (parent.children) {
          parent.children.push(treeNode);
        }
      } else {
        rootNodes.push(treeNode);
      }
    }

    return rootNodes;
  }

  /**
   * Get flat list of all nodes for a project
   */
  static async getProjectFilesFlat(projectId: string): Promise<any[]> {
    const projectObjectId = new mongoose.Types.ObjectId(projectId);
    const nodes = await FileNode.find({ projectId: projectObjectId }).sort({
      path: 1,
    });
    return nodes.map((n) => n.toJSON());
  }

  /**
   * Get single file by ID (including content)
   */
  static async getFileById(fileId: string): Promise<any> {
    const file = await FileNode.findById(fileId);
    if (!file) {
      throw new AppError('File not found', 404, 'FILE_NOT_FOUND');
    }
    return file.toJSON();
  }

  /**
   * Create a new file or directory node
   */
  static async createNode(
    projectId: string,
    userId: string,
    input: CreateFileNodeInput
  ): Promise<any> {
    const projectObjectId = new mongoose.Types.ObjectId(projectId);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    let parentPath = '';
    let parentObjectId: mongoose.Types.ObjectId | null = null;

    if (input.parentId) {
      const parent = await FileNode.findOne({
        _id: input.parentId,
        projectId: projectObjectId,
      });

      if (!parent) {
        throw new AppError('Parent directory not found', 404, 'PARENT_NOT_FOUND');
      }

      if (parent.type !== 'folder') {
        throw new AppError('Cannot create items inside a file node', 400, 'INVALID_PARENT');
      }

      parentPath = parent.path;
      parentObjectId = parent._id as mongoose.Types.ObjectId;
    }

    const calculatedPath = `${parentPath}/${input.name}`.replace(/\/+/g, '/');

    // Check path uniqueness
    const existing = await FileNode.findOne({
      projectId: projectObjectId,
      path: calculatedPath,
    });

    if (existing) {
      throw new AppError(
        `An item named "${input.name}" already exists at this location.`,
        409,
        'NODE_EXISTS'
      );
    }

    const content = input.type === 'file' ? input.content || '' : '';
    const language = input.type === 'file' ? input.language || detectLanguage(input.name) : 'plaintext';
    const size = Buffer.byteLength(content, 'utf8');

    const node = await FileNode.create({
      projectId: projectObjectId,
      name: input.name,
      path: calculatedPath,
      type: input.type,
      parentId: parentObjectId,
      content,
      language,
      size,
      lastModifiedBy: userObjectId,
    });

    // Update project stats
    if (input.type === 'file') {
      await Project.findByIdAndUpdate(projectObjectId, {
        $inc: { fileCount: 1 },
        lastActivityAt: new Date(),
      });
    }

    SocketManager.notifyFilesChanged(projectId);
    return node.toJSON();
  }

  /**
   * Update file content
   */
  static async updateFileContent(
    fileId: string,
    userId: string,
    content: string
  ): Promise<any> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const file = await FileNode.findById(fileId);

    if (!file) {
      throw new AppError('File not found', 404, 'FILE_NOT_FOUND');
    }

    if (file.type === 'folder') {
      throw new AppError('Cannot write content directly to a directory node', 400, 'CANNOT_WRITE_FOLDER');
    }

    const documents = YjsDocManager.getInstance();
    if (documents.hasDoc(fileId) && documents.getTextContent(fileId) !== content) {
      throw new AppError('This file has newer collaborative edits. Synchronize it before saving.', 409, 'EDIT_CONFLICT');
    }

    file.content = content;
    file.size = Buffer.byteLength(content, 'utf8');
    file.lastModifiedBy = userObjectId;
    await file.save();

    await Project.findByIdAndUpdate(file.projectId, {
      lastActivityAt: new Date(),
    });

    return file.toJSON();
  }

  /**
   * Rename or move a node
   */
  static async renameOrMoveNode(
    fileId: string,
    userId: string,
    input: RenameNodeInput
  ): Promise<any> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const node = await FileNode.findById(fileId);

    if (!node) {
      throw new AppError('Item not found', 404, 'NODE_NOT_FOUND');
    }

    const oldPath = node.path;
    let newParentPath = '';
    let newParentId: mongoose.Types.ObjectId | null = node.parentId;

    if (input.parentId !== undefined) {
      if (input.parentId === null) {
        newParentId = null;
        newParentPath = '';
      } else {
        const parent = await FileNode.findOne({
          _id: input.parentId,
          projectId: node.projectId,
        });

        if (!parent || parent.type !== 'folder') {
          throw new AppError('Target parent directory is invalid', 400, 'INVALID_PARENT');
        }

        // Prevent moving a folder inside itself
        if (node.type === 'folder' && (parent.path === oldPath || parent.path.startsWith(oldPath + '/'))) {
          throw new AppError('Cannot move a directory into itself or a subfolder', 400, 'CIRCULAR_MOVE');
        }

        newParentId = parent._id as mongoose.Types.ObjectId;
        newParentPath = parent.path;
      }
    } else if (node.parentId) {
      const currentParent = await FileNode.findById(node.parentId);
      if (currentParent) {
        newParentPath = currentParent.path;
      }
    }

    const newName = input.name ? input.name.trim() : node.name;
    const newPath = `${newParentPath}/${newName}`.replace(/\/+/g, '/');

    // Check collision if path changed
    if (newPath !== oldPath) {
      const collision = await FileNode.findOne({
        projectId: node.projectId,
        path: newPath,
        _id: { $ne: node._id },
      });

      if (collision) {
        throw new AppError(`An item named "${newName}" already exists in the destination.`, 409, 'NODE_EXISTS');
      }
    }

    node.name = newName;
    node.path = newPath;
    node.parentId = newParentId;
    node.lastModifiedBy = userObjectId;
    if (node.type === 'file' && input.name) {
      node.language = detectLanguage(newName);
    }
    await node.save();

    // If folder renamed/moved, recursively update paths of all descendant children
    if (node.type === 'folder' && newPath !== oldPath) {
      const descendants = await FileNode.find({
        projectId: node.projectId,
        path: new RegExp(`^${escapeRegExp(oldPath)}/`),
      });

      for (const desc of descendants) {
        desc.path = newPath + desc.path.slice(oldPath.length);
        await desc.save();
      }
    }

    await Project.findByIdAndUpdate(node.projectId, {
      lastActivityAt: new Date(),
    });

    SocketManager.notifyFilesChanged(node.projectId.toString());
    return node.toJSON();
  }

  /**
   * Delete node and all descendant children recursively
   */
  static async deleteNode(fileId: string, _userId?: string): Promise<{ deletedCount: number }> {
    const node = await FileNode.findById(fileId);
    if (!node) {
      throw new AppError('Item not found', 404, 'NODE_NOT_FOUND');
    }

    let deletedFiles = 0;

    if (node.type === 'folder') {
      // Find all descendant children
      const descendants = await FileNode.find({
        projectId: node.projectId,
        path: new RegExp(`^${escapeRegExp(node.path)}/`),
      });

      deletedFiles = descendants.filter((d) => d.type === 'file').length;
      await Promise.all(descendants.map(desc => YjsDocManager.getInstance().removeDoc(desc.id)));
      await FileNode.deleteMany({
        projectId: node.projectId,
        path: new RegExp(`^${escapeRegExp(node.path)}/`),
      });
      await FileNode.findByIdAndDelete(node._id);
    } else {
      deletedFiles = 1;
      await YjsDocManager.getInstance().removeDoc(fileId);
      await FileNode.findByIdAndDelete(node._id);
    }

    // Decrement project fileCount
    if (deletedFiles > 0) {
      await Project.findByIdAndUpdate(node.projectId, {
        $inc: { fileCount: -deletedFiles },
        lastActivityAt: new Date(),
      });
    }

    SocketManager.notifyFilesChanged(node.projectId.toString());
    return { deletedCount: deletedFiles };
  }
}
