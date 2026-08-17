import { ChatMessage } from '../models/ChatMessage';
import { Project } from '../models/Project';
import { AppError } from '../middleware/errorHandler';
import { SendMessageInput } from '../validations/chat.validation';
import mongoose from 'mongoose';

export class ChatService {
  /**
   * Get paginated messages for a project workspace
   */
  static async getProjectMessages(
    projectId: string,
    limit = 50,
    before?: string
  ): Promise<{ messages: any[]; hasMore: boolean }> {
    const projectObjectId = new mongoose.Types.ObjectId(projectId);
    const parsedLimit = Math.min(100, Math.max(1, Number(limit) || 50));

    const filter: any = { projectId: projectObjectId };
    if (before) {
      filter.createdAt = { $lt: new Date(before) };
    }

    const messages = await ChatMessage.find(filter)
      .sort({ createdAt: -1 })
      .limit(parsedLimit + 1)
      .populate('sender', 'name username avatarUrl email');

    const hasMore = messages.length > parsedLimit;
    const resultMessages = hasMore ? messages.slice(0, parsedLimit) : messages;

    // Return in chronological order
    return {
      messages: resultMessages.reverse().map((m) => m.toJSON()),
      hasMore,
    };
  }

  /**
   * Send a new message to a project channel
   */
  static async sendMessage(
    projectId: string,
    senderId: string,
    input: SendMessageInput
  ): Promise<any> {
    const projectObjectId = new mongoose.Types.ObjectId(projectId);
    const senderObjectId = new mongoose.Types.ObjectId(senderId);

    const message = await ChatMessage.create({
      projectId: projectObjectId,
      sender: senderObjectId,
      text: input.text,
      fileReference: input.fileReference
        ? {
            fileId: input.fileReference.fileId
              ? new mongoose.Types.ObjectId(input.fileReference.fileId)
              : undefined,
            path: input.fileReference.path,
            line: input.fileReference.line || 1,
          }
        : undefined,
    });

    await Project.findByIdAndUpdate(projectObjectId, {
      lastActivityAt: new Date(),
    });

    const populated = await ChatMessage.findById(message._id).populate(
      'sender',
      'name username avatarUrl email'
    );

    return populated?.toJSON();
  }

  /**
   * Delete a message (author or workspace owner only)
   */
  static async deleteMessage(messageId: string, userId: string): Promise<{ deleted: boolean }> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const message = await ChatMessage.findById(messageId);

    if (!message) {
      throw new AppError('Message not found', 404, 'MESSAGE_NOT_FOUND');
    }

    const project = await Project.findById(message.projectId);
    const isOwner = project && project.owner.toString() === userObjectId.toString();
    const isAuthor = message.sender.toString() === userObjectId.toString();

    if (!isOwner && !isAuthor) {
      throw new AppError('You are not authorized to delete this message', 403, 'FORBIDDEN');
    }

    await ChatMessage.findByIdAndDelete(message._id);
    return { deleted: true };
  }
}
