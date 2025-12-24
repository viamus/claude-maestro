/**
 * Preload Script
 * Runs in isolated context with access to both Node.js and DOM APIs
 * Exposes safe APIs to renderer via contextBridge
 */

import { contextBridge, ipcRenderer } from 'electron';
import type { IPCInvoke } from '@shared/ipc-contracts';
import type { IPCInvokeMap } from '@shared/ipc-contracts';

/**
 * Type-safe IPC invoke function
 */
const ipcInvoke: IPCInvoke = <K extends keyof IPCInvokeMap>(
  channel: K,
  ...args: IPCInvokeMap[K]['request'] extends void
    ? []
    : [IPCInvokeMap[K]['request']]
): Promise<IPCInvokeMap[K]['response']> => {
  return ipcRenderer.invoke(channel, ...args);
};

/**
 * API exposed to renderer process
 * Only these methods will be available via window.api
 */
const api = {
  /**
   * Type-safe IPC communication
   */
  invoke: ipcInvoke,

  /**
   * Get platform information
   */
  platform: process.platform,

  /**
   * Get Node.js versions
   */
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
} as const;

/**
 * Expose API to renderer via contextBridge
 * This is the ONLY way renderer can access Node.js functionality
 */
try {
  contextBridge.exposeInMainWorld('api', api);
  console.log('Preload: API exposed successfully');
} catch (error) {
  console.error('Preload: Failed to expose API', error);
}

/**
 * Type declaration for window.api (to be used in renderer)
 * Copy this to a global.d.ts file in the renderer
 */
export type ElectronAPI = typeof api;
