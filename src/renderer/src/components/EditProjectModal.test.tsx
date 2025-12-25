/**
 * EditProjectModal Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditProjectModal } from './EditProjectModal';
import type { Project } from '@shared/types';

// Mock window.api
const mockInvoke = vi.fn();
global.window.api = {
  invoke: mockInvoke,
} as never;

describe('EditProjectModal', () => {
  const mockProject: Project = {
    id: 'test-id',
    name: 'Test Project',
    tags: ['tag1', 'tag2'],
    repositories: [{ url: 'https://github.com/test/repo' }],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render modal with project data pre-filled', () => {
      render(
        <EditProjectModal project={mockProject} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      expect(screen.getByText('Edit Project')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Project')).toBeInTheDocument();
      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag2')).toBeInTheDocument();
      expect(screen.getByText('https://github.com/test/repo')).toBeInTheDocument();
    });

    it('should render form elements', () => {
      render(
        <EditProjectModal project={mockProject} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      expect(screen.getByLabelText(/project name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/tags/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/repositories/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /update project/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should focus and select name input on mount', () => {
      render(
        <EditProjectModal project={mockProject} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const nameInput = screen.getByDisplayValue('Test Project') as HTMLInputElement;
      expect(document.activeElement).toBe(nameInput);
    });
  });

  describe('Form Validation', () => {
    it('should show error when name is empty', async () => {
      render(
        <EditProjectModal project={mockProject} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const nameInput = screen.getByDisplayValue('Test Project');
      const submitButton = screen.getByRole('button', { name: /update project/i });

      await userEvent.clear(nameInput);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Project name is required')).toBeInTheDocument();
      });

      expect(mockInvoke).not.toHaveBeenCalled();
    });

    it('should not show error when name is valid', async () => {
      render(
        <EditProjectModal project={mockProject} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const nameInput = screen.getByDisplayValue('Test Project');
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'Updated Project');

      expect(screen.queryByText('Project name is required')).not.toBeInTheDocument();
    });
  });

  describe('Tag Management', () => {
    it('should add new tag', async () => {
      render(
        <EditProjectModal project={mockProject} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const tagInput = screen.getByLabelText(/tags/i);
      const addButton = screen.getAllByRole('button', { name: /add/i })[0];

      await userEvent.type(tagInput, 'newtag');
      fireEvent.click(addButton);

      expect(screen.getByText('newtag')).toBeInTheDocument();
      expect(tagInput).toHaveValue('');
    });

    it('should remove existing tag', async () => {
      render(
        <EditProjectModal project={mockProject} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const removeButtons = screen.getAllByRole('button', { name: /remove tag/i });
      fireEvent.click(removeButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText('tag1')).not.toBeInTheDocument();
      });

      expect(screen.getByText('tag2')).toBeInTheDocument();
    });

    it('should not add duplicate tags', async () => {
      render(
        <EditProjectModal project={mockProject} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const tagInput = screen.getByLabelText(/tags/i);
      const addButton = screen.getAllByRole('button', { name: /add/i })[0];

      await userEvent.type(tagInput, 'tag1');
      fireEvent.click(addButton);

      const tag1Elements = screen.getAllByText('tag1');
      expect(tag1Elements).toHaveLength(1);
    });

    it('should add tag when pressing Enter', async () => {
      render(
        <EditProjectModal project={mockProject} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const tagInput = screen.getByLabelText(/tags/i);
      await userEvent.type(tagInput, 'entertag{Enter}');

      expect(screen.getByText('entertag')).toBeInTheDocument();
    });
  });

  describe('Repository Management', () => {
    it('should add new repository', async () => {
      render(
        <EditProjectModal project={mockProject} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const repoInput = screen.getByLabelText(/repositories/i);
      const addButton = screen.getAllByRole('button', { name: /add/i })[1];

      await userEvent.type(repoInput, 'https://github.com/new/repo');
      fireEvent.click(addButton);

      expect(screen.getByText('https://github.com/new/repo')).toBeInTheDocument();
      expect(repoInput).toHaveValue('');
    });

    it('should remove existing repository', async () => {
      render(
        <EditProjectModal project={mockProject} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const removeButton = screen.getByRole('button', {
        name: /remove repository https:\/\/github.com\/test\/repo/i,
      });
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByText('https://github.com/test/repo')).not.toBeInTheDocument();
      });
    });

    it('should add repository when pressing Enter', async () => {
      render(
        <EditProjectModal project={mockProject} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const repoInput = screen.getByLabelText(/repositories/i);
      await userEvent.type(repoInput, 'https://github.com/enter/repo{Enter}');

      expect(screen.getByText('https://github.com/enter/repo')).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should submit updated project data', async () => {
      mockInvoke.mockResolvedValue({ success: true, data: mockProject });

      render(
        <EditProjectModal project={mockProject} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const nameInput = screen.getByDisplayValue('Test Project');
      const submitButton = screen.getByRole('button', { name: /update project/i });

      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'Updated Project Name');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('ipc:project:update', {
          id: 'test-id',
          data: {
            name: 'Updated Project Name',
            tags: ['tag1', 'tag2'],
            repositories: [{ url: 'https://github.com/test/repo' }],
          },
        });
      });

      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should show error message on submission failure', async () => {
      mockInvoke.mockResolvedValue({
        success: false,
        error: 'Project name already exists',
      });

      render(
        <EditProjectModal project={mockProject} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const submitButton = screen.getByRole('button', { name: /update project/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Project name already exists')).toBeInTheDocument();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should disable form during submission', async () => {
      mockInvoke.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
      );

      render(
        <EditProjectModal project={mockProject} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const submitButton = screen.getByRole('button', { name: /update project/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /updating/i })).toBeDisabled();
      });

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('should handle submission error', async () => {
      mockInvoke.mockRejectedValue(new Error('Network error'));

      render(
        <EditProjectModal project={mockProject} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const submitButton = screen.getByRole('button', { name: /update project/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Modal Interaction', () => {
    it('should close modal when clicking close button', () => {
      render(
        <EditProjectModal project={mockProject} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should close modal when clicking cancel button', () => {
      render(
        <EditProjectModal project={mockProject} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should close modal when clicking backdrop', () => {
      const { container } = render(
        <EditProjectModal project={mockProject} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const backdrop = container.querySelector('.modal-overlay');
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should not close modal when clicking modal content', () => {
      render(
        <EditProjectModal project={mockProject} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const modalContent = screen.getByText('Edit Project').parentElement;
      if (modalContent) {
        fireEvent.click(modalContent);
      }

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });
});
