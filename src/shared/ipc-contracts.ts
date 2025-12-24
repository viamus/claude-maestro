/**
 * IPC Contracts - Type definitions for IPC communication
 * This ensures type safety between main and renderer processes
 */

import type { AppSettings, AppVersion, IPCResponse, SettingKey } from './types';

/**
 * IPC Request/Response type mappings
 */
export interface IPCInvokeMap {
  'ipc:ping': {
    request: void;
    response: IPCResponse<string>;
  };
  'ipc:settings:get': {
    request: SettingKey;
    response: IPCResponse<AppSettings[SettingKey]>;
  };
  'ipc:settings:set': {
    request: { key: SettingKey; value: AppSettings[SettingKey] };
    response: IPCResponse<void>;
  };
  'ipc:settings:getAll': {
    request: void;
    response: IPCResponse<AppSettings>;
  };
  'ipc:app:version': {
    request: void;
    response: IPCResponse<AppVersion>;
  };
  'ipc:app:quit': {
    request: void;
    response: IPCResponse<void>;
  };
}

/**
 * Type-safe IPC invoke function signature
 */
export type IPCInvoke = <K extends keyof IPCInvokeMap>(
  channel: K,
  ...args: IPCInvokeMap[K]['request'] extends void
    ? []
    : [IPCInvokeMap[K]['request']]
) => Promise<IPCInvokeMap[K]['response']>;
