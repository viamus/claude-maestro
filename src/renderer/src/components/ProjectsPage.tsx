/**
 * ProjectsPage Component
 *
 * Displays list of all projects with ability to create, edit, and delete.
 */

import { useState, useEffect } from 'react';
import { IPC_CHANNELS } from '@shared/ipc-channels';
import type { Project } from '@shared/types';
import { NewProjectModal } from './NewProjectModal';
import './ProjectsPage.css';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string>('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await window.api.invoke(IPC_CHANNELS.PROJECT_GET_ALL);

      if (response.success) {
        setProjects(response.data);
      } else {
        setError(response.error || 'Failed to load projects');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      const response = await window.api.invoke(IPC_CHANNELS.PROJECT_DELETE, id);

      if (response.success) {
        await loadProjects();
      } else {
        alert(`Failed to delete project: ${response.error}`);
      }
    } catch (err) {
      alert(`Error deleting project: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleSetActiveProject = async (id: string | null) => {
    try {
      const response = await window.api.invoke(IPC_CHANNELS.PROJECT_SET_ACTIVE, id);

      if (response.success) {
        await loadProjects();
      } else {
        alert(`Failed to set active project: ${response.error}`);
      }
    } catch (err) {
      alert(`Error setting active project: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Get all unique tags from all projects
  const allTags = Array.from(
    new Set(projects.flatMap((project) => project.tags))
  ).sort();

  // Filter projects based on selected tag
  const filteredProjects = selectedTag
    ? projects.filter((project) => project.tags.includes(selectedTag))
    : projects;

  if (loading) {
    return (
      <div className="projects-page">
        <div className="projects-loading">Loading projects...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="projects-page">
        <div className="projects-error">
          <p>Error: {error}</p>
          <button onClick={loadProjects}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="projects-page">
      {projects.length === 0 ? (
        <div className="projects-empty">
          <p>No projects yet.</p>
          <p>Create your first project to get started.</p>
          <button
            className="btn-primary"
            onClick={() => setShowNewProjectModal(true)}
          >
            Create Project
          </button>
        </div>
      ) : (
        <div className="projects-table-container">
          <div className="table-header">
            <div className="filter-section">
              <label htmlFor="tag-filter">Filter by tag:</label>
              <select
                id="tag-filter"
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="tag-filter-select"
              >
                <option value="">All Tags</option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
            <button
              className="btn-new-project"
              onClick={() => setShowNewProjectModal(true)}
              title="Create new project"
            >
              <span className="icon">+</span>
              New Project
            </button>
          </div>
          <table className="projects-table">
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Tags</th>
                <th>Repositories</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project) => (
                <tr key={project.id}>
                  <td className="project-name">{project.name}</td>
                  <td className="project-tags">
                    {project.tags.length > 0 ? (
                      <div className="tags-container">
                        {project.tags.map((tag, index) => (
                          <span key={index} className="tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="empty-cell">-</span>
                    )}
                  </td>
                  <td className="project-repos">
                    {project.repositories.length > 0 ? (
                      <div className="repos-container">
                        {project.repositories.map((repo, index) => (
                          <a
                            key={index}
                            href={repo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="repo-link"
                          >
                            {repo.url}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <span className="empty-cell">-</span>
                    )}
                  </td>
                  <td className="project-actions">
                    <button
                      className="btn-action btn-set-active"
                      onClick={() => handleSetActiveProject(project.id)}
                      title="Set as active project"
                    >
                      Set Active
                    </button>
                    <button
                      className="btn-action btn-delete"
                      onClick={() => handleDeleteProject(project.id)}
                      title="Delete project"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showNewProjectModal && (
        <NewProjectModal
          onClose={() => setShowNewProjectModal(false)}
          onSuccess={loadProjects}
        />
      )}
    </div>
  );
}
