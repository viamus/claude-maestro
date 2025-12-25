/**
 * ProjectRepository Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DatabaseManager } from '../db-manager';
import { ProjectRepository } from './project-repository';
import type { ProjectFormData } from '@shared/types';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock electron app
vi.mock('electron', () => ({
  app: {
    getPath: () => '.test-data-repo',
  },
}));

// Mock logger
vi.mock('../../services/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ProjectRepository', () => {
  let dbManager: DatabaseManager;
  let repository: ProjectRepository;
  const testDataPath = '.test-data-repo';

  beforeEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDataPath)) {
      fs.rmSync(testDataPath, { recursive: true, force: true });
    }
    fs.mkdirSync(testDataPath, { recursive: true });

    // Initialize database
    DatabaseManager.resetInstance();
    dbManager = DatabaseManager.getInstance();
    dbManager.initialize();

    // Create repository instance
    repository = new ProjectRepository(dbManager.getDatabase());
  });

  afterEach(() => {
    dbManager.close();
    if (fs.existsSync(testDataPath)) {
      fs.rmSync(testDataPath, { recursive: true, force: true });
    }
    DatabaseManager.resetInstance();
  });

  describe('create', () => {
    it('should create a project with all fields', () => {
      const formData: ProjectFormData = {
        name: 'Test Project',
        tags: ['typescript', 'electron'],
        repositories: [
          {
            name: 'Main Repo',
            url: 'https://github.com/user/repo',
            defaultBranch: 'main',
            provider: 'github',
          },
        ],
      };

      const project = repository.create(formData);

      expect(project.id).toBeDefined();
      expect(project.name).toBe('Test Project');
      expect(project.tags.sort()).toEqual(['electron', 'typescript']); // SQLite doesn't guarantee order
      expect(project.repositories).toHaveLength(1);
      expect(project.repositories[0].url).toBe('https://github.com/user/repo');
      expect(project.createdAt).toBeGreaterThan(0);
      expect(project.updatedAt).toBeGreaterThan(0);
    });

    it('should create a project without tags and repositories', () => {
      const formData: ProjectFormData = {
        name: 'Minimal Project',
        tags: [],
        repositories: [],
      };

      const project = repository.create(formData);

      expect(project.name).toBe('Minimal Project');
      expect(project.tags).toEqual([]);
      expect(project.repositories).toEqual([]);
    });

    it('should throw error on duplicate name (case-insensitive)', () => {
      const formData1: ProjectFormData = {
        name: 'Test Project',
        tags: [],
        repositories: [],
      };

      const formData2: ProjectFormData = {
        name: 'test project', // Same name, different case
        tags: [],
        repositories: [],
      };

      repository.create(formData1);

      expect(() => repository.create(formData2)).toThrow();
    });
  });

  describe('findAll', () => {
    it('should return empty array when no projects exist', () => {
      const projects = repository.findAll();
      expect(projects).toEqual([]);
    });

    it('should return all projects ordered by creation date (newest first)', async () => {
      const project1 = repository.create({
        name: 'Project 1',
        tags: [],
        repositories: [],
      });

      // Wait 50ms to ensure different timestamp even on fast machines
      await new Promise((resolve) => setTimeout(resolve, 50));

      const project2 = repository.create({
        name: 'Project 2',
        tags: [],
        repositories: [],
      });

      const projects = repository.findAll();

      expect(projects).toHaveLength(2);
      // Verify order by comparing timestamps directly
      expect(projects[0].createdAt).toBeGreaterThan(projects[1].createdAt);
      // Verify names match expected order
      expect(projects[0].name).toBe('Project 2'); // Newest first
      expect(projects[1].name).toBe('Project 1');
    });

    it('should include tags and repositories in returned projects', () => {
      repository.create({
        name: 'Full Project',
        tags: ['tag1', 'tag2'],
        repositories: [{ url: 'https://example.com/repo' }],
      });

      const projects = repository.findAll();

      expect(projects[0].tags.sort()).toEqual(['tag1', 'tag2']);
      expect(projects[0].repositories).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('should return project when found', () => {
      const created = repository.create({
        name: 'Test Project',
        tags: ['test'],
        repositories: [],
      });

      const found = repository.findById(created.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe('Test Project');
      expect(found?.tags).toEqual(['test']);
    });

    it('should return null when project not found', () => {
      const found = repository.findById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('findByName', () => {
    it('should find project by exact name', () => {
      const created = repository.create({
        name: 'Exact Name',
        tags: [],
        repositories: [],
      });

      const found = repository.findByName('Exact Name');

      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
    });

    it('should find project by name (case-insensitive)', () => {
      repository.create({
        name: 'CamelCase',
        tags: [],
        repositories: [],
      });

      const found1 = repository.findByName('camelcase');
      const found2 = repository.findByName('CAMELCASE');
      const found3 = repository.findByName('CamelCase');

      expect(found1).not.toBeNull();
      expect(found2).not.toBeNull();
      expect(found3).not.toBeNull();
      expect(found1?.name).toBe('CamelCase');
    });

    it('should return null when name not found', () => {
      const found = repository.findByName('Non Existent');
      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    it('should update project name', async () => {
      const created = repository.create({
        name: 'Original Name',
        tags: [],
        repositories: [],
      });

      // Wait 50ms to ensure timestamp difference even on fast machines
      await new Promise((resolve) => setTimeout(resolve, 50));

      const updated = repository.update(created.id, { name: 'New Name' });

      expect(updated.name).toBe('New Name');
      // Verify timestamp was updated
      expect(updated.updatedAt).toBeGreaterThan(created.updatedAt);
    });

    it('should update tags', () => {
      const created = repository.create({
        name: 'Test',
        tags: ['old'],
        repositories: [],
      });

      const updated = repository.update(created.id, { tags: ['new1', 'new2'] });

      expect(updated.tags).toEqual(['new1', 'new2']);
    });

    it('should update repositories', () => {
      const created = repository.create({
        name: 'Test',
        tags: [],
        repositories: [{ url: 'https://old.com' }],
      });

      const updated = repository.update(created.id, {
        repositories: [{ url: 'https://new.com', provider: 'github' }],
      });

      expect(updated.repositories).toHaveLength(1);
      expect(updated.repositories[0].url).toBe('https://new.com');
    });

    it('should update only provided fields', () => {
      const created = repository.create({
        name: 'Test',
        tags: ['tag1'],
        repositories: [{ url: 'https://repo.com' }],
      });

      const updated = repository.update(created.id, { tags: ['tag2'] });

      expect(updated.name).toBe('Test'); // Unchanged
      expect(updated.tags).toEqual(['tag2']); // Changed
      expect(updated.repositories).toHaveLength(1); // Unchanged
    });

    it('should throw error when updating non-existent project', () => {
      expect(() => {
        repository.update('non-existent-id', { name: 'New Name' });
      }).toThrow();
    });
  });

  describe('delete', () => {
    it('should delete existing project', () => {
      const created = repository.create({
        name: 'To Delete',
        tags: [],
        repositories: [],
      });

      repository.delete(created.id);

      const found = repository.findById(created.id);
      expect(found).toBeNull();
    });

    it('should cascade delete tags and repositories', () => {
      const created = repository.create({
        name: 'With Relations',
        tags: ['tag1'],
        repositories: [{ url: 'https://repo.com' }],
      });

      repository.delete(created.id);

      // Verify tags are deleted
      const tags = dbManager
        .getDatabase()
        .prepare('SELECT * FROM project_tags WHERE project_id = ?')
        .all(created.id);
      expect(tags).toHaveLength(0);

      // Verify repositories are deleted
      const repos = dbManager
        .getDatabase()
        .prepare('SELECT * FROM project_repositories WHERE project_id = ?')
        .all(created.id);
      expect(repos).toHaveLength(0);
    });

    it('should throw error when deleting non-existent project', () => {
      expect(() => {
        repository.delete('non-existent-id');
      }).toThrow('Project not found');
    });
  });

  describe('Active Project Management', () => {
    it('should return null when no active project is set', () => {
      const activeId = repository.getActiveProjectId();
      expect(activeId).toBeNull();
    });

    it('should set and get active project ID', () => {
      const project = repository.create({
        name: 'Active Project',
        tags: [],
        repositories: [],
      });

      repository.setActiveProjectId(project.id);

      const activeId = repository.getActiveProjectId();
      expect(activeId).toBe(project.id);
    });

    it('should clear active project when set to null', () => {
      const project = repository.create({
        name: 'Test',
        tags: [],
        repositories: [],
      });

      repository.setActiveProjectId(project.id);
      repository.setActiveProjectId(null);

      const activeId = repository.getActiveProjectId();
      expect(activeId).toBeNull();
    });
  });
});
