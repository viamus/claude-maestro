/**
 * Vitest Configuration
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],

  test: {
    // Test environment
    environment: 'happy-dom',

    // Global setup
    globals: true,

    // Setup files
    setupFiles: ['./test/setup.ts'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'release/',
        'test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData.ts',
      ],
    },

    // Test patterns
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'release'],
  },

  resolve: {
    alias: {
      '@shared': path.join(__dirname, 'src/shared'),
      '@main': path.join(__dirname, 'src/main'),
      '@renderer': path.join(__dirname, 'src/renderer'),
    },
  },
});
