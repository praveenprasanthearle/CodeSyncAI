import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';

describe('Secure Code Execution Engine Integration Tests', () => {
  const app = createApp();

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
});
