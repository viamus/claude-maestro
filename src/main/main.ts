/**
 * Electron Main Process
 * Entry point for the main process - handles window creation, lifecycle, and IPC
 */

import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { logger } from './services/logger';
import { settingsManager } from './services/settings-manager';
import { databaseManager } from './database/db-manager';
import { registerIPCHandlers, unregisterIPCHandlers } from './ipc-handlers';

// Keep a global reference to prevent garbage collection
// @ts-expect-error - Variable is used to prevent garbage collection
let _mainWindow: BrowserWindow | null = null;

// Determine if running in development mode
const isDev = process.env.NODE_ENV === 'development';
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

/**
 * Create the main application window
 */
function createMainWindow(): BrowserWindow {
  logger.info('Creating main window');

  // Get saved window bounds or use defaults
  const savedBounds = settingsManager.get('windowBounds');

  const window = new BrowserWindow({
    width: savedBounds?.width ?? 1200,
    height: savedBounds?.height ?? 800,
    x: savedBounds?.x,
    y: savedBounds?.y,
    minWidth: 800,
    minHeight: 600,
    show: false, // Show after ready-to-show event
    backgroundColor: '#ffffff',
    webPreferences: {
      // Security settings
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,

      // Preload script
      preload: path.join(__dirname, '../../preload/preload/preload.js'),
    },
  });

  // Show window when ready to prevent flickering
  window.once('ready-to-show', () => {
    logger.info('Window ready to show');
    window.show();
  });

  // Save window bounds on close
  window.on('close', () => {
    if (!window.isMaximized() && !window.isMinimized()) {
      const bounds = window.getBounds();
      settingsManager.set('windowBounds', {
        width: bounds.width,
        height: bounds.height,
        x: bounds.x,
        y: bounds.y,
      });
    }
  });

  // Load the app
  if (isDev && VITE_DEV_SERVER_URL) {
    logger.info(`Loading dev server: ${VITE_DEV_SERVER_URL}`);
    window.loadURL(VITE_DEV_SERVER_URL);
    window.webContents.openDevTools();
  } else {
    logger.info('Loading production build');
    const indexPath = path.join(__dirname, '../renderer/index.html');
    window.loadFile(indexPath);
  }

  // Log navigation errors
  window.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    logger.error(`Failed to load: ${errorCode} - ${errorDescription}`);
  });

  return window;
}

/**
 * App ready handler - initialize everything
 */
app.whenReady().then(() => {
  logger.info('App is ready');

  // Initialize database
  try {
    databaseManager.initialize();
    logger.info('Database initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize database', error);
    // Continue anyway - database will be initialized on first use
  }

  // Register IPC handlers
  registerIPCHandlers();

  // Create main window
  _mainWindow = createMainWindow();

  // macOS: Re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      logger.info('Re-creating window on activate (macOS)');
      _mainWindow = createMainWindow();
    }
  });

  logger.info('Application initialized successfully');
});

/**
 * All windows closed handler
 */
app.on('window-all-closed', () => {
  logger.info('All windows closed');

  // On macOS, keep app running until explicit quit
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * Before quit handler - cleanup
 */
app.on('before-quit', () => {
  logger.info('Application quitting');
  unregisterIPCHandlers();

  // Close database connection
  try {
    databaseManager.close();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database', error);
  }
});

/**
 * Handle uncaught errors
 */
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', error);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', reason);
});
