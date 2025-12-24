/**
 * Shared types used across main, preload, and renderer processes
 */

/**
 * Application settings structure
 */
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  windowBounds?: {
    width: number;
    height: number;
    x?: number;
    y?: number;
  };
  lastOpened?: string;
  sidebarCollapsed?: boolean;
}

/**
 * Default settings values
 */
export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  language: 'en',
  windowBounds: {
    width: 1200,
    height: 800,
  },
  sidebarCollapsed: false,
};

/**
 * IPC Response wrapper for consistent error handling
 */
export interface IPCResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Setting key type for type-safe settings access
 */
export type SettingKey = keyof AppSettings;

/**
 * App version info
 */
export interface AppVersion {
  app: string;
  electron: string;
  chrome: string;
  node: string;
}

/**
 * Navigation item definition
 */
export interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}

/**
 * UI Layout preferences
 */
export interface LayoutPreferences {
  sidebarCollapsed: boolean;
}
