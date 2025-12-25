/**
 * Unit Tests for NewProjectModal Component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NewProjectModal } from './NewProjectModal';
import { IPC_CHANNELS } from '@shared/ipc-channels';
import type { IPCResponse, Project } from '@shared/types';

describe('NewProjectModal Component', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    window.api.invoke = vi.fn((channel: string) => {
      if (channel === IPC_CHANNELS.PROJECT_CREATE) {
        return Promise.resolve<IPCResponse<Project>>({
          success: true,
          data: {
            id: 'new-project-id',
            name: 'New Project',
            tags: [],
            repositories: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        });
      }
      return Promise.resolve({ success: false, error: 'Unknown channel' });
    }) as any;
  });

  describe('Initial Render', () => {
    it('should render modal with title', () => {
      render(<NewProjectModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      expect(screen.getByText('Create New Project')).toBeInTheDocument();
    });

    it('should render form fields', () => {
      render(<NewProjectModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      expect(screen.getByLabelText(/Project Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Tags/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Repositories/)).toBeInTheDocument();
    });

    it('should have Cancel and Create buttons', () => {
      render(<NewProjectModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Create Project/i })).toBeInTheDocument();
    });

    it('should focus on project name input', () => {
      render(<NewProjectModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const nameInput = screen.getByLabelText(/Project Name/);
      expect(nameInput).toHaveFocus();
    });
  });

  describe('Modal Interactions', () => {
    it('should close modal when Cancel button is clicked', async () => {
      const user = userEvent.setup();

      render(<NewProjectModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should close modal when clicking overlay', async () => {
      const user = userEvent.setup();

      const { container } = render(<NewProjectModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const overlay = container.querySelector('.modal-overlay');
      if (overlay) {
        await user.click(overlay);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      }
    });

    it('should close modal when clicking close button', async () => {
      const user = userEvent.setup();

      render(<NewProjectModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const closeButton = screen.getByLabelText('Close');
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Form Validation', () => {
    it('should show error when submitting without project name', async () => {
      const user = userEvent.setup();

      render(<NewProjectModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const submitButton = screen.getByRole('button', { name: /Create Project/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Project name is required')).toBeInTheDocument();
      });

      expect(window.api.invoke).not.toHaveBeenCalled();
    });

    it('should allow submission with only project name', async () => {
      const user = userEvent.setup();

      render(<NewProjectModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const nameInput = screen.getByLabelText(/Project Name/);
      await user.type(nameInput, 'My New Project');

      const submitButton = screen.getByRole('button', { name: /Create Project/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(window.api.invoke).toHaveBeenCalledWith(IPC_CHANNELS.PROJECT_CREATE, {
          name: 'My New Project',
          tags: [],
          repositories: [],
        });
      });
    });
  });

  describe('Tags Management', () => {
    it('should add tag when Add button is clicked', async () => {
      const user = userEvent.setup();

      render(<NewProjectModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const tagInput = screen.getByLabelText(/Tags/);
      await user.type(tagInput, 'typescript');

      const addButton = screen.getAllByRole('button', { name: /Add/i })[0];
      await user.click(addButton);

      expect(screen.getByText('typescript')).toBeInTheDocument();
      expect(tagInput).toHaveValue('');
    });

    it('should add tag when pressing Enter', async () => {
      const user = userEvent.setup();

      render(<NewProjectModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const tagInput = screen.getByLabelText(/Tags/);
      await user.type(tagInput, 'react{Enter}');

      expect(screen.getByText('react')).toBeInTheDocument();
    });

    it('should remove tag when remove button is clicked', async () => {
      const user = userEvent.setup();

      render(<NewProjectModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const tagInput = screen.getByLabelText(/Tags/);
      await user.type(tagInput, 'electron{Enter}');

      expect(screen.getByText('electron')).toBeInTheDocument();

      const removeButton = screen.getByLabelText('Remove electron');
      await user.click(removeButton);

      expect(screen.queryByText('electron')).not.toBeInTheDocument();
    });

    it('should not add duplicate tags', async () => {
      const user = userEvent.setup();

      render(<NewProjectModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const tagInput = screen.getByLabelText(/Tags/);
      await user.type(tagInput, 'test{Enter}');
      await user.type(tagInput, 'test{Enter}');

      const tags = screen.getAllByText('test');
      expect(tags).toHaveLength(1);
    });
  });

  describe('Repositories Management', () => {
    it('should add repository when Add button is clicked', async () => {
      const user = userEvent.setup();

      render(<NewProjectModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const repoInput = screen.getByLabelText(/Repositories/);
      await user.type(repoInput, 'https://github.com/user/repo');

      const addButton = screen.getAllByRole('button', { name: /Add/i })[1];
      await user.click(addButton);

      expect(screen.getByText('https://github.com/user/repo')).toBeInTheDocument();
      expect(repoInput).toHaveValue('');
    });

    it('should remove repository when remove button is clicked', async () => {
      const user = userEvent.setup();

      render(<NewProjectModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const repoInput = screen.getByLabelText(/Repositories/);
      await user.type(repoInput, 'https://github.com/test/repo{Enter}');

      const removeButton = screen.getByLabelText(/Remove https:\/\/github.com\/test\/repo/);
      await user.click(removeButton);

      expect(screen.queryByText('https://github.com/test/repo')).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should create project with all fields', async () => {
      const user = userEvent.setup();

      render(<NewProjectModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Fill project name
      const nameInput = screen.getByLabelText(/Project Name/);
      await user.type(nameInput, 'Full Project');

      // Add tags
      const tagInput = screen.getByLabelText(/Tags/);
      await user.type(tagInput, 'tag1{Enter}tag2{Enter}');

      // Add repository
      const repoInput = screen.getByLabelText(/Repositories/);
      await user.type(repoInput, 'https://github.com/user/repo{Enter}');

      // Submit
      const submitButton = screen.getByRole('button', { name: /Create Project/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(window.api.invoke).toHaveBeenCalledWith(IPC_CHANNELS.PROJECT_CREATE, {
          name: 'Full Project',
          tags: ['tag1', 'tag2'],
          repositories: [{ url: 'https://github.com/user/repo' }],
        });
      });

      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should display error message on submission failure', async () => {
      const user = userEvent.setup();

      window.api.invoke = vi.fn(() => {
        return Promise.resolve<IPCResponse<Project>>({
          success: false,
          error: 'Project name already exists',
        });
      }) as any;

      render(<NewProjectModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const nameInput = screen.getByLabelText(/Project Name/);
      await user.type(nameInput, 'Duplicate Name');

      const submitButton = screen.getByRole('button', { name: /Create Project/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Project name already exists')).toBeInTheDocument();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should disable form during submission', async () => {
      const user = userEvent.setup();

      window.api.invoke = vi.fn(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              success: true,
              data: {
                id: 'id',
                name: 'Project',
                tags: [],
                repositories: [],
                createdAt: Date.now(),
                updatedAt: Date.now(),
              },
            });
          }, 100);
        });
      }) as any;

      render(<NewProjectModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const nameInput = screen.getByLabelText(/Project Name/);
      await user.type(nameInput, 'Test Project');

      const submitButton = screen.getByRole('button', { name: /Create Project/i });
      await user.click(submitButton);

      // Check that button text changes
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Creating.../i })).toBeInTheDocument();
      });

      // Wait for submission to complete
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });
  });
});
