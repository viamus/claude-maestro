/**
 * NewProjectModal Component
 *
 * Modal for creating a new project.
 */

import { useState } from 'react';
import { IPC_CHANNELS } from '@shared/ipc-channels';
import type { ProjectFormData } from '@shared/types';
import './NewProjectModal.css';

interface NewProjectModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function NewProjectModal({ onClose, onSuccess }: NewProjectModalProps) {
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    tags: [],
    repositories: [],
  });
  const [tagInput, setTagInput] = useState('');
  const [repoInput, setRepoInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleAddRepository = () => {
    const url = repoInput.trim();
    if (url && !formData.repositories.some((repo) => repo.url === url)) {
      setFormData((prev) => ({
        ...prev,
        repositories: [...prev.repositories, { url }],
      }));
      setRepoInput('');
    }
  };

  const handleRemoveRepository = (urlToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      repositories: prev.repositories.filter((repo) => repo.url !== urlToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }

    try {
      setSubmitting(true);
      const response = await window.api.invoke(IPC_CHANNELS.PROJECT_CREATE, formData);

      if (response.success) {
        onSuccess();
        onClose();
      } else {
        setError(response.error || 'Failed to create project');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Project</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="project-form">
          {error && <div className="form-error">{error}</div>}

          {/* Project Name */}
          <div className="form-group">
            <label htmlFor="project-name">
              Project Name <span className="required">*</span>
            </label>
            <input
              id="project-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Enter project name"
              disabled={submitting}
              autoFocus
            />
          </div>

          {/* Tags */}
          <div className="form-group">
            <label htmlFor="tag-input">Tags</label>
            <div className="input-with-button">
              <input
                id="tag-input"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add a tag"
                disabled={submitting}
              />
              <button
                type="button"
                onClick={handleAddTag}
                disabled={submitting || !tagInput.trim()}
              >
                Add
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="tags-list">
                {formData.tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      disabled={submitting}
                      aria-label={`Remove ${tag}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Repositories */}
          <div className="form-group">
            <label htmlFor="repo-input">Repositories</label>
            <div className="input-with-button">
              <input
                id="repo-input"
                type="url"
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddRepository();
                  }
                }}
                placeholder="https://github.com/user/repo"
                disabled={submitting}
              />
              <button
                type="button"
                onClick={handleAddRepository}
                disabled={submitting || !repoInput.trim()}
              >
                Add
              </button>
            </div>
            {formData.repositories.length > 0 && (
              <div className="repos-list">
                {formData.repositories.map((repo) => (
                  <div key={repo.url} className="repo-item">
                    <span className="repo-url">{repo.url}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRepository(repo.url)}
                      disabled={submitting}
                      aria-label={`Remove ${repo.url}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button type="button" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
