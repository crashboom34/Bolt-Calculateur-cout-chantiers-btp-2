import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
const repoName = process.env.GITHUB_REPOSITORY?.split('/')?.[1];
const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';

export default defineConfig(({ command }) => ({
  base: command === 'build'
    ? (repoName && isGitHubActions ? `/${repoName}/` : './')
    : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
}));
