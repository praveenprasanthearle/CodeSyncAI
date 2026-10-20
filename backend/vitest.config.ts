import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    environment: 'node',
    testTimeout: 60000,
    hookTimeout: 120000,
  },
});
