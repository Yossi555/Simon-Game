/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Deployed under https://<user>.github.io/Simon-Game/ (ADR-8)
export default defineConfig({
  base: '/Simon-Game/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: true,
  },
});
