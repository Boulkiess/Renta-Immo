import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/Renta-Immo/',
  build: { outDir: 'dist' },
  test: {
    // Engine tests run on node (fast, pure). Component tests opt into jsdom
    // per-file via `// @vitest-environment jsdom` docblock — avoids the
    // deprecated environmentMatchGlobs and keeps the engine suite DOM-free.
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}'],
    setupFiles: ['./src/test-utils/setup.js'],
  },
});
