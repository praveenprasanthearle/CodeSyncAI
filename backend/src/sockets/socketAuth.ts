import { Socket } from 'socket.io';
import { verifyAccessToken, AccessTokenPayload } from '../utils/token';
import { User } from '../models/User';

export interface CollaboratorUser {
  userId: string;
  username: string;
  email: string;
  name: string;
  avatarUrl: string;
  color: string;
}

export interface AuthenticatedSocket extends Socket {
  data: {
    user?: CollaboratorUser;
    projectId?: string;
    activeFileId?: string;
  };
}

const COLLABORATOR_PALETTE = [
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#14B8A6', // Teal
];

export const getRandomColor = (seed: string): string => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLLABORATOR_PALETTE.length;
  return COLLABORATOR_PALETTE[index];
};

export const socketAuthMiddleware = async (
  socket: AuthenticatedSocket,
  next: (err?: Error) => void
): Promise<void> => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');

    if (!token) {
      // Allow anonymous guest fallback with guest ID if not authenticated, or reject
      const guestId = `guest_${socket.id.substring(0, 5)}`;
      socket.data.user = {
        userId: guestId,
        username: `Guest-${socket.id.substring(0, 4)}`,
        email: `${guestId}@codesync.local`,
        name: `Guest Developer`,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${guestId}`,
        color: getRandomColor(guestId),
      };
      return next();
    }

    const payload = verifyAccessToken(token) as AccessTokenPayload;
    if (!payload || !payload.userId) {
      return next(new Error('AUTHENTICATION_FAILED'));
    }

    const userDoc = await User.findById(payload.userId);
    if (!userDoc) {
      return next(new Error('USER_NOT_FOUND'));
    }

    socket.data.user = {
      userId: userDoc._id.toString(),
      username: userDoc.username,
      email: userDoc.email,
      name: userDoc.name,
      avatarUrl: userDoc.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${userDoc.username}`,
      color: getRandomColor(userDoc.username),
    };

    next();
  } catch (err: any) {
    next(new Error(err.message || 'SOCKET_AUTH_ERROR'));
  }
};
