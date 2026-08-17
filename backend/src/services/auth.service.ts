import { User } from '../models/User';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  RefreshTokenPayload,
} from '../utils/token';
import { RegisterInput, LoginInput, UpdateProfileInput } from '../validations/auth.validation';
import { AppError } from '../middleware/errorHandler';

export interface AuthResult {
  user: any;
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  /**
   * Register a new user
   */
  static async register(input: RegisterInput): Promise<AuthResult> {
    const existingEmail = await User.findOne({ email: input.email.toLowerCase() });
    if (existingEmail) {
      throw new AppError('An account with this email address already exists.', 409, 'EMAIL_EXISTS');
    }

    const existingUsername = await User.findOne({ username: input.username.toLowerCase() });
    if (existingUsername) {
      throw new AppError('This username is already taken. Please choose another.', 409, 'USERNAME_EXISTS');
    }

    const user = await User.create({
      name: input.name,
      username: input.username.toLowerCase(),
      email: input.email.toLowerCase(),
      password: input.password,
    });

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      tokenVersion: user.refreshTokenVersion,
    });

    return {
      user: user.toJSON(),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Authenticate an existing user with email/username and password
   */
  static async login(input: LoginInput): Promise<AuthResult> {
    const rawIdentifier = input.emailOrUsername.trim().toLowerCase();
    const cleanIdentifier = rawIdentifier.replace(/^@+/, '');

    const user = await User.findOne({
      $or: [
        { email: rawIdentifier },
        { email: cleanIdentifier },
        { username: rawIdentifier },
        { username: cleanIdentifier },
      ],
    }).select('+password');

    if (!user) {
      throw new AppError('Invalid email/username or password.', 401, 'INVALID_CREDENTIALS');
    }

    const isPasswordValid = await user.comparePassword(input.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email/username or password.', 401, 'INVALID_CREDENTIALS');
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      tokenVersion: user.refreshTokenVersion,
    });

    return {
      user: user.toJSON(),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh session via a valid refresh token
   */
  static async refreshSession(token: string): Promise<{ accessToken: string; refreshToken: string; user: any }> {
    let payload: RefreshTokenPayload;
    try {
      payload = verifyRefreshToken(token);
    } catch (err: any) {
      throw new AppError('Invalid or expired refresh token. Please sign in again.', 401, 'INVALID_REFRESH_TOKEN');
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      throw new AppError('User session is invalid. Account not found.', 401, 'USER_NOT_FOUND');
    }

    if (user.refreshTokenVersion !== payload.tokenVersion) {
      throw new AppError('Session has been revoked. Please sign in again.', 401, 'SESSION_REVOKED');
    }

    // Issue refreshed tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      tokenVersion: user.refreshTokenVersion,
    });

    return {
      accessToken,
      refreshToken,
      user: user.toJSON(),
    };
  }

  /**
   * Revoke all active refresh tokens for a user (security reset)
   */
  static async revokeAllSessions(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { $inc: { refreshTokenVersion: 1 } });
  }

  /**
   * Get user profile by ID
   */
  static async getUserProfile(userId: string): Promise<any> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User profile not found.', 404, 'USER_NOT_FOUND');
    }
    return user.toJSON();
  }

  /**
   * Update user profile details
   */
  static async updateProfile(userId: string, input: UpdateProfileInput): Promise<any> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User profile not found.', 404, 'USER_NOT_FOUND');
    }

    if (input.name !== undefined) user.name = input.name;
    if (input.avatarUrl !== undefined) user.avatarUrl = input.avatarUrl;

    await user.save();
    return user.toJSON();
  }
}
