import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Split the heavy chart/icon vendors out of the main bundle
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom', 'axios'],
          'vendor-charts': ['recharts'],
          'vendor-icons': ['react-icons'],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // Product images are served by the backend under /uploads/**
      '/uploads': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
