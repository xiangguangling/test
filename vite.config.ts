import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const parentDir = path.resolve(rootDir, '..');

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.GITHUB_ACTIONS ? '/test/' : './',
  server: {
    fs: {
      allow: [rootDir, parentDir],
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
