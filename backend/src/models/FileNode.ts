import { Schema, model, Document, Types } from 'mongoose';

export type FileNodeType = 'file' | 'folder';

export interface IFileNode {
  projectId: Types.ObjectId;
  name: string;
  path: string;
  type: FileNodeType;
  parentId: Types.ObjectId | null;
  content: string;
  language: string;
  size: number;
  isLocked: boolean;
  lastModifiedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFileNodeDocument extends IFileNode, Document {}

export const detectLanguage = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'js':
    case 'jsx':
    case 'mjs':
    case 'cjs':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'py':
    case 'pyw':
      return 'python';
    case 'cpp':
    case 'cxx':
    case 'cc':
    case 'hpp':
    case 'h':
      return 'cpp';
    case 'c':
      return 'c';
    case 'go':
      return 'go';
    case 'html':
    case 'htm':
      return 'html';
    case 'css':
    case 'scss':
    case 'sass':
    case 'less':
      return 'css';
    case 'json':
      return 'json';
    case 'md':
    case 'markdown':
      return 'markdown';
    case 'sql':
      return 'sql';
    case 'sh':
    case 'bash':
    case 'zsh':
      return 'shell';
    case 'yml':
    case 'yaml':
      return 'yaml';
    case 'xml':
    case 'svg':
      return 'xml';
    case 'rs':
      return 'rust';
    case 'java':
      return 'java';
    default:
      return 'plaintext';
  }
};

const fileNodeSchema = new Schema<IFileNodeDocument>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Node name is required'],
      trim: true,
      minlength: [1, 'Name cannot be empty'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    path: {
      type: String,
      required: [true, 'Path is required'],
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['file', 'folder'],
      required: [true, 'Node type is required'],
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'FileNode',
      default: null,
      index: true,
    },
    content: {
      type: String,
      default: '',
    },
    language: {
      type: String,
      default: 'plaintext',
    },
    size: {
      type: Number,
      default: 0,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    lastModifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : undefined;
        ret.projectId = ret.projectId ? ret.projectId.toString() : undefined;
        ret.parentId = ret.parentId ? ret.parentId.toString() : null;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Unique path per project constraint
fileNodeSchema.index({ projectId: 1, path: 1 }, { unique: true });
fileNodeSchema.index({ projectId: 1, parentId: 1 });

export const FileNode = model<IFileNodeDocument>('FileNode', fileNodeSchema);
