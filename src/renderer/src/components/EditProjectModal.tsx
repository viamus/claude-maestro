/**
 * EditProjectModal Component
 *
 * Modal for editing existing projects.
 */

import { useState, useEffect } from 'react';
import { IPC_CHANNELS } from '@shared/ipc-channels';
import type { Project, ProjectFormData } from '@shared/types';
import './NewProjectModal.css'; // Reuse same CSS

interface EditProjectModalProps {
  project: Project;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditProjectModal({ project, onClose, onSuccess }: EditProjectModalProps) {
  const [formData, setFormData] = useState<ProjectFormData>({
    name: project.name,
    tags: project.tags,
    repositories: project.repositories,
  });
  const [tagInput, setTagInput] = useState('');
  const [repoInput, setRepoInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Focus on name input when modal opens
  useEffect(() => {
    const input = document.querySelector<HTMLInputElement>('input[name="name"]');
    if (input) {
      input.focus();
      input.select();
    }
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await window.api.invoke(IPC_CHANNELS.PROJECT_UPDATE, {
        id: project.id,
        data: formData,
      });

      if (response.success) {
        onSuccess();
        onClose();
      } else {
        setErrors({ submit: response.error || 'Failed to update project' });
      }
    } catch (err) {
      setErrors({
        submit: err instanceof Error ? err.message : 'Unknown error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: [...formData.tags, tag] });
      setTagInput('');
    }
  };

  const handleRemoveTag = (index: number) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((_, i) => i !== index),
    });
  };

  const handleAddRepo = () => {
    const url = repoInput.trim();
    if (url) {
      setFormData({
        ...formData,
        repositories: [...formData.repositories, { url }],
      });
      setRepoInput('');
    }
  };

  const handleRemoveRepo = (index: number) => {
    setFormData({
      ...formData,
      repositories: formData.repositories.filter((_, i) => i !== index),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Project</h2>
          <button className="btn-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">
              Project Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={errors.name ? 'error' : ''}
              disabled={isSubmitting}
              placeholder="Enter project name"
            />
            {errors.name && <div className="error-message">{errors.name}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tags</label>
            <div className="input-with-button">
              <input
                type="text"
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, handleAddTag)}
                disabled={isSubmitting}
                placeholder="Enter tag and press Add"
              />
              <button
                type="button"
                onClick={handleAddTag}
                disabled={isSubmitting || !tagInput.trim()}
                className="btn-add"
              >
                Add
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="tags-list">
                {formData.tags.map((tag, index) => (
                  <div key={index} className="tag-item">
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(index)}
                      disabled={isSubmitting}
                      className="btn-remove"
                      aria-label={`Remove tag ${tag}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="repositories">Repositories</label>
            <div className="input-with-button">
              <input
                type="text"
                id="repositories"
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, handleAddRepo)}
                disabled={isSubmitting}
                placeholder="Enter repository URL and press Add"
              />
              <button
                type="button"
                onClick={handleAddRepo}
                disabled={isSubmitting || !repoInput.trim()}
                className="btn-add"
              >
                Add
              </button>
            </div>
            {formData.repositories.length > 0 && (
              <div className="repos-list">
                {formData.repositories.map((repo, index) => (
                  <div key={index} className="repo-item">
                    <span className="repo-url">{repo.url}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRepo(index)}
                      disabled={isSubmitting}
                      className="btn-remove"
                      aria-label={`Remove repository ${repo.url}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {errors.submit && <div className="error-message submit-error">{errors.submit}</div>}

          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-submit">
              {isSubmitting ? 'Updating...' : 'Update Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
