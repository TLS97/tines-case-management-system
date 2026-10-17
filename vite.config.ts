import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Playwright specs in tests/e2e must not be picked up by Vitest
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // Feature logic only (docs/conventions/testing.md); components are covered by component tests.
      // Matches no files until Phase 1 adds feature code, and an empty set passes.
      include: ['src/features/**/*.ts'],
      exclude: ['**/*.test.ts', '**/types.ts', '**/index.ts'],
      thresholds: {
        lines: 80,
      },
    },
  },
});
