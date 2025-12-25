/**
 * ProjectManager Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DatabaseManager } from '../database/db-manager';
import { ProjectManager } from './project-manager';
import type { ProjectFormData } from '@shared/types';
import * as fs from 'fs';
import * as path from 'path';

// Mock electron app
vi.mock('electron', () => ({
  app: {
    getPath: () => '.test-data-manager',
  },
}));

// Mock logger
vi.mock('./logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ProjectManager', () => {
  let projectManager: ProjectManager;
  const testDataPath = '.test-data-manager';

  beforeEach(() => {
    // Ensure test data directory exists
    if (!fs.existsSync(testDataPath)) {
      fs.mkdirSync(testDataPath, { recursive: true });
    }

    // Ensure clean state - reset singleton
    DatabaseManager.resetInstance();

    // Initialize database manager and clean any existing data
    const dbManager = DatabaseManager.getInstance();
    dbManager.initialize();
    const db = dbManager.getDatabase();

    // Clean all data from previous tests
    db.exec('DELETE FROM project_repositories');
    db.exec('DELETE FROM project_tags');
    db.exec('DELETE FROM projects');
    db.exec("UPDATE app_metadata SET value = 'null' WHERE key = 'active_project_id'");

    // Force WAL checkpoint to persist deletes
    db.pragma('wal_checkpoint(TRUNCATE)');

    // Close and reset for the test to use fresh
    dbManager.close();
    DatabaseManager.resetInstance();

    // Create new project manager (will initialize DB on first use)
    projectManager = new ProjectManager();
  });

  afterEach(() => {
    // Reset project manager repository FIRST (releases its reference)
    projectManager.resetRepository();

    // Clean database data BEFORE closing (but don't delete files - they're locked on Windows)
    try {
      const dbManager = DatabaseManager.getInstance();
      const db = dbManager.getDatabase();

      // Force WAL checkpoint to ensure ALL pending writes are committed
      db.pragma('wal_checkpoint(TRUNCATE)');

      // Delete in correct order to avoid foreign key constraints
      db.prepare('DELETE FROM project_repositories').run();
      db.prepare('DELETE FROM project_tags').run();
      db.prepare('DELETE FROM projects').run();
      db.prepare("UPDATE app_metadata SET value = ? WHERE key = ?").run('null', 'active_project_id');

      // Force another checkpoint to flush deletes
      db.pragma('wal_checkpoint(FULL)');

      // Verify cleanup worked
      const remaining = db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number };
      if (remaining.count > 0) {
        console.warn(`⚠️  afterEach cleanup failed - ${remaining.count} projects still remain!`);
      }
    } catch (error) {
      // Database might not be initialized for tests that only check validation
    }

    // Close database connection
    try {
      DatabaseManager.getInstance().close();
    } catch (error) {
      // Ignore errors if database wasn't initialized
    }

    // Reset database instance for next test
    DatabaseManager.resetInstance();
  });

  afterAll(() => {
    // Clean up test data after ALL tests complete
    try {
      // Close database first
      try {
        DatabaseManager.getInstance().close();
      } catch (error) {
        // Ignore
      }

      // Wait a bit for file handles to release
      const start = Date.now();
      while (Date.now() - start < 100) {
        // Busy wait
      }

      if (fs.existsSync(testDataPath)) {
        fs.rmSync(testDataPath, { recursive: true, force: true });
      }
    } catch (error) {
      // Ignore cleanup errors - files will remain in test directory
    }
  });

  describe('createProject', () => {
    it('should create a valid project', () => {
      const formData: ProjectFormData = {
        name: 'Test Project',
        tags: ['typescript', 'electron'],
        repositories: [{ url: 'https://github.com/user/repo' }],
      };

      const project = projectManager.createProject(formData);

      expect(project.id).toBeDefined();
      expect(project.name).toBe('Test Project');
      expect(project.tags.sort()).toEqual(['electron', 'typescript']); // SQLite doesn't guarantee tag order
      expect(project.repositories).toHaveLength(1);
    });

    it('should throw error if name is empty', () => {
      const formData: ProjectFormData = {
        name: '',
        tags: [],
        repositories: [],
      };

      expect(() => projectManager.createProject(formData)).toThrow('Validation failed');
      expect(() => projectManager.createProject(formData)).toThrow('name is required');
    });

    it('should throw error if name is only whitespace', () => {
      const formData: ProjectFormData = {
        name: '   ',
        tags: [],
        repositories: [],
      };

      expect(() => projectManager.createProject(formData)).toThrow('name is required');
    });

    it('should throw error if name is too long', () => {
      const formData: ProjectFormData = {
        name: 'a'.repeat(256),
        tags: [],
        repositories: [],
      };

      expect(() => projectManager.createProject(formData)).toThrow('255 characters or less');
    });

    it('should throw error if name already exists (case-insensitive)', () => {
      const formData1: ProjectFormData = {
        name: 'Duplicate Check Project',
        tags: [],
        repositories: [],
      };

      const formData2: ProjectFormData = {
        name: 'duplicate check project', // Same name, different case
        tags: [],
        repositories: [],
      };

      projectManager.createProject(formData1);

      expect(() => projectManager.createProject(formData2)).toThrow('already exists');
    });

    it('should throw error if repository URL is missing', () => {
      const formData: ProjectFormData = {
        name: 'Repo URL Test Project',
        tags: [],
        repositories: [{ url: '' }],
      };

      expect(() => projectManager.createProject(formData)).toThrow('URL is required');
    });

    it('should throw error if tags contain non-string values', () => {
      const formData = {
        name: 'Tags Validation Project',
        tags: ['valid', 123] as unknown as string[],
        repositories: [],
      };

      expect(() => projectManager.createProject(formData)).toThrow('Validation failed');
    });
  });

  describe('getAllProjects', () => {
    it('should return empty array when no projects exist', () => {
      const projects = projectManager.getAllProjects();
      expect(projects).toEqual([]);
    });

    it('should return all created projects', () => {
      projectManager.createProject({ name: 'GetAll Test 1', tags: [], repositories: [] });
      projectManager.createProject({ name: 'GetAll Test 2', tags: [], repositories: [] });

      const projects = projectManager.getAllProjects();

      expect(projects).toHaveLength(2);
    });
  });

  describe('getProjectById', () => {
    it('should return project when found', () => {
      const created = projectManager.createProject({
        name: 'Find By ID Project',
        tags: [],
        repositories: [],
      });

      const found = projectManager.getProjectById(created.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
    });

    it('should return null when project not found', () => {
      const found = projectManager.getProjectById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('updateProject', () => {
    it('should update project name', () => {
      const created = projectManager.createProject({
        name: 'Original',
        tags: [],
        repositories: [],
      });

      const updated = projectManager.updateProject(created.id, { name: 'Updated' });

      expect(updated.name).toBe('Updated');
    });

    it('should update project tags', () => {
      const created = projectManager.createProject({
        name: 'Update Tags Project',
        tags: ['old'],
        repositories: [],
      });

      const updated = projectManager.updateProject(created.id, { tags: ['new1', 'new2'] });

      expect(updated.tags).toEqual(['new1', 'new2']);
    });

    it('should throw error if project not found', () => {
      expect(() => {
        projectManager.updateProject('non-existent-id', { name: 'New' });
      }).toThrow('Project not found');
    });

    it('should throw error if new name already exists', () => {
      projectManager.createProject({ name: 'Update Conflict A', tags: [], repositories: [] });
      const project2 = projectManager.createProject({ name: 'Update Conflict B', tags: [], repositories: [] });

      expect(() => {
        projectManager.updateProject(project2.id, { name: 'Update Conflict A' });
      }).toThrow('already exists');
    });

    it('should allow updating project with same name (case change)', () => {
      const created = projectManager.createProject({
        name: 'lowercase',
        tags: [],
        repositories: [],
      });

      const updated = projectManager.updateProject(created.id, { name: 'LOWERCASE' });

      expect(updated.name).toBe('LOWERCASE');
    });

    it('should validate updated data', () => {
      const created = projectManager.createProject({
        name: 'Validation Update Project',
        tags: [],
        repositories: [],
      });

      expect(() => {
        projectManager.updateProject(created.id, { name: '' });
      }).toThrow('name is required');
    });
  });

  describe('deleteProject', () => {
    it('should delete existing project', () => {
      const created = projectManager.createProject({
        name: 'To Delete',
        tags: [],
        repositories: [],
      });

      projectManager.deleteProject(created.id);

      const found = projectManager.getProjectById(created.id);
      expect(found).toBeNull();
    });

    it('should throw error when deleting non-existent project', () => {
      expect(() => {
        projectManager.deleteProject('non-existent-id');
      }).toThrow('Project not found');
    });

    it('should clear active project when deleting active project', () => {
      const created = projectManager.createProject({
        name: 'Active',
        tags: [],
        repositories: [],
      });

      projectManager.setActiveProjectId(created.id);
      projectManager.deleteProject(created.id);

      const activeId = projectManager.getActiveProjectId();
      expect(activeId).toBeNull();
    });
  });

  describe('Active Project Management', () => {
    it('should return null when no active project is set', () => {
      const activeId = projectManager.getActiveProjectId();
      expect(activeId).toBeNull();
    });

    it('should set and get active project', () => {
      const project = projectManager.createProject({
        name: 'Active Project',
        tags: [],
        repositories: [],
      });

      projectManager.setActiveProjectId(project.id);

      const activeId = projectManager.getActiveProjectId();
      expect(activeId).toBe(project.id);
    });

    it('should clear active project when set to null', () => {
      const project = projectManager.createProject({
        name: 'Clear Active Project',
        tags: [],
        repositories: [],
      });

      projectManager.setActiveProjectId(project.id);
      projectManager.setActiveProjectId(null);

      const activeId = projectManager.getActiveProjectId();
      expect(activeId).toBeNull();
    });

    it('should throw error when setting non-existent project as active', () => {
      expect(() => {
        projectManager.setActiveProjectId('non-existent-id');
      }).toThrow('Project not found');
    });
  });

  describe('Validation Edge Cases', () => {
    it('should handle special characters in project name', () => {
      const formData: ProjectFormData = {
        name: 'Project-Name_123 (Test)',
        tags: [],
        repositories: [],
      };

      const project = projectManager.createProject(formData);
      expect(project.name).toBe('Project-Name_123 (Test)');
    });

    it('should handle empty tags array', () => {
      const formData: ProjectFormData = {
        name: 'Empty Tags Project',
        tags: [],
        repositories: [],
      };

      const project = projectManager.createProject(formData);
      expect(project.tags).toEqual([]);
    });

    it('should handle empty repositories array', () => {
      const formData: ProjectFormData = {
        name: 'Empty Repos Project',
        tags: [],
        repositories: [],
      };

      const project = projectManager.createProject(formData);
      expect(project.repositories).toEqual([]);
    });
  });
});
