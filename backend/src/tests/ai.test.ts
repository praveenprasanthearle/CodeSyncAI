import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';

describe('AI Pair Programming Assistant Integration Tests', () => {
  const app = createApp();

  describe('POST /api/v1/ai/chat', () => {
    it('should generate intelligent contextual response for developer prompt', async () => {
      const res = await request(app)
        .post('/api/v1/ai/chat')
        .send({
          message: 'Can you explain what this active file does and suggest improvements?',
          activeFile: {
            name: 'auth.service.ts',
            path: '/src/services/auth.service.ts',
            language: 'typescript',
            content: 'export class AuthService { static async login() { return true; } }',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reply).toBeDefined();
      expect(res.body.data.reply.length).toBeGreaterThan(10);
      expect(res.body.data.model).toBeDefined();
    });
  });

  describe('POST /api/v1/ai/explain', () => {
    it('should explain code snippet and calculate time and space complexity', async () => {
      const res = await request(app)
        .post('/api/v1/ai/explain')
        .send({
          code: 'function binarySearch(arr, target) { let left = 0, right = arr.length - 1; while (left <= right) { const mid = Math.floor((left + right) / 2); if (arr[mid] === target) return mid; if (arr[mid] < target) left = mid + 1; else right = mid - 1; } return -1; }',
          language: 'javascript',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.explanation).toBeDefined();
      expect(res.body.data.timeComplexity).toBeDefined();
      expect(res.body.data.spaceComplexity).toBeDefined();
    });
  });

  describe('POST /api/v1/ai/refactor', () => {
    it('should refactor code according to developer instruction', async () => {
      const res = await request(app)
        .post('/api/v1/ai/refactor')
        .send({
          code: 'var x = 10; var y = 20; if (x > 5) { console.log(x + y); }',
          language: 'javascript',
          instruction: 'Convert to modern ES6+ const/let and arrow functions',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.refactoredCode).toBeDefined();
      expect(res.body.data.changes).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/v1/ai/fix-error', () => {
    it('should diagnose error message and provide corrected code snippet', async () => {
      const res = await request(app)
        .post('/api/v1/ai/fix-error')
        .send({
          code: 'const data = null; console.log(data.user.name);',
          errorMessage: 'TypeError: Cannot read properties of null (reading user)',
          language: 'javascript',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.diagnosis).toBeDefined();
      expect(res.body.data.fixedCode).toBeDefined();
    });
  });

  describe('POST /api/v1/ai/generate-tests', () => {
    it('should generate complete Vitest unit test suite for given code', async () => {
      const res = await request(app)
        .post('/api/v1/ai/generate-tests')
        .send({
          code: 'export function add(a: number, b: number): number { return a + b; }',
          language: 'typescript',
          framework: 'vitest',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.testSuite).toContain('describe');
      expect(res.body.data.framework).toBe('vitest');
    });
  });
});
