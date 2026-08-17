import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Vitest runs alongside the Vite build config (which lives in vite.config.js).
// jsdom gives us a DOM for component tests; jest-dom adds readable matchers.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
  },
});
