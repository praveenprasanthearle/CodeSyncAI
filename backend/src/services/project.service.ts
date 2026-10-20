import { Project, IProjectDocument, ProjectRole } from '../models/Project';
import { User } from '../models/User';
import { AppError } from '../middleware/errorHandler';
import { CreateProjectInput, UpdateProjectInput } from '../validations/project.validation';
import { TemplateSeeder } from './templateSeeder';
import mongoose from 'mongoose';
import { SocketManager } from '../sockets';
import { FileNode } from '../models/FileNode';
import { YjsDocManager } from '../sockets/yjsManager';

export interface ProjectListQuery {
  search?: string;
  filter?: 'all' | 'owned' | 'shared';
  sort?: 'updatedAt' | 'createdAt' | 'name';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export class ProjectService {
  /**
   * Create a new project workspace
   */
  static async createProject(userId: string, input: CreateProjectInput): Promise<any> {
    const ownerObjectId = new mongoose.Types.ObjectId(userId);

    const project = await Project.create({
      name: input.name,
      description: input.description || '',
      owner: ownerObjectId,
      visibility: input.visibility || 'private',
      template: input.template || 'blank',
      tags: input.tags || [],
      members: [
        {
          user: ownerObjectId,
          role: 'owner',
          joinedAt: new Date(),
        },
      ],
      lastActivityAt: new Date(),
    });

    // Automatically seed starter template files
    const fileCount = await TemplateSeeder.seedStarterFiles(
      project._id as mongoose.Types.ObjectId,
      project.template,
      userId
    );
    project.fileCount = fileCount;
    await project.save();

    const populated = await Project.findById(project._id)
      .populate('owner', 'name username email avatarUrl')
      .populate('members.user', 'name username email avatarUrl');

    return populated?.toJSON();
  }

  /**
   * Get user projects with search, filter, and pagination
   */
  static async getUserProjects(userId: string, query: ProjectListQuery): Promise<{ projects: any[]; total: number; page: number; limit: number }> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const filter = query.filter || 'all';
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 12));
    const skip = (page - 1) * limit;

    const mongoFilter: any = { isArchived: false };

    if (filter === 'owned') {
      mongoFilter.owner = userObjectId;
    } else if (filter === 'shared') {
      mongoFilter['members.user'] = userObjectId;
      mongoFilter.owner = { $ne: userObjectId };
    } else {
      // 'all' includes owned, shared, or public projects
      mongoFilter.$or = [
        { owner: userObjectId },
        { 'members.user': userObjectId },
        { visibility: 'public' },
      ];
    }

    // Apply search filter if present
    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      const searchCondition = {
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { tags: searchRegex },
        ],
      };

      if (mongoFilter.$or) {
        mongoFilter.$and = [{ $or: mongoFilter.$or }, searchCondition];
        delete mongoFilter.$or;
      } else {
        Object.assign(mongoFilter, searchCondition);
      }
    }

    // Sort setup
    const sortField = query.sort || 'updatedAt';
    const sortOrder = query.order === 'asc' ? 1 : -1;
    const sortObj: any = { [sortField]: sortOrder };

    const [projects, total] = await Promise.all([
      Project.find(mongoFilter)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .populate('owner', 'name username email avatarUrl')
        .populate('members.user', 'name username email avatarUrl'),
      Project.countDocuments(mongoFilter),
    ]);

    return {
      projects: projects.map((p) => {
        const json: any = p.toJSON();
        json.memberCount = (p.members || []).length;
        json.userRole = p.getMemberRole(userId) || (p.visibility === 'public' ? 'viewer' : undefined);
        return json;
      }),
      total,
      page,
      limit,
    };
  }

  /**
   * Get single project by ID with populated members
   */
  static async getProjectById(projectId: string, userId?: string): Promise<any> {
    const project = await Project.findById(projectId)
      .populate('owner', 'name username email avatarUrl')
      .populate('members.user', 'name username email avatarUrl');

    if (!project) {
      throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
    }

    const json: any = project.toJSON();
    json.memberCount = (project.members || []).length;
    if (userId) {
      json.userRole = project.getMemberRole(userId) || (project.visibility === 'public' ? 'viewer' : undefined);
    }
    return json;
  }

  /**
   * Update project metadata
   */
  static async updateProject(project: IProjectDocument, input: UpdateProjectInput): Promise<any> {
    if (input.name !== undefined) project.name = input.name;
    if (input.description !== undefined) project.description = input.description;
    if (input.visibility !== undefined) project.visibility = input.visibility;
    if (input.tags !== undefined) project.tags = input.tags;
    if (input.isArchived !== undefined) project.isArchived = input.isArchived;

    project.lastActivityAt = new Date();
    await project.save();
    await SocketManager.refreshProjectAccess(project.id);

    const populated = await Project.findById(project._id)
      .populate('owner', 'name username email avatarUrl')
      .populate('members.user', 'name username email avatarUrl');

    return populated?.toJSON();
  }

  /**
   * Delete project permanently
   */
  static async deleteProject(project: IProjectDocument): Promise<void> {
    await Project.findByIdAndDelete(project._id);
    await SocketManager.refreshProjectAccess(project.id);
  }

  /**
   * Add a collaborator to a project
   */
  static async addMember(
    project: IProjectDocument,
    emailOrUsername: string,
    role: 'editor' | 'viewer'
  ): Promise<any> {
    const rawIdentifier = emailOrUsername.trim().toLowerCase();
    const cleanIdentifier = rawIdentifier.replace(/^@+/, '');

    const userToInvite = await User.findOne({
      $or: [
        { email: rawIdentifier },
        { email: cleanIdentifier },
        { username: rawIdentifier },
        { username: cleanIdentifier },
      ],
    });

    if (!userToInvite) {
      throw new AppError('No user found with the provided email or username.', 404, 'USER_NOT_FOUND');
    }

    const targetUserId = userToInvite._id.toString();

    // Check if user is already owner
    if (project.isOwner(targetUserId)) {
      throw new AppError('This user is already the owner of this project.', 400, 'ALREADY_OWNER');
    }

    // Check if user is already in members
    const existingMember = project.members.find(
      (m) => m.user.toString() === targetUserId
    );

    if (existingMember) {
      throw new AppError('This user is already a collaborator on this project.', 409, 'MEMBER_EXISTS');
    }

    project.members.push({
      user: userToInvite._id as any,
      role: role || 'editor',
      joinedAt: new Date(),
    });

    project.lastActivityAt = new Date();
    await project.save();

    const populated = await Project.findById(project._id)
      .populate('owner', 'name username email avatarUrl')
      .populate('members.user', 'name username email avatarUrl');

    return populated?.toJSON();
  }

  /**
   * Remove a collaborator from a project
   */
  static async removeMember(
    project: IProjectDocument,
    targetUserId: string
  ): Promise<any> {
    if (project.isOwner(targetUserId)) {
      throw new AppError('The project owner cannot be removed.', 400, 'CANNOT_REMOVE_OWNER');
    }

    const initialLength = project.members.length;
    project.members = project.members.filter(
      (m) => m.user.toString() !== targetUserId.toString()
    );

    if (project.members.length === initialLength) {
      throw new AppError('Member not found in this project.', 404, 'MEMBER_NOT_FOUND');
    }

    project.lastActivityAt = new Date();
    await project.save();
    await SocketManager.refreshProjectAccess(project.id);

    const populated = await Project.findById(project._id)
      .populate('owner', 'name username email avatarUrl')
      .populate('members.user', 'name username email avatarUrl');

    return populated?.toJSON();
  }

  /**
   * Update collaborator role (editor <-> viewer)
   */
  static async updateMemberRole(
    project: IProjectDocument,
    targetUserId: string,
    newRole: ProjectRole
  ): Promise<any> {
    if (project.isOwner(targetUserId)) {
      throw new AppError('Cannot modify the role of the project owner.', 400, 'CANNOT_MODIFY_OWNER_ROLE');
    }

    const member = project.members.find(
      (m) => m.user.toString() === targetUserId.toString()
    );

    if (!member) {
      throw new AppError('Collaborator not found in this project.', 404, 'MEMBER_NOT_FOUND');
    }

    member.role = newRole;
    project.lastActivityAt = new Date();
    await project.save();
    await SocketManager.refreshProjectAccess(project.id);

    const populated = await Project.findById(project._id)
      .populate('owner', 'name username email avatarUrl')
      .populate('members.user', 'name username email avatarUrl');

    return populated?.toJSON();
  }

  /**
   * Clone/Duplicate an existing project
   */
  static async cloneProject(originalProject: IProjectDocument, userId: string): Promise<any> {
    const ownerObjectId = new mongoose.Types.ObjectId(userId);

    const cloned = await Project.create({
      name: `${originalProject.name} (Copy)`,
      description: originalProject.description || '',
      owner: ownerObjectId,
      visibility: 'private',
      template: originalProject.template,
      tags: [...originalProject.tags],
      members: [
        {
          user: ownerObjectId,
          role: 'owner',
          joinedAt: new Date(),
        },
      ],
      lastActivityAt: new Date(),
    });

    await YjsDocManager.getInstance().flushAll();
    const sourceFiles = await FileNode.find({ projectId: originalProject._id });
    const ids = new Map(sourceFiles.map(file => [file.id, new mongoose.Types.ObjectId()]));
    if (sourceFiles.length) await FileNode.insertMany(sourceFiles.map(file => ({
      _id: ids.get(file.id), projectId: cloned._id, name: file.name, path: file.path,
      type: file.type, parentId: file.parentId ? ids.get(file.parentId.toString()) || null : null,
      content: file.content, language: file.language, size: file.size, lastModifiedBy: ownerObjectId,
    })));
    cloned.fileCount = sourceFiles.filter(file => file.type === 'file').length;
    await cloned.save();

    const populated = await Project.findById(cloned._id)
      .populate('owner', 'name username email avatarUrl')
      .populate('members.user', 'name username email avatarUrl');

    return populated?.toJSON();
  }
}
