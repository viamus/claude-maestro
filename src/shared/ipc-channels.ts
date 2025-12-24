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
} as const;

export type IPCChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];
