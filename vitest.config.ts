import { defineConfig } from 'vitest/config';

/** Separate from vite.config.ts so Vitest does not load the Devvit Vite plugin. */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
