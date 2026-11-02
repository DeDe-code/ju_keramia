import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Backend unit tests run in Node: scope collection to the server tree so frontend
    // files and Nuxt build output are never loaded by the test runner.
    include: ['server/**/*.test.ts'],
  },
});
