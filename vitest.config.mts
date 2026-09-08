import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    alias: {
      '@': path.resolve(import.meta.dirname, './'),
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['services/server/**/*.ts', 'lib/validations/**/*.ts'],
      exclude: ['**/*.test.ts'],
    },
  },
});
