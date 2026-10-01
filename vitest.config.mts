import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

// Setup follows node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md.
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules/**', '.next/**'],
    // Each test starts with untouched spies and real implementations.
    restoreMocks: true,
    unstubGlobals: true,
  },
});
