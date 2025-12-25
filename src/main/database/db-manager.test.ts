/**
 * DatabaseManager Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DatabaseManager } from './db-manager';
import * as fs from 'fs';
import * as path from 'path';

// Mock electron app
vi.mock('electron', () => ({
  app: {
    getPath: () => '.test-data',
  },
}));

// Mock logger
vi.mock('../services/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('DatabaseManager', () => {
  let dbManager: DatabaseManager;
  const testDataPath = '.test-data';
  const testDbPath = path.join(testDataPath, 'projects.db');

  beforeEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDataPath)) {
      fs.rmSync(testDataPath, { recursive: true, force: true });
    }
    fs.mkdirSync(testDataPath, { recursive: true });

    // Reset singleton
    DatabaseManager.resetInstance();
    dbManager = DatabaseManager.getInstance();
  });

  afterEach(() => {
    // Close database and clean up
    try {
      dbManager.close();
    } catch (error) {
      // Ignore errors during cleanup
    }

    if (fs.existsSync(testDataPath)) {
      fs.rmSync(testDataPath, { recursive: true, force: true });
    }

    DatabaseManager.resetInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = DatabaseManager.getInstance();
      const instance2 = DatabaseManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should reset instance when resetInstance is called', () => {
      const instance1 = DatabaseManager.getInstance();
      DatabaseManager.resetInstance();
      const instance2 = DatabaseManager.getInstance();
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('Database Initialization', () => {
    it('should create database file on initialization', () => {
      dbManager.initialize();
      expect(fs.existsSync(testDbPath)).toBe(true);
    });

    it('should create all tables from schema', () => {
      dbManager.initialize();
      const db = dbManager.getDatabase();

      // Check if tables exist
      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table'")
        .all() as { name: string }[];

      const tableNames = tables.map((t) => t.name);

      expect(tableNames).toContain('projects');
      expect(tableNames).toContain('project_tags');
      expect(tableNames).toContain('project_repositories');
      expect(tableNames).toContain('app_metadata');
    });

    it('should initialize metadata with default values', () => {
      dbManager.initialize();
      const db = dbManager.getDatabase();

      const schemaVersion = db
        .prepare("SELECT value FROM app_metadata WHERE key = 'schema_version'")
        .get() as { value: string } | undefined;

      const activeProjectId = db
        .prepare("SELECT value FROM app_metadata WHERE key = 'active_project_id'")
        .get() as { value: string } | undefined;

      expect(schemaVersion?.value).toBe('1');
      expect(activeProjectId?.value).toBe('null');
    });

    it('should enable foreign keys', () => {
      dbManager.initialize();
      const db = dbManager.getDatabase();

      const foreignKeys = db
        .prepare('PRAGMA foreign_keys')
        .get() as { foreign_keys: number };

      expect(foreignKeys.foreign_keys).toBe(1);
    });

    it('should set WAL journal mode', () => {
      dbManager.initialize();
      const db = dbManager.getDatabase();

      const journalMode = db
        .prepare('PRAGMA journal_mode')
        .get() as { journal_mode: string };

      expect(journalMode.journal_mode.toLowerCase()).toBe('wal');
    });

    it('should warn if initialize is called twice', async () => {
      dbManager.initialize();
      dbManager.initialize();

      const { logger } = await import('../services/logger');
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('already initialized')
      );
    });

    it('should throw error if schema file is missing', () => {
      const schemaPath = path.join('src', 'main', 'database', 'schema.sql');
      const schemaBackup = path.join('src', 'main', 'database', 'schema.sql.bak');

      // Clean up any leftover backup
      if (fs.existsSync(schemaBackup)) {
        fs.unlinkSync(schemaBackup);
      }

      // Only run test if schema exists
      if (!fs.existsSync(schemaPath)) {
        // Schema already missing, skip test
        return;
      }

      // Backup schema
      fs.renameSync(schemaPath, schemaBackup);

      try {
        expect(() => dbManager.initialize()).toThrow('Schema file not found');
      } finally {
        // Always restore schema file
        if (fs.existsSync(schemaBackup)) {
          fs.renameSync(schemaBackup, schemaPath);
        }
      }

      // Verify schema was restored
      expect(fs.existsSync(schemaPath)).toBe(true);
    });
  });

  describe('Database Operations', () => {
    beforeEach(() => {
      dbManager.initialize();
    });

    it('should return database instance after initialization', () => {
      const db = dbManager.getDatabase();
      expect(db).toBeDefined();
      expect(typeof db.prepare).toBe('function');
    });

    it('should throw error when getting database before initialization', () => {
      DatabaseManager.resetInstance();
      const newManager = DatabaseManager.getInstance();
      expect(() => newManager.getDatabase()).toThrow('Database not initialized');
    });

    it('should close database connection', () => {
      const db = dbManager.getDatabase();
      expect(db.open).toBe(true);

      dbManager.close();
      expect(db.open).toBe(false);
    });

    it('should allow closing database multiple times', () => {
      dbManager.close();
      expect(() => dbManager.close()).not.toThrow();
    });
  });

  describe('Migrations', () => {
    beforeEach(() => {
      dbManager.initialize();
    });

    it('should skip migration if already at version', async () => {
      // Current schema version is 1
      dbManager.runMigration(1);

      const { logger } = await import('../services/logger');
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('no migration needed')
      );
    });

    it('should warn that migration system is not implemented', async () => {
      dbManager.runMigration(2);

      const { logger } = await import('../services/logger');
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('not yet implemented')
      );
    });
  });
});
