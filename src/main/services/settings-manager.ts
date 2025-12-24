/**
 * Settings Manager - Handles persistent application settings
 * Stores settings in userData directory as JSON
 */

import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import type { AppSettings, SettingKey } from '@shared/types';
import { DEFAULT_SETTINGS } from '@shared/types';
import { logger } from './logger';

export class SettingsManager {
  private settingsPath: string;
  private settings: AppSettings;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.settingsPath = path.join(userDataPath, 'settings.json');
    this.settings = this.loadSettings();
  }

  /**
   * Load settings from disk, create defaults if not exists
   */
  private loadSettings(): AppSettings {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const data = fs.readFileSync(this.settingsPath, 'utf-8');
        const loaded = JSON.parse(data) as Partial<AppSettings>;

        // Merge with defaults to handle new settings keys
        const merged = { ...DEFAULT_SETTINGS, ...loaded };
        logger.info('Settings loaded successfully');
        return merged;
      } else {
        logger.info('No settings file found, creating defaults');
        this.saveSettings(DEFAULT_SETTINGS);
        return { ...DEFAULT_SETTINGS };
      }
    } catch (error) {
      logger.error('Failed to load settings, using defaults', error);
      return { ...DEFAULT_SETTINGS };
    }
  }

  /**
   * Save current settings to disk
   */
  private saveSettings(settings: AppSettings): void {
    try {
      const userDataPath = app.getPath('userData');

      // Ensure directory exists
      if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true });
      }

      fs.writeFileSync(
        this.settingsPath,
        JSON.stringify(settings, null, 2),
        'utf-8'
      );
      logger.info('Settings saved successfully');
    } catch (error) {
      logger.error('Failed to save settings', error);
      throw error;
    }
  }

  /**
   * Get a specific setting value
   */
  public get<K extends SettingKey>(key: K): AppSettings[K] {
    return this.settings[key];
  }

  /**
   * Set a specific setting value
   */
  public set<K extends SettingKey>(key: K, value: AppSettings[K]): void {
    this.settings[key] = value;
    this.saveSettings(this.settings);
  }

  /**
   * Get all settings
   */
  public getAll(): AppSettings {
    return { ...this.settings };
  }

  /**
   * Reset settings to defaults
   */
  public reset(): void {
    this.settings = { ...DEFAULT_SETTINGS };
    this.saveSettings(this.settings);
    logger.info('Settings reset to defaults');
  }

  /**
   * Get settings file path (for debugging)
   */
  public getSettingsPath(): string {
    return this.settingsPath;
  }
}

// Singleton instance
export const settingsManager = new SettingsManager();
