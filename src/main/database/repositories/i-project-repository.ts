/**
 * IProjectRepository Interface
 * Defines the contract for project repository implementations
 */

import type { Project, ProjectFormData } from '@shared/types';

export interface IProjectRepository {
  /**
   * Create a new project
   */
  create(formData: ProjectFormData): Project;

  /**
   * Find all projects
   */
  findAll(): Project[];

  /**
   * Find project by ID
   */
  findById(id: string): Project | null;

  /**
   * Find project by name (case-insensitive)
   */
  findByName(name: string): Project | null;

  /**
   * Update project
   */
  update(id: string, formData: Partial<ProjectFormData>): Project;

  /**
   * Delete project
   */
  delete(id: string): void;

  /**
   * Get active project ID
   */
  getActiveProjectId(): string | null;

  /**
   * Set active project ID
   */
  setActiveProjectId(id: string | null): void;
}
