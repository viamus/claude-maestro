/**
 * Database Manager
 * Handles SQLite database connection and initialization
 */

import { app } from 'electron';
import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../services/logger';

/**
 * DatabaseManager - Singleton for managing SQLite database connection
 */
export class DatabaseManager {
  private static instance: DatabaseManager | null = null;
  private db: Database.Database | null = null;
  private dbPath: string;

  private constructor() {
    const userDataPath = app.getPath('userData');
    this.dbPath = path.join(userDataPath, 'projects.db');
    logger.info('[DatabaseManager] Database path:', this.dbPath);
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * Initialize database connection and schema
   */
  public initialize(): void {
    if (this.db) {
      logger.warn('[DatabaseManager] Database already initialized');
      return;
    }

    try {
      logger.info('[DatabaseManager] Initializing database...');

      // Create database connection
      this.db = new Database(this.dbPath);

      // Enable foreign keys (required for cascading deletes)
      this.db.pragma('foreign_keys = ON');

      // Enable WAL mode for better concurrency
      this.db.pragma('journal_mode = WAL');

      // Run schema initialization
      this.runSchema();

      logger.info('[DatabaseManager] Database initialized successfully');
    } catch (error) {
      logger.error('[DatabaseManager] Failed to initialize database:', error);
      throw new Error(`Database initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Run database schema from schema.sql file
   */
  private runSchema(): void {
    try {
      const schemaPath = path.join(__dirname, 'schema.sql');

      if (!fs.existsSync(schemaPath)) {
        throw new Error(`Schema file not found: ${schemaPath}`);
      }

      const schema = fs.readFileSync(schemaPath, 'utf-8');

      // Execute schema SQL
      this.db!.exec(schema);

      logger.info('[DatabaseManager] Schema executed successfully');
    } catch (error) {
      logger.error('[DatabaseManager] Failed to run schema:', error);
      throw error;
    }
  }

  /**
   * Get database instance
   * @throws Error if database is not initialized
   */
  public getDatabase(): Database.Database {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  /**
   * Close database connection
   */
  public close(): void {
    if (this.db) {
      try {
        this.db.close();
        this.db = null;
        logger.info('[DatabaseManager] Database connection closed');
      } catch (error) {
        logger.error('[DatabaseManager] Error closing database:', error);
        throw error;
      }
    }
  }

  /**
   * Run a migration (future use)
   * @param version - Schema version to migrate to
   */
  public runMigration(version: number): void {
    logger.info(`[DatabaseManager] Running migration to version ${version}`);

    // Get current schema version
    const currentVersion = this.getSchemaVersion();

    if (currentVersion >= version) {
      logger.info(`[DatabaseManager] Already at version ${currentVersion}, no migration needed`);
      return;
    }

    // Future: Load and execute migration scripts
    logger.warn('[DatabaseManager] Migration system not yet implemented');
  }

  /**
   * Get current schema version from metadata
   */
  private getSchemaVersion(): number {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const row = this.db
        .prepare('SELECT value FROM app_metadata WHERE key = ?')
        .get('schema_version') as { value: string } | undefined;

      return row ? parseInt(row.value, 10) : 0;
    } catch (error) {
      logger.error('[DatabaseManager] Error getting schema version:', error);
      return 0;
    }
  }

  /**
   * Reset singleton instance (for testing only)
   * @internal
   */
  public static resetInstance(): void {
    if (DatabaseManager.instance) {
      DatabaseManager.instance.close();
      DatabaseManager.instance = null;
    }
  }
}

/**
 * Singleton export
 */
export const databaseManager = DatabaseManager.getInstance();
