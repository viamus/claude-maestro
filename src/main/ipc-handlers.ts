/**
 * IPC Handlers - Register all IPC communication handlers
 * Implements type-safe request/response pattern
 */

import { ipcMain, app } from 'electron';
import type { IPCResponse, AppVersion, SettingKey, AppSettings } from '@shared/types';
import { IPC_CHANNELS } from '@shared/ipc-channels';
import { settingsManager } from './services/settings-manager';
import { logger } from './services/logger';

/**
 * Helper to create success response
 */
function createSuccessResponse<T>(data: T): IPCResponse<T> {
  return { success: true, data };
}

/**
 * Helper to create error response
 */
function createErrorResponse<T = never>(error: string): IPCResponse<T> {
  return { success: false, error };
}

/**
 * Register all IPC handlers
 */
export function registerIPCHandlers(): void {
  logger.info('Registering IPC handlers');

  // Ping/test handler
  ipcMain.handle(IPC_CHANNELS.PING, async (): Promise<IPCResponse<string>> => {
    try {
      logger.debug('Ping received');
      return createSuccessResponse('pong');
    } catch (error) {
      logger.error('Error in ping handler', error);
      return createErrorResponse<string>(
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  });

  // Get single setting
  ipcMain.handle(
    IPC_CHANNELS.SETTINGS_GET,
    async (
      _event,
      key: SettingKey
    ): Promise<IPCResponse<AppSettings[SettingKey]>> => {
      try {
        logger.debug(`Getting setting: ${key}`);
        const value = settingsManager.get(key);
        return createSuccessResponse(value);
      } catch (error) {
        logger.error(`Error getting setting: ${key}`, error);
        return createErrorResponse<AppSettings[SettingKey]>(
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }
  );

  // Set single setting
  ipcMain.handle(
    IPC_CHANNELS.SETTINGS_SET,
    async (
      _event,
      payload: { key: SettingKey; value: AppSettings[SettingKey] }
    ): Promise<IPCResponse<void>> => {
      try {
        logger.debug(`Setting ${payload.key} = ${JSON.stringify(payload.value)}`);
        settingsManager.set(payload.key, payload.value);
        return createSuccessResponse(undefined);
      } catch (error) {
        logger.error(`Error setting ${payload.key}`, error);
        return createErrorResponse<void>(
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }
  );

  // Get all settings
  ipcMain.handle(
    IPC_CHANNELS.SETTINGS_GET_ALL,
    async (): Promise<IPCResponse<AppSettings>> => {
      try {
        logger.debug('Getting all settings');
        const settings = settingsManager.getAll();
        return createSuccessResponse(settings);
      } catch (error) {
        logger.error('Error getting all settings', error);
        return createErrorResponse<AppSettings>(
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }
  );

  // Get app version
  ipcMain.handle(
    IPC_CHANNELS.APP_VERSION,
    async (): Promise<IPCResponse<AppVersion>> => {
      try {
        const version: AppVersion = {
          app: app.getVersion(),
          electron: process.versions.electron,
          chrome: process.versions.chrome,
          node: process.versions.node,
        };
        return createSuccessResponse(version);
      } catch (error) {
        logger.error('Error getting app version', error);
        return createErrorResponse<AppVersion>(
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }
  );

  // Quit app
  ipcMain.handle(IPC_CHANNELS.APP_QUIT, async (): Promise<IPCResponse<void>> => {
    try {
      logger.info('Quit requested via IPC');
      app.quit();
      return createSuccessResponse(undefined);
    } catch (error) {
      logger.error('Error quitting app', error);
      return createErrorResponse<void>(
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  });

  logger.info('IPC handlers registered successfully');
}

/**
 * Unregister all IPC handlers (cleanup)
 */
export function unregisterIPCHandlers(): void {
  logger.info('Unregistering IPC handlers');
  ipcMain.removeHandler(IPC_CHANNELS.PING);
  ipcMain.removeHandler(IPC_CHANNELS.SETTINGS_GET);
  ipcMain.removeHandler(IPC_CHANNELS.SETTINGS_SET);
  ipcMain.removeHandler(IPC_CHANNELS.SETTINGS_GET_ALL);
  ipcMain.removeHandler(IPC_CHANNELS.APP_VERSION);
  ipcMain.removeHandler(IPC_CHANNELS.APP_QUIT);
}
