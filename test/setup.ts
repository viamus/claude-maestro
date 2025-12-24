/**
 * Vitest Setup File
 * Runs before all tests
 */

import '@testing-library/jest-dom/vitest';

// Mock Electron APIs for testing
global.window = global.window || {};

// Mock window.api (exposed by preload)
(global.window as any).api = {
  invoke: vi.fn(),
  platform: 'win32',
  versions: {
    node: '18.0.0',
    chrome: '120.0.0',
    electron: '33.0.0',
  },
};
