/**
 * Global type declarations for renderer process
 */

import type { ElectronAPI } from '../preload/preload';

declare global {
  /**
   * API exposed by preload script via contextBridge
   */
  interface Window {
    api: ElectronAPI;
  }
}

export {};
