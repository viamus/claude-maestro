/**
 * IPC Handlers - Register all IPC communication handlers
 * Implements type-safe request/response pattern
 */

import { ipcMain, app } from 'electron';
import type { IPCResponse, AppVersion, SettingKey, AppSettings, Project, ProjectFormData } from '@shared/types';
import { IPC_CHANNELS } from '@shared/ipc-channels';
import { settingsManager } from './services/settings-manager';
import { projectManager } from './services/project-manager';
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

  // Project: Create
  ipcMain.handle(
    IPC_CHANNELS.PROJECT_CREATE,
    async (_event, formData: ProjectFormData): Promise<IPCResponse<Project>> => {
      try {
        logger.debug(`Creating project: ${formData.name}`);
        const project = projectManager.createProject(formData);
        return createSuccessResponse(project);
      } catch (error) {
        logger.error('Error creating project', error);
        return createErrorResponse<Project>(
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }
  );

  // Project: Get All
  ipcMain.handle(
    IPC_CHANNELS.PROJECT_GET_ALL,
    async (): Promise<IPCResponse<Project[]>> => {
      try {
        logger.debug('Getting all projects');
        const projects = projectManager.getAllProjects();
        return createSuccessResponse(projects);
      } catch (error) {
        logger.error('Error getting all projects', error);
        return createErrorResponse<Project[]>(
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }
  );

  // Project: Get By ID
  ipcMain.handle(
    IPC_CHANNELS.PROJECT_GET_BY_ID,
    async (_event, id: string): Promise<IPCResponse<Project | null>> => {
      try {
        logger.debug(`Getting project: ${id}`);
        const project = projectManager.getProjectById(id);
        return createSuccessResponse(project);
      } catch (error) {
        logger.error(`Error getting project ${id}`, error);
        return createErrorResponse<Project | null>(
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }
  );

  // Project: Update
  ipcMain.handle(
    IPC_CHANNELS.PROJECT_UPDATE,
    async (
      _event,
      payload: { id: string; data: Partial<ProjectFormData> }
    ): Promise<IPCResponse<Project>> => {
      try {
        logger.debug(`Updating project: ${payload.id}`);
        const project = projectManager.updateProject(payload.id, payload.data);
        return createSuccessResponse(project);
      } catch (error) {
        logger.error(`Error updating project ${payload.id}`, error);
        return createErrorResponse<Project>(
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }
  );

  // Project: Delete
  ipcMain.handle(
    IPC_CHANNELS.PROJECT_DELETE,
    async (_event, id: string): Promise<IPCResponse<void>> => {
      try {
        logger.debug(`Deleting project: ${id}`);
        projectManager.deleteProject(id);
        return createSuccessResponse(undefined);
      } catch (error) {
        logger.error(`Error deleting project ${id}`, error);
        return createErrorResponse<void>(
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }
  );

  // Project: Get Active
  ipcMain.handle(
    IPC_CHANNELS.PROJECT_GET_ACTIVE,
    async (): Promise<IPCResponse<string | null>> => {
      try {
        logger.debug('Getting active project ID');
        const activeId = projectManager.getActiveProjectId();
        return createSuccessResponse(activeId);
      } catch (error) {
        logger.error('Error getting active project ID', error);
        return createErrorResponse<string | null>(
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }
  );

  // Project: Set Active
  ipcMain.handle(
    IPC_CHANNELS.PROJECT_SET_ACTIVE,
    async (_event, id: string | null): Promise<IPCResponse<void>> => {
      try {
        logger.debug(`Setting active project: ${id || 'null'}`);
        projectManager.setActiveProjectId(id);
        return createSuccessResponse(undefined);
      } catch (error) {
        logger.error('Error setting active project', error);
        return createErrorResponse<void>(
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }
  );

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
  ipcMain.removeHandler(IPC_CHANNELS.PROJECT_CREATE);
  ipcMain.removeHandler(IPC_CHANNELS.PROJECT_GET_ALL);
  ipcMain.removeHandler(IPC_CHANNELS.PROJECT_GET_BY_ID);
  ipcMain.removeHandler(IPC_CHANNELS.PROJECT_UPDATE);
  ipcMain.removeHandler(IPC_CHANNELS.PROJECT_DELETE);
  ipcMain.removeHandler(IPC_CHANNELS.PROJECT_GET_ACTIVE);
  ipcMain.removeHandler(IPC_CHANNELS.PROJECT_SET_ACTIVE);
}
