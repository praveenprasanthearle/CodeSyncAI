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
    host: true, // Exposes server to all network interfaces (0.0.0.0) for LAN access
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.BACKEND_URL || 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: process.env.BACKEND_URL || 'http://127.0.0.1:5000',
        ws: true,
      },
    },
  },
  preview: {
    host: true,
    port: 5173,
  },
});
