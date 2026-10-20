import { createTestDatabase } from './database';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ExecutionService } from '../services/execution.service';
import { env } from '../config/env';

describe('Secure Code Execution Engine Integration Tests', () => {
  const app = createApp();
  let database: MongoMemoryServer;
  let token: string;

  beforeAll(async () => {
    database = await createTestDatabase();
    await mongoose.connect(database.getUri());
    const res = await request(app).post('/api/v1/auth/register').send({ name: 'Runner User', username: 'runner_user', email: 'runner@example.test', password: 'Password123!' });
    token = res.body.data.accessToken;
  });
  afterAll(async () => { await mongoose.disconnect(); await database?.stop(); });

  describe('GET /api/v1/execution/languages', () => {
    it('should retrieve list of supported languages with C and C++ as default built-in compilers', async () => {
      const res = await request(app).get('/api/v1/execution/languages');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.languages.length).toBeGreaterThanOrEqual(5);

      const cLang = res.body.data.languages.find((l: any) => l.id === 'c');
      expect(cLang).toBeDefined();
      expect(cLang.isDefault).toBe(true);
      expect(cLang.isBuiltIn).toBe(true);
      expect(cLang.requiresExtension).toBe(false);

      const cppLang = res.body.data.languages.find((l: any) => l.id === 'cpp');
      expect(cppLang).toBeDefined();
      expect(cppLang.isDefault).toBe(true);
      expect(cppLang.isBuiltIn).toBe(true);
      expect(cppLang.requiresExtension).toBe(false);

      const pyLang = res.body.data.languages.find((l: any) => l.id === 'python');
      expect(pyLang).toBeDefined();
      expect(pyLang.requiresExtension).toBe(true);
      expect(pyLang.extensionId).toBe('python');
    });
  });

  describe('POST /api/v1/execution/run', () => {
    it('should execute C code using default C compiler pipeline', async () => {
      const res = await request(app)
        .post('/api/v1/execution/run')
        .set('Authorization', `Bearer ${token}`)
        .send({
          language: 'c',
          code: `
            #include <stdio.h>
            int main() {
              printf("Hello from C Standard Engine\\n");
              return 0;
            }
          `,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.result.status).toBe('success');
      expect(res.body.data.result.exitCode).toBe(0);
      expect(res.body.data.result.language).toBe('c');
    });

    it('should execute C++ code using default C++ compiler pipeline', async () => {
      const res = await request(app)
        .post('/api/v1/execution/run')
        .set('Authorization', `Bearer ${token}`)
        .send({
          language: 'cpp',
          code: `
            #include <iostream>
            int main() {
              std::cout << "Hello from C++20 Sandbox" << std::endl;
              return 0;
            }
          `,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.result.status).toBe('success');
      expect(res.body.data.result.exitCode).toBe(0);
      expect(res.body.data.result.language).toBe('cpp');
    });

    it('should execute JavaScript code and return stdout successfully', async () => {
      const res = await request(app)
        .post('/api/v1/execution/run')
        .set('Authorization', `Bearer ${token}`)
        .send({
          language: 'javascript',
          code: `
            const a = 15;
            const b = 27;
            console.log("Sum result is: " + (a + b));
          `,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.result.status).toBe('success');
      expect(res.body.data.result.stdout).toContain('Sum result is: 42');
      expect(res.body.data.result.exitCode).toBe(0);
      expect(res.body.data.result.executionTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should handle JavaScript runtime errors and return stderr', async () => {
      const res = await request(app)
        .post('/api/v1/execution/run')
        .set('Authorization', `Bearer ${token}`)
        .send({
          language: 'javascript',
          code: `
            throw new Error("Simulated runtime failure in sandbox");
          `,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.result.status).toBe('error');
      expect(res.body.data.result.stderr).toContain('Simulated runtime failure in sandbox');
      expect(res.body.data.result.exitCode).not.toBe(0);
    });

    it('should feed stdin input to a running program', async () => {
      const res = await request(app)
        .post('/api/v1/execution/run')
        .set('Authorization', `Bearer ${token}`)
        .send({
          language: 'javascript',
          code: `
            const fs = require('fs');
            const input = fs.readFileSync(0, 'utf-8').trim();
            console.log("Read from stdin: [" + input + "]");
          `,
          stdin: 'CodeSync Competitive Input 999',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.result.status).toBe('success');
      expect(res.body.data.result.stdout).toContain('Read from stdin: [CodeSync Competitive Input 999]');
    });

    it('should terminate infinite loops when timeout limit is reached', async () => {
      const res = await request(app)
        .post('/api/v1/execution/run')
        .set('Authorization', `Bearer ${token}`)
        .send({
          language: 'javascript',
          code: `
            // Infinite loop
            while (true) {}
          `,
          timeoutMs: 1000,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.result.status).toBe('timeout');
      expect(res.body.data.result.stderr).toContain('Process exceeded maximum time limit');
    });

    it('should not leak sensitive server environment variables to sandbox code', async () => {
      process.env.TEST_SECRET_KEY = 'super_secret_jwt_token_database_password';

      const res = await request(app)
        .post('/api/v1/execution/run')
        .set('Authorization', `Bearer ${token}`)
        .send({
          language: 'javascript',
          code: `
            console.log("SECRET_IN_SANDBOX: " + (process.env.TEST_SECRET_KEY || 'NOT_FOUND'));
          `,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.result.stdout).toContain('SECRET_IN_SANDBOX: NOT_FOUND');
    });
  });

  it('rejects anonymous code execution before starting a process', async () => {
    const res = await request(app).post('/api/v1/execution/run').send({ language: 'javascript', code: 'console.log(1)' });
    expect(res.status).toBe(401);
  });

  it('transpiles real TypeScript syntax before running it', async () => {
    const result = await ExecutionService.executeCode({ language: 'typescript', code: 'const value: number = 42; console.log(value);', stdin: '' });
    expect(result.status).toBe('success');
    expect(result.stdout.trim()).toBe('42');
  });

  it('stops output floods and keeps the captured output bounded', async () => {
    const result = await ExecutionService.executeCode({ language: 'javascript', code: 'while (true) process.stdout.write("x".repeat(8192));', stdin: '', timeoutMs: 2000 });
    expect(result.status).toBe('error');
    expect(Buffer.byteLength(result.stdout)).toBeLessThanOrEqual(65536);
    expect(result.stderr).toContain('Output Limit');
  });

  it('refuses host execution in production even when explicitly configured', async () => {
    const previousMode = env.EXECUTION_MODE, previousEnvironment = env.NODE_ENV;
    env.NODE_ENV = 'production'; env.EXECUTION_MODE = 'local';
    try {
      await expect(ExecutionService.executeCode({ language: 'javascript', code: 'console.log(1)', stdin: '' })).rejects.toMatchObject({ code: 'EXECUTION_UNAVAILABLE' });
    } finally { env.NODE_ENV = previousEnvironment; env.EXECUTION_MODE = previousMode; }
  });
});
