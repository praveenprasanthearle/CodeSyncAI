import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../app';
import { User } from '../models/User';
import { REFRESH_COOKIE_NAME } from '../utils/token';

describe('Auth & Security System Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  const app = createApp();

  beforeAll(async () => {
    // Start in-memory MongoDB (allow ample time for first-time binary initialization)
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  }, 120000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    // Clear user collection between test cases
    await User.deleteMany({});
  });

  describe('POST /api/v1/auth/register', () => {
    const validUser = {
      name: 'Ada Lovelace',
      username: 'ada_lovelace',
      email: 'ada@codesync.ai',
      password: 'SecurePassword123!',
    };

    it('should register a new user successfully and return user + accessToken + refresh cookie', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(validUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe('ada@codesync.ai');
      expect(res.body.data.user.username).toBe('ada_lovelace');
      expect(res.body.data.user.password).toBeUndefined(); // Ensure password is not leaked
      expect(res.body.data.accessToken).toBeDefined();

      // Ensure Set-Cookie header is sent with refresh token
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain(REFRESH_COOKIE_NAME);
    });

    it('should reject registration if email is already in use', async () => {
      await request(app).post('/api/v1/auth/register').send(validUser);

      const res = await request(app).post('/api/v1/auth/register').send({
        ...validUser,
        username: 'different_username',
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('EMAIL_EXISTS');
    });

    it('should reject registration if username is already taken', async () => {
      await request(app).post('/api/v1/auth/register').send(validUser);

      const res = await request(app).post('/api/v1/auth/register').send({
        ...validUser,
        email: 'different@codesync.ai',
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('USERNAME_EXISTS');
    });

    it('should reject registration if password does not meet complexity requirements', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        ...validUser,
        password: 'short',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    const seedUser = {
      name: 'Alan Turing',
      username: 'alanturing',
      email: 'alan@codesync.ai',
      password: 'TuringPassword123!',
    };

    beforeEach(async () => {
      await request(app).post('/api/v1/auth/register').send(seedUser);
    });

    it('should authenticate user with email and correct password', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        emailOrUsername: 'alan@codesync.ai',
        password: 'TuringPassword123!',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('alan@codesync.ai');
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should authenticate user with username and correct password', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        emailOrUsername: 'alanturing',
        password: 'TuringPassword123!',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.username).toBe('alanturing');
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        emailOrUsername: 'alanturing',
        password: 'WrongPassword!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject login for non-existent user', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        emailOrUsername: 'nonexistent@codesync.ai',
        password: 'SomePassword123!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let accessToken: string;

    beforeEach(async () => {
      const reg = await request(app).post('/api/v1/auth/register').send({
        name: 'Grace Hopper',
        username: 'ghopper',
        email: 'grace@codesync.ai',
        password: 'GracePassword123!',
      });
      accessToken = reg.body.data.accessToken;
    });

    it('should retrieve current user profile with valid Bearer token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('grace@codesync.ai');
      expect(res.body.data.user.name).toBe('Grace Hopper');
    });

    it('should reject access when Bearer token is missing', async () => {
      const res = await request(app).get('/api/v1/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject access when token is invalid or malformed', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid.token.payload');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let refreshCookie: string;

    beforeEach(async () => {
      const reg = await request(app).post('/api/v1/auth/register').send({
        name: 'Linus Torvalds',
        username: 'linus',
        email: 'linus@codesync.ai',
        password: 'LinusPassword123!',
      });
      const cookieHeader = reg.headers['set-cookie'];
      refreshCookie = cookieHeader ? cookieHeader[0] : '';
    });

    it('should issue a new access token when valid refresh cookie is sent', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', refreshCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.username).toBe('linus');
    });

    it('should reject refresh when cookie is missing', async () => {
      const res = await request(app).post('/api/v1/auth/refresh');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('MISSING_REFRESH_TOKEN');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should clear refresh cookie and return success', async () => {
      const res = await request(app).post('/api/v1/auth/logout');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain(`${REFRESH_COOKIE_NAME}=;`);
    });
  });

  describe('PATCH /api/v1/auth/profile', () => {
    let accessToken: string;

    beforeEach(async () => {
      const reg = await request(app).post('/api/v1/auth/register').send({
        name: 'Margaret Hamilton',
        username: 'margaret',
        email: 'margaret@codesync.ai',
        password: 'ApolloPassword123!',
      });
      accessToken = reg.body.data.accessToken;
    });

    it('should update name successfully', async () => {
      const res = await request(app)
        .patch('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Margaret Heafield Hamilton',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.name).toBe('Margaret Heafield Hamilton');
    });
  });
});
