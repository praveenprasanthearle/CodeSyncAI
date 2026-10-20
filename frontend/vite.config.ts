import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const configuration = loadEnv(mode, process.cwd(), '');
  const backendUrl = configuration.BACKEND_URL || `http://127.0.0.1:${configuration.VITE_BACKEND_PORT || '5000'}`;
  return {
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
        target: backendUrl,
        changeOrigin: true,
        proxyTimeout: 75000,
      },
      '/socket.io': {
        target: backendUrl,
        ws: true,
      },
    },
  },
  preview: {
    host: true,
    port: 5173,
  },
  };
});
