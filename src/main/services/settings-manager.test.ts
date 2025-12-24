/**
 * Unit Tests for SettingsManager
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import type { AppSettings } from '@shared/types';
import { DEFAULT_SETTINGS } from '@shared/types';

// Mock modules
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn((key: string) => {
      if (key === 'userData') return '/mock/user/data';
      return '/mock/path';
    }),
  },
}));

vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

vi.mock('./logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Import after mocks
import { SettingsManager } from './settings-manager';

describe('SettingsManager', () => {
  let settingsManager: SettingsManager;
  const mockSettingsPath = '\\mock\\user\\data\\settings.json';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loadSettings', () => {
    it('should load existing settings from file', () => {
      const mockSettings: AppSettings = {
        ...DEFAULT_SETTINGS,
        theme: 'dark',
      };

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockSettings));

      settingsManager = new SettingsManager();

      expect(fs.existsSync).toHaveBeenCalledWith(mockSettingsPath);
      expect(fs.readFileSync).toHaveBeenCalledWith(mockSettingsPath, 'utf-8');
      expect(settingsManager.get('theme')).toBe('dark');
    });

    it('should create default settings if file does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});

      settingsManager = new SettingsManager();

      expect(settingsManager.get('theme')).toBe(DEFAULT_SETTINGS.theme);
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should merge with defaults if settings file has missing keys', () => {
      const partialSettings = {
        theme: 'light',
        // missing other keys
      };

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(
        JSON.stringify(partialSettings)
      );

      settingsManager = new SettingsManager();

      expect(settingsManager.get('theme')).toBe('light');
      expect(settingsManager.get('language')).toBe(DEFAULT_SETTINGS.language);
    });

    it('should use defaults if settings file is corrupted', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('invalid json{');
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});

      settingsManager = new SettingsManager();

      expect(settingsManager.get('theme')).toBe(DEFAULT_SETTINGS.theme);
    });
  });

  describe('get', () => {
    beforeEach(() => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});
      settingsManager = new SettingsManager();
    });

    it('should get a specific setting value', () => {
      const theme = settingsManager.get('theme');
      expect(theme).toBe(DEFAULT_SETTINGS.theme);
    });

    it('should return correct type for each setting', () => {
      expect(typeof settingsManager.get('theme')).toBe('string');
      expect(typeof settingsManager.get('language')).toBe('string');
      expect(typeof settingsManager.get('windowBounds')).toBe('object');
    });
  });

  describe('set', () => {
    beforeEach(() => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});
      settingsManager = new SettingsManager();
    });

    it('should set a setting value', () => {
      settingsManager.set('theme', 'dark');
      expect(settingsManager.get('theme')).toBe('dark');
    });

    it('should persist settings to disk', () => {
      const writeFileSyncSpy = vi.mocked(fs.writeFileSync);

      settingsManager.set('language', 'pt');

      expect(writeFileSyncSpy).toHaveBeenCalledWith(
        mockSettingsPath,
        expect.stringContaining('"language": "pt"'),
        'utf-8'
      );
    });

    it('should update complex nested settings', () => {
      const newBounds = { width: 1920, height: 1080, x: 0, y: 0 };
      settingsManager.set('windowBounds', newBounds);

      expect(settingsManager.get('windowBounds')).toEqual(newBounds);
    });
  });

  describe('getAll', () => {
    beforeEach(() => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});
      settingsManager = new SettingsManager();
    });

    it('should return all settings', () => {
      const allSettings = settingsManager.getAll();

      expect(allSettings).toHaveProperty('theme');
      expect(allSettings).toHaveProperty('language');
      expect(allSettings).toHaveProperty('windowBounds');
    });

    it('should return a copy, not the original object', () => {
      const settings1 = settingsManager.getAll();
      const settings2 = settingsManager.getAll();

      expect(settings1).toEqual(settings2);
      expect(settings1).not.toBe(settings2); // Different references
    });
  });

  describe('reset', () => {
    beforeEach(() => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});
      settingsManager = new SettingsManager();
    });

    it('should reset all settings to defaults', () => {
      settingsManager.set('theme', 'dark');
      settingsManager.set('language', 'pt');

      settingsManager.reset();

      expect(settingsManager.get('theme')).toBe(DEFAULT_SETTINGS.theme);
      expect(settingsManager.get('language')).toBe(DEFAULT_SETTINGS.language);
    });

    it('should persist reset settings to disk', () => {
      const writeFileSyncSpy = vi.mocked(fs.writeFileSync);

      settingsManager.reset();

      expect(writeFileSyncSpy).toHaveBeenCalled();
    });
  });

  describe('getSettingsPath', () => {
    beforeEach(() => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});
      settingsManager = new SettingsManager();
    });

    it('should return the correct settings file path', () => {
      const settingsPath = settingsManager.getSettingsPath();
      expect(settingsPath).toBe(mockSettingsPath);
    });
  });
});
