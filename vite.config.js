import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/Renta-Immo/',
  build: { outDir: 'dist' },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}'],
  },
});
