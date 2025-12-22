import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    allowedHosts: ['localhost', 'host.docker.internal'],
    proxy: {
      '/api': {
        // PROXY_TARGET is for server-side (Node.js), VITE_API_URL is for client-side (browser)
        // In Docker: use 'backend' service name. Locally: use localhost:3001
        target: process.env.PROXY_TARGET || 'http://backend:3001',
        changeOrigin: true,
      },
    },
  },
});
