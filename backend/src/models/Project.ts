import { Schema, model, Document, Types } from 'mongoose';

export type ProjectRole = 'owner' | 'editor' | 'viewer';
export type ProjectVisibility = 'public' | 'private';
export type ProjectTemplate = 'c' | 'cpp' | 'blank' | 'react' | 'nodejs' | 'python' | 'go';

export interface IProjectMember {
  user: Types.ObjectId;
  role: ProjectRole;
  joinedAt: Date;
}

export interface IProject {
  name: string;
  description?: string;
  owner: Types.ObjectId;
  visibility: ProjectVisibility;
  template: ProjectTemplate;
  tags: string[];
  members: IProjectMember[];
  isArchived: boolean;
  fileCount: number;
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProjectDocument extends IProject, Document {
  isOwner(userId: string | Types.ObjectId): boolean;
  getMemberRole(userId: string | Types.ObjectId): ProjectRole | null;
  hasAccess(userId: string | Types.ObjectId, minRole?: ProjectRole): boolean;
}

const projectMemberSchema = new Schema<IProjectMember>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['owner', 'editor', 'viewer'],
      default: 'viewer',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const projectSchema = new Schema<IProjectDocument>(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      minlength: [2, 'Project name must be at least 2 characters long'],
      maxlength: [60, 'Project name cannot exceed 60 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, 'Description cannot exceed 300 characters'],
      default: '',
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'private',
      index: true,
    },
    template: {
      type: String,
      enum: ['c', 'cpp', 'blank', 'react', 'nodejs', 'python', 'go'],
      default: 'c',
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    members: {
      type: [projectMemberSchema],
      default: [],
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    fileCount: {
      type: Number,
      default: 0,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : undefined;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Search indexes for rapid query performance
projectSchema.index({ name: 'text', description: 'text', tags: 'text' });
projectSchema.index({ 'members.user': 1 });
projectSchema.index({ owner: 1, updatedAt: -1 });

// Helper methods
const referenceId = (value: any): string => String(value?._id || value);
projectSchema.methods.isOwner = function (userId: string | Types.ObjectId): boolean {
  return referenceId(this.owner) === userId.toString();
};

projectSchema.methods.getMemberRole = function (userId: string | Types.ObjectId): ProjectRole | null {
  if (this.isOwner(userId)) return 'owner';
  const member = this.members.find(
    (m: IProjectMember) => referenceId(m.user) === userId.toString()
  );
  return member ? member.role : null;
};

projectSchema.methods.hasAccess = function (
  userId: string | Types.ObjectId,
  minRole: ProjectRole = 'viewer'
): boolean {
  if (this.isOwner(userId)) return true;
  
  const role = this.getMemberRole(userId);
  if (!role) {
    return this.visibility === 'public' && minRole === 'viewer';
  }

  const roleHierarchy: Record<ProjectRole, number> = {
    viewer: 1,
    editor: 2,
    owner: 3,
  };

  return roleHierarchy[role as ProjectRole] >= roleHierarchy[minRole];
};

export const Project = model<IProjectDocument>('Project', projectSchema);
