import { Schema, model, Document, Types } from 'mongoose';

export interface IFileReference {
  fileId?: Types.ObjectId;
  path: string;
  line?: number;
}

export interface IChatMessage {
  projectId: Types.ObjectId;
  sender: Types.ObjectId;
  text: string;
  fileReference?: IFileReference;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChatMessageDocument extends IChatMessage, Document {}

const fileReferenceSchema = new Schema<IFileReference>(
  {
    fileId: {
      type: Schema.Types.ObjectId,
      ref: 'FileNode',
    },
    path: {
      type: String,
      required: true,
    },
    line: {
      type: Number,
      default: 1,
    },
  },
  { _id: false }
);

const chatMessageSchema = new Schema<IChatMessageDocument>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender ID is required'],
      index: true,
    },
    text: {
      type: String,
      required: [true, 'Message text is required'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    fileReference: {
      type: fileReferenceSchema,
      default: undefined,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : undefined;
        ret.projectId = ret.projectId ? ret.projectId.toString() : undefined;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound index for fast paginated chat history loading
chatMessageSchema.index({ projectId: 1, createdAt: -1 });

export const ChatMessage = model<IChatMessageDocument>('ChatMessage', chatMessageSchema);
