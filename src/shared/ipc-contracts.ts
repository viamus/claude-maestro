/**
 * IPC Contracts - Type definitions for IPC communication
 * This ensures type safety between main and renderer processes
 */

import type { AppSettings, AppVersion, IPCResponse, SettingKey, Project, ProjectFormData } from './types';

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
  'ipc:project:create': {
    request: ProjectFormData;
    response: IPCResponse<Project>;
  };
  'ipc:project:getAll': {
    request: void;
    response: IPCResponse<Project[]>;
  };
  'ipc:project:getById': {
    request: string; // project ID
    response: IPCResponse<Project | null>;
  };
  'ipc:project:update': {
    request: { id: string; data: Partial<ProjectFormData> };
    response: IPCResponse<Project>;
  };
  'ipc:project:delete': {
    request: string; // project ID
    response: IPCResponse<void>;
  };
  'ipc:project:getActive': {
    request: void;
    response: IPCResponse<string | null>; // active project ID or null
  };
  'ipc:project:setActive': {
    request: string | null; // project ID or null to clear
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
