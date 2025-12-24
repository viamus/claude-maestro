/**
 * Logger Service - Centralized logging with file and console output
 * Uses electron-log for automatic file rotation and structured logging
 */

import log from 'electron-log';
import { app } from 'electron';
import * as path from 'path';

/**
 * Configure electron-log
 */
function configureLogger(): void {
  // Set log file location
  const logPath = path.join(app.getPath('userData'), 'logs');
  log.transports.file.resolvePathFn = () => path.join(logPath, 'main.log');

  // File transport settings
  log.transports.file.level = 'info';
  log.transports.file.maxSize = 5 * 1024 * 1024; // 5MB
  log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';

  // Console transport settings
  log.transports.console.level = 'debug';
  log.transports.console.format = '[{h}:{i}:{s}.{ms}] [{level}] {text}';

  // Add context
  log.info('='.repeat(80));
  log.info('Application started');
  log.info(`App version: ${app.getVersion()}`);
  log.info(`Electron version: ${process.versions.electron}`);
  log.info(`Node version: ${process.versions.node}`);
  log.info(`Platform: ${process.platform}`);
  log.info(`Logs location: ${logPath}`);
  log.info('='.repeat(80));
}

// Initialize on import
configureLogger();

/**
 * Logger interface for type safety and convenience
 */
export const logger = {
  /**
   * Log informational message
   */
  info: (message: string, ...args: unknown[]): void => {
    log.info(message, ...args);
  },

  /**
   * Log warning message
   */
  warn: (message: string, ...args: unknown[]): void => {
    log.warn(message, ...args);
  },

  /**
   * Log error message
   */
  error: (message: string, error?: unknown, ...args: unknown[]): void => {
    if (error instanceof Error) {
      log.error(message, error.message, error.stack, ...args);
    } else {
      log.error(message, error, ...args);
    }
  },

  /**
   * Log debug message (only in console)
   */
  debug: (message: string, ...args: unknown[]): void => {
    log.debug(message, ...args);
  },

  /**
   * Get log file path
   */
  getLogPath: (): string => {
    return log.transports.file.getFile().path;
  },
};

export default logger;
