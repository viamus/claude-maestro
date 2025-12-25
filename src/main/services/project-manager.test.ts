/**
 * ProjectManager Tests (with mocked repository)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock electron app BEFORE any imports that use it
vi.mock('electron', () => ({
  app: {
    getPath: () => '.test-data-mock',
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

import { ProjectManager } from './project-manager';
import type { IProjectRepository } from '../database/repositories/i-project-repository';
import type { Project, ProjectFormData } from '@shared/types';

describe('ProjectManager', () => {
  let projectManager: ProjectManager;
  let mockRepository: IProjectRepository;
  const mockProjects = new Map<string, Project>();
  let activeProjectId: string | null = null;

  beforeEach(() => {
    // Clear mock data
    mockProjects.clear();
    activeProjectId = null;

    // Create mock repository
    mockRepository = {
      create: vi.fn((formData: ProjectFormData): Project => {
        const project: Project = {
          id: `mock-id-${Date.now()}-${Math.random()}`,
          name: formData.name,
          tags: formData.tags || [],
          repositories: formData.repositories || [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        mockProjects.set(project.id, project);
        return project;
      }),

      findAll: vi.fn((): Project[] => {
        return Array.from(mockProjects.values()).sort((a, b) => b.createdAt - a.createdAt);
      }),

      findById: vi.fn((id: string): Project | null => {
        return mockProjects.get(id) || null;
      }),

      findByName: vi.fn((name: string): Project | null => {
        const normalizedName = name.toLowerCase();
        for (const project of mockProjects.values()) {
          if (project.name.toLowerCase() === normalizedName) {
            return project;
          }
        }
        return null;
      }),

      update: vi.fn((id: string, formData: Partial<ProjectFormData>): Project => {
        const existing = mockProjects.get(id);
        if (!existing) {
          throw new Error('Project not found');
        }

        const updated: Project = {
          ...existing,
          name: formData.name !== undefined ? formData.name : existing.name,
          tags: formData.tags !== undefined ? formData.tags : existing.tags,
          repositories:
            formData.repositories !== undefined ? formData.repositories : existing.repositories,
          updatedAt: Date.now(),
        };

        mockProjects.set(id, updated);
        return updated;
      }),

      delete: vi.fn((id: string): void => {
        if (!mockProjects.has(id)) {
          throw new Error('Project not found');
        }
        mockProjects.delete(id);
      }),

      getActiveProjectId: vi.fn((): string | null => {
        return activeProjectId;
      }),

      setActiveProjectId: vi.fn((id: string | null): void => {
        activeProjectId = id;
      }),
    };

    // Create ProjectManager with mocked repository
    projectManager = new ProjectManager(mockRepository);
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
      expect(project.tags).toEqual(['typescript', 'electron']);
      expect(project.repositories).toHaveLength(1);
      expect(mockRepository.create).toHaveBeenCalledWith(formData);
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
        name: 'duplicate check project',
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
      const project2 = projectManager.createProject({
        name: 'Update Conflict B',
        tags: [],
        repositories: [],
      });

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
