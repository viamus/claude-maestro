/**
 * Project Manager Service
 * Business logic layer for project management
 */

import type { Project, ProjectFormData, ValidationError } from '@shared/types';
import { databaseManager } from '../database/db-manager';
import { ProjectRepository } from '../database/repositories/project-repository';
import { logger } from './logger';

/**
 * ProjectManager - Manages project CRUD operations and business logic
 */
export class ProjectManager {
  private repository: ProjectRepository | null = null;

  constructor() {
    // Repository will be initialized on first use
  }

  /**
   * Get or initialize repository
   * @private
   */
  private getRepository(): ProjectRepository {
    if (!this.repository) {
      // Initialize database if not already done
      try {
        databaseManager.initialize();
      } catch (error) {
        // Database might already be initialized, ignore
      }

      this.repository = new ProjectRepository(databaseManager.getDatabase());
    }

    return this.repository;
  }

  /**
   * Create a new project
   * @param formData - Project creation data
   * @returns Created project
   * @throws Error if validation fails or creation fails
   */
  public createProject(formData: ProjectFormData): Project {
    const repository = this.getRepository();

    // Validate input
    const errors = this.validateProjectData(formData);
    if (errors.length > 0) {
      const errorMessages = errors.map((e) => `${e.field}: ${e.message}`).join(', ');
      throw new Error(`Validation failed: ${errorMessages}`);
    }

    // Check for duplicate name
    const existing = repository.findByName(formData.name);
    if (existing) {
      throw new Error(`Project with name "${formData.name}" already exists`);
    }

    // Create project
    try {
      const project = repository.create(formData);
      logger.info(`[ProjectManager] Created project: ${project.name} (${project.id})`);
      return project;
    } catch (error) {
      logger.error('[ProjectManager] Failed to create project:', error);
      throw error;
    }
  }

  /**
   * Get all projects
   * @returns Array of all projects
   */
  public getAllProjects(): Project[] {
    const repository = this.getRepository();
    try {
      return repository.findAll();
    } catch (error) {
      logger.error('[ProjectManager] Failed to get all projects:', error);
      throw error;
    }
  }

  /**
   * Get project by ID
   * @param id - Project ID
   * @returns Project or null if not found
   */
  public getProjectById(id: string): Project | null {
    const repository = this.getRepository();
    try {
      return repository.findById(id);
    } catch (error) {
      logger.error(`[ProjectManager] Failed to get project ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update project
   * @param id - Project ID
   * @param formData - Updated project data
   * @returns Updated project
   * @throws Error if validation fails or project not found
   */
  public updateProject(id: string, formData: Partial<ProjectFormData>): Project {
    const repository = this.getRepository();

    // Validate input
    const errors = this.validateProjectData(formData, id);
    if (errors.length > 0) {
      const errorMessages = errors.map((e) => `${e.field}: ${e.message}`).join(', ');
      throw new Error(`Validation failed: ${errorMessages}`);
    }

    // Check if project exists
    const existing = repository.findById(id);
    if (!existing) {
      throw new Error(`Project not found: ${id}`);
    }

    // Check for duplicate name (if name is being changed)
    if (formData.name && formData.name !== existing.name) {
      const duplicate = repository.findByName(formData.name);
      if (duplicate && duplicate.id !== id) {
        throw new Error(`Project with name "${formData.name}" already exists`);
      }
    }

    // Update project
    try {
      const project = repository.update(id, formData);
      logger.info(`[ProjectManager] Updated project: ${project.name} (${project.id})`);
      return project;
    } catch (error) {
      logger.error(`[ProjectManager] Failed to update project ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete project
   * @param id - Project ID
   * @throws Error if project not found
   */
  public deleteProject(id: string): void {
    const repository = this.getRepository();

    // Check if project exists
    const existing = repository.findById(id);
    if (!existing) {
      throw new Error(`Project not found: ${id}`);
    }

    // Clear active project if deleting the active one
    const activeId = repository.getActiveProjectId();
    if (activeId === id) {
      repository.setActiveProjectId(null);
      logger.info(`[ProjectManager] Cleared active project (deleted project was active)`);
    }

    // Delete project
    try {
      repository.delete(id);
      logger.info(`[ProjectManager] Deleted project: ${existing.name} (${id})`);
    } catch (error) {
      logger.error(`[ProjectManager] Failed to delete project ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get active project ID
   * @returns Active project ID or null
   */
  public getActiveProjectId(): string | null {
    const repository = this.getRepository();
    try {
      return repository.getActiveProjectId();
    } catch (error) {
      logger.error('[ProjectManager] Failed to get active project ID:', error);
      throw error;
    }
  }

  /**
   * Set active project
   * @param id - Project ID or null to clear
   * @throws Error if project not found (when id is not null)
   */
  public setActiveProjectId(id: string | null): void {
    const repository = this.getRepository();

    // Validate that project exists if id is provided
    if (id !== null) {
      const project = repository.findById(id);
      if (!project) {
        throw new Error(`Project not found: ${id}`);
      }
    }

    try {
      repository.setActiveProjectId(id);
      logger.info(`[ProjectManager] Set active project: ${id || 'null'}`);
    } catch (error) {
      logger.error('[ProjectManager] Failed to set active project:', error);
      throw error;
    }
  }

  /**
   * Reset repository (for testing only)
   * @internal
   */
  public resetRepository(): void {
    this.repository = null;
  }

  /**
   * Validate project data
   * @private
   */
  private validateProjectData(
    data: Partial<ProjectFormData>,
    _excludeId?: string
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate name
    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        errors.push({ field: 'name', message: 'Project name is required' });
      } else if (data.name.length > 255) {
        errors.push({ field: 'name', message: 'Project name must be 255 characters or less' });
      }
    }

    // Validate tags
    if (data.tags !== undefined) {
      if (!Array.isArray(data.tags)) {
        errors.push({ field: 'tags', message: 'Tags must be an array' });
      } else {
        for (let i = 0; i < data.tags.length; i++) {
          const tag = data.tags[i];
          if (typeof tag !== 'string' || tag.trim().length === 0) {
            errors.push({ field: `tags[${i}]`, message: 'Tag must be a non-empty string' });
          }
        }
      }
    }

    // Validate repositories
    if (data.repositories !== undefined) {
      if (!Array.isArray(data.repositories)) {
        errors.push({ field: 'repositories', message: 'Repositories must be an array' });
      } else {
        for (let i = 0; i < data.repositories.length; i++) {
          const repo = data.repositories[i];
          if (!repo.url || repo.url.trim().length === 0) {
            errors.push({ field: `repositories[${i}].url`, message: 'Repository URL is required' });
          }
        }
      }
    }

    return errors;
  }
}

/**
 * Singleton export
 */
export const projectManager = new ProjectManager();
