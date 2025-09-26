import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
const repoName = process.env.GITHUB_REPOSITORY?.split('/')?.[1];

export default defineConfig({
  base: repoName ? `/${repoName}/` : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
