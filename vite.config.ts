/**
 * Vite Configuration for Renderer Process
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],

  // Root for renderer
  root: path.join(__dirname, 'src/renderer'),

  // Public directory
  publicDir: path.join(__dirname, 'public'),

  // Build output
  build: {
    outDir: path.join(__dirname, 'dist/renderer'),
    emptyOutDir: true,
    sourcemap: true,
  },

  // Development server
  server: {
    port: 5173,
    strictPort: true,
  },

  // Path resolution
  resolve: {
    alias: {
      '@shared': path.join(__dirname, 'src/shared'),
      '@renderer': path.join(__dirname, 'src/renderer'),
    },
  },

  // Base path
  base: './',
});
