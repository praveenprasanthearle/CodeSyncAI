import { Schema, model, Document, Types } from 'mongoose';

export interface ISnapshotFile {
  path: string;
  name: string;
  content: string;
  language: string;
}

export interface ISnapshot extends Document {
  projectId: Types.ObjectId;
  name: string;
  description?: string;
  createdBy: Types.ObjectId;
  files: ISnapshotFile[];
  fileCount: number;
  totalSizeBytes: number;
  createdAt: Date;
  updatedAt: Date;
}

const SnapshotFileSchema = new Schema<ISnapshotFile>(
  {
    path: { type: String, required: true },
    name: { type: String, required: true },
    content: { type: String, default: '' },
    language: { type: String, default: 'plaintext' },
  },
  { _id: false }
);

const SnapshotSchema = new Schema<ISnapshot>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    files: [SnapshotFileSchema],
    fileCount: {
      type: Number,
      required: true,
      default: 0,
    },
    totalSizeBytes: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound index for chronological querying of project snapshots
SnapshotSchema.index({ projectId: 1, createdAt: -1 });

export const Snapshot = model<ISnapshot>('Snapshot', SnapshotSchema);
