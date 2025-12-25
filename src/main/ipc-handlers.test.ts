/**
 * Unit Tests for IPC Handlers
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '@shared/ipc-channels';

// Mock dependencies
vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
    removeHandler: vi.fn(),
  },
  app: {
    getVersion: vi.fn(() => '1.0.0'),
    quit: vi.fn(),
    getPath: vi.fn((name: string) => {
      if (name === 'userData') return '/tmp/test-app-data';
      return '/tmp';
    }),
  },
}));

vi.mock('./services/settings-manager', () => ({
  settingsManager: {
    get: vi.fn((key: string) => {
      if (key === 'theme') return 'system';
      if (key === 'language') return 'en';
      return null;
    }),
    set: vi.fn(),
    getAll: vi.fn(() => ({
      theme: 'system',
      language: 'en',
      windowBounds: { width: 1200, height: 800 },
    })),
  },
}));

vi.mock('./services/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import { registerIPCHandlers, unregisterIPCHandlers } from './ipc-handlers';
import { settingsManager } from './services/settings-manager';
import { app } from 'electron';

describe('IPC Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('registerIPCHandlers', () => {
    it('should register all IPC handlers', () => {
      registerIPCHandlers();

      expect(ipcMain.handle).toHaveBeenCalledWith(
        IPC_CHANNELS.PING,
        expect.any(Function)
      );
      expect(ipcMain.handle).toHaveBeenCalledWith(
        IPC_CHANNELS.SETTINGS_GET,
        expect.any(Function)
      );
      expect(ipcMain.handle).toHaveBeenCalledWith(
        IPC_CHANNELS.SETTINGS_SET,
        expect.any(Function)
      );
      expect(ipcMain.handle).toHaveBeenCalledWith(
        IPC_CHANNELS.SETTINGS_GET_ALL,
        expect.any(Function)
      );
      expect(ipcMain.handle).toHaveBeenCalledWith(
        IPC_CHANNELS.APP_VERSION,
        expect.any(Function)
      );
      expect(ipcMain.handle).toHaveBeenCalledWith(
        IPC_CHANNELS.APP_QUIT,
        expect.any(Function)
      );
    });
  });

  describe('Ping Handler', () => {
    it('should return pong on ping', async () => {
      let pingHandler: ((...args: any[]) => any) | null = null;

      vi.mocked(ipcMain.handle).mockImplementation((channel, handler) => {
        if (channel === IPC_CHANNELS.PING) {
          pingHandler = handler;
        }
      });

      registerIPCHandlers();

      expect(pingHandler).not.toBeNull();

      const result = await pingHandler!({}, undefined);
      expect(result).toEqual({
        success: true,
        data: 'pong',
      });
    });
  });

  describe('Settings Handlers', () => {
    it('should get a single setting', async () => {
      let settingsGetHandler: ((...args: any[]) => any) | null = null;

      vi.mocked(ipcMain.handle).mockImplementation((channel, handler) => {
        if (channel === IPC_CHANNELS.SETTINGS_GET) {
          settingsGetHandler = handler;
        }
      });

      registerIPCHandlers();

      const result = await settingsGetHandler!({}, 'theme');

      expect(settingsManager.get).toHaveBeenCalledWith('theme');
      expect(result).toEqual({
        success: true,
        data: 'system',
      });
    });

    it('should set a setting', async () => {
      let settingsSetHandler: ((...args: any[]) => any) | null = null;

      vi.mocked(ipcMain.handle).mockImplementation((channel, handler) => {
        if (channel === IPC_CHANNELS.SETTINGS_SET) {
          settingsSetHandler = handler;
        }
      });

      registerIPCHandlers();

      const payload = { key: 'theme', value: 'dark' };
      const result = await settingsSetHandler!({}, payload);

      expect(settingsManager.set).toHaveBeenCalledWith('theme', 'dark');
      expect(result).toEqual({
        success: true,
        data: undefined,
      });
    });

    it('should get all settings', async () => {
      let settingsGetAllHandler: ((...args: any[]) => any) | null = null;

      vi.mocked(ipcMain.handle).mockImplementation((channel, handler) => {
        if (channel === IPC_CHANNELS.SETTINGS_GET_ALL) {
          settingsGetAllHandler = handler;
        }
      });

      registerIPCHandlers();

      const result = await settingsGetAllHandler!({}, undefined);

      expect(settingsManager.getAll).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        data: {
          theme: 'system',
          language: 'en',
          windowBounds: { width: 1200, height: 800 },
        },
      });
    });
  });

  describe('App Version Handler', () => {
    it('should return app version info', async () => {
      let appVersionHandler: ((...args: any[]) => any) | null = null;

      vi.mocked(ipcMain.handle).mockImplementation((channel, handler) => {
        if (channel === IPC_CHANNELS.APP_VERSION) {
          appVersionHandler = handler;
        }
      });

      registerIPCHandlers();

      const result = await appVersionHandler!({}, undefined);

      expect(app.getVersion).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('app');
      expect(result.data).toHaveProperty('electron');
      expect(result.data).toHaveProperty('chrome');
      expect(result.data).toHaveProperty('node');
    });
  });

  describe('Error Handling', () => {
    it('should return error response when handler throws', async () => {
      let settingsGetHandler: ((...args: any[]) => any) | null = null;

      vi.mocked(ipcMain.handle).mockImplementation((channel, handler) => {
        if (channel === IPC_CHANNELS.SETTINGS_GET) {
          settingsGetHandler = handler;
        }
      });

      vi.mocked(settingsManager.get).mockImplementation(() => {
        throw new Error('Test error');
      });

      registerIPCHandlers();

      const result = await settingsGetHandler!({}, 'theme');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Test error');
    });
  });

  describe('unregisterIPCHandlers', () => {
    it('should remove all IPC handlers', () => {
      unregisterIPCHandlers();

      expect(ipcMain.removeHandler).toHaveBeenCalledWith(IPC_CHANNELS.PING);
      expect(ipcMain.removeHandler).toHaveBeenCalledWith(
        IPC_CHANNELS.SETTINGS_GET
      );
      expect(ipcMain.removeHandler).toHaveBeenCalledWith(
        IPC_CHANNELS.SETTINGS_SET
      );
      expect(ipcMain.removeHandler).toHaveBeenCalledWith(
        IPC_CHANNELS.SETTINGS_GET_ALL
      );
      expect(ipcMain.removeHandler).toHaveBeenCalledWith(
        IPC_CHANNELS.APP_VERSION
      );
      expect(ipcMain.removeHandler).toHaveBeenCalledWith(IPC_CHANNELS.APP_QUIT);
    });
  });
});
