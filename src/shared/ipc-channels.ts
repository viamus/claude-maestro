/**
 * IPC Channel names - centralized to avoid typos and ensure type safety
 */
export const IPC_CHANNELS = {
  // Test/Health
  PING: 'ipc:ping',

  // Settings
  SETTINGS_GET: 'ipc:settings:get',
  SETTINGS_SET: 'ipc:settings:set',
  SETTINGS_GET_ALL: 'ipc:settings:getAll',

  // System
  APP_VERSION: 'ipc:app:version',
  APP_QUIT: 'ipc:app:quit',

  // Projects
  PROJECT_CREATE: 'ipc:project:create',
  PROJECT_GET_ALL: 'ipc:project:getAll',
  PROJECT_GET_BY_ID: 'ipc:project:getById',
  PROJECT_UPDATE: 'ipc:project:update',
  PROJECT_DELETE: 'ipc:project:delete',
  PROJECT_GET_ACTIVE: 'ipc:project:getActive',
  PROJECT_SET_ACTIVE: 'ipc:project:setActive',
} as const;

export type IPCChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];
