/**
 * Project Repository
 * Data access layer for project CRUD operations
 */

import type Database from 'better-sqlite3';
import type { Project, Repository, ProjectFormData } from '@shared/types';
import { logger } from '../../services/logger';
import { randomUUID } from 'crypto';

/**
 * ProjectRepository - Handles all database operations for projects
 */
export class ProjectRepository {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Create a new project
   * @param formData - Project creation data
   * @returns Created project
   */
  public create(formData: ProjectFormData): Project {
    const transaction = this.db.transaction((data: ProjectFormData) => {
      const projectId = randomUUID();
      const now = Date.now();

      // Insert project
      this.db
        .prepare(
          'INSERT INTO projects (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)'
        )
        .run(projectId, data.name, now, now);

      // Insert tags
      if (data.tags.length > 0) {
        const insertTag = this.db.prepare(
          'INSERT INTO project_tags (project_id, tag) VALUES (?, ?)'
        );

        for (const tag of data.tags) {
          insertTag.run(projectId, tag);
        }
      }

      // Insert repositories
      if (data.repositories.length > 0) {
        const insertRepo = this.db.prepare(
          `INSERT INTO project_repositories
           (id, project_id, name, url, default_branch, provider, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        );

        for (const repo of data.repositories) {
          const repoId = randomUUID();
          insertRepo.run(
            repoId,
            projectId,
            repo.name || null,
            repo.url,
            repo.defaultBranch || null,
            repo.provider || null,
            now
          );
        }
      }

      return projectId;
    });

    try {
      const projectId = transaction(formData);
      logger.info(`[ProjectRepository] Created project: ${projectId}`);

      // Fetch and return the complete project
      const project = this.findById(projectId);
      if (!project) {
        throw new Error('Failed to retrieve created project');
      }

      return project;
    } catch (error) {
      logger.error('[ProjectRepository] Failed to create project:', error);
      throw new Error(`Failed to create project: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Find all projects
   * @returns Array of all projects
   */
  public findAll(): Project[] {
    try {
      const projects = this.db
        .prepare('SELECT id, name, created_at, updated_at FROM projects ORDER BY created_at DESC')
        .all() as Array<{
        id: string;
        name: string;
        created_at: number;
        updated_at: number;
      }>;

      return projects.map((p) => this.hydrateProject(p));
    } catch (error) {
      logger.error('[ProjectRepository] Failed to find all projects:', error);
      throw new Error(`Failed to fetch projects: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Find project by ID
   * @param id - Project ID
   * @returns Project or null if not found
   */
  public findById(id: string): Project | null {
    try {
      const project = this.db
        .prepare('SELECT id, name, created_at, updated_at FROM projects WHERE id = ?')
        .get(id) as
        | {
            id: string;
            name: string;
            created_at: number;
            updated_at: number;
          }
        | undefined;

      if (!project) {
        return null;
      }

      return this.hydrateProject(project);
    } catch (error) {
      logger.error(`[ProjectRepository] Failed to find project ${id}:`, error);
      throw new Error(`Failed to fetch project: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Find project by name (case-insensitive)
   * @param name - Project name
   * @returns Project or null if not found
   */
  public findByName(name: string): Project | null {
    try {
      const project = this.db
        .prepare('SELECT id, name, created_at, updated_at FROM projects WHERE name = ? COLLATE NOCASE')
        .get(name) as
        | {
            id: string;
            name: string;
            created_at: number;
            updated_at: number;
          }
        | undefined;

      if (!project) {
        return null;
      }

      return this.hydrateProject(project);
    } catch (error) {
      logger.error(`[ProjectRepository] Failed to find project by name ${name}:`, error);
      throw new Error(`Failed to fetch project: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update project
   * @param id - Project ID
   * @param formData - Updated project data
   * @returns Updated project
   */
  public update(id: string, formData: Partial<ProjectFormData>): Project {
    const transaction = this.db.transaction((projectId: string, data: Partial<ProjectFormData>) => {
      const now = Date.now();

      // Update project name if provided
      if (data.name !== undefined) {
        this.db
          .prepare('UPDATE projects SET name = ?, updated_at = ? WHERE id = ?')
          .run(data.name, now, projectId);
      } else {
        // Just update timestamp
        this.db
          .prepare('UPDATE projects SET updated_at = ? WHERE id = ?')
          .run(now, projectId);
      }

      // Update tags if provided
      if (data.tags !== undefined) {
        // Delete existing tags
        this.db.prepare('DELETE FROM project_tags WHERE project_id = ?').run(projectId);

        // Insert new tags
        if (data.tags.length > 0) {
          const insertTag = this.db.prepare(
            'INSERT INTO project_tags (project_id, tag) VALUES (?, ?)'
          );

          for (const tag of data.tags) {
            insertTag.run(projectId, tag);
          }
        }
      }

      // Update repositories if provided
      if (data.repositories !== undefined) {
        // Delete existing repositories
        this.db.prepare('DELETE FROM project_repositories WHERE project_id = ?').run(projectId);

        // Insert new repositories
        if (data.repositories.length > 0) {
          const insertRepo = this.db.prepare(
            `INSERT INTO project_repositories
             (id, project_id, name, url, default_branch, provider, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
          );

          for (const repo of data.repositories) {
            const repoId = randomUUID();
            insertRepo.run(
              repoId,
              projectId,
              repo.name || null,
              repo.url,
              repo.defaultBranch || null,
              repo.provider || null,
              now
            );
          }
        }
      }
    });

    try {
      transaction(id, formData);
      logger.info(`[ProjectRepository] Updated project: ${id}`);

      // Fetch and return the updated project
      const project = this.findById(id);
      if (!project) {
        throw new Error('Project not found after update');
      }

      return project;
    } catch (error) {
      logger.error(`[ProjectRepository] Failed to update project ${id}:`, error);
      throw new Error(`Failed to update project: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Delete project
   * @param id - Project ID
   */
  public delete(id: string): void {
    try {
      const result = this.db.prepare('DELETE FROM projects WHERE id = ?').run(id);

      if (result.changes === 0) {
        throw new Error('Project not found');
      }

      logger.info(`[ProjectRepository] Deleted project: ${id}`);
    } catch (error) {
      logger.error(`[ProjectRepository] Failed to delete project ${id}:`, error);
      throw new Error(`Failed to delete project: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get active project ID
   * @returns Active project ID or null
   */
  public getActiveProjectId(): string | null {
    try {
      const row = this.db
        .prepare("SELECT value FROM app_metadata WHERE key = 'active_project_id'")
        .get() as { value: string } | undefined;

      if (!row || row.value === 'null') {
        return null;
      }

      return row.value;
    } catch (error) {
      logger.error('[ProjectRepository] Failed to get active project ID:', error);
      throw new Error(`Failed to get active project: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Set active project ID
   * @param id - Project ID or null to clear
   */
  public setActiveProjectId(id: string | null): void {
    try {
      const value = id || 'null';

      this.db
        .prepare("UPDATE app_metadata SET value = ? WHERE key = 'active_project_id'")
        .run(value);

      logger.info(`[ProjectRepository] Set active project: ${value}`);
    } catch (error) {
      logger.error('[ProjectRepository] Failed to set active project ID:', error);
      throw new Error(`Failed to set active project: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Hydrate project with tags and repositories
   * @private
   */
  private hydrateProject(projectRow: {
    id: string;
    name: string;
    created_at: number;
    updated_at: number;
  }): Project {
    // Fetch tags
    const tags = this.db
      .prepare('SELECT tag FROM project_tags WHERE project_id = ?')
      .all(projectRow.id) as Array<{ tag: string }>;

    // Fetch repositories
    const repos = this.db
      .prepare(
        `SELECT id, name, url, default_branch, provider, created_at
         FROM project_repositories
         WHERE project_id = ?
         ORDER BY created_at ASC`
      )
      .all(projectRow.id) as Array<{
      id: string;
      name: string | null;
      url: string;
      default_branch: string | null;
      provider: string | null;
      created_at: number;
    }>;

    const repositories: Repository[] = repos.map((r) => ({
      id: r.id,
      name: r.name || undefined,
      url: r.url,
      defaultBranch: r.default_branch || undefined,
      provider: (r.provider as Repository['provider']) || undefined,
    }));

    return {
      id: projectRow.id,
      name: projectRow.name,
      tags: tags.map((t) => t.tag),
      repositories,
      createdAt: projectRow.created_at,
      updatedAt: projectRow.updated_at,
    };
  }
}
