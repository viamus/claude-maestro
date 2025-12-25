/**
 * Unit Tests for ProjectsPage Component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import ProjectsPage from './ProjectsPage';
import { IPC_CHANNELS } from '@shared/ipc-channels';
import type { IPCResponse, Project } from '@shared/types';

// Mock window.confirm and window.alert
global.confirm = vi.fn(() => true);
global.alert = vi.fn();

describe('ProjectsPage Component', () => {
  const mockProjects: Project[] = [
    {
      id: 'project-1',
      name: 'Test Project 1',
      tags: ['typescript', 'electron'],
      repositories: [{ url: 'https://github.com/user/repo1' }],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'project-2',
      name: 'Test Project 2',
      tags: [],
      repositories: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock for PROJECT_GET_ALL
    window.api.invoke = vi.fn((channel: string) => {
      if (channel === IPC_CHANNELS.PROJECT_GET_ALL) {
        return Promise.resolve<IPCResponse<Project[]>>({
          success: true,
          data: mockProjects,
        });
      }
      return Promise.resolve({ success: false, error: 'Unknown channel' });
    }) as any;
  });

  describe('Initial Render', () => {
    it('should show loading state initially', () => {
      render(
        <MemoryRouter>
          <ProjectsPage />
        </MemoryRouter>
      );

      expect(screen.getByText('Loading projects...')).toBeInTheDocument();
    });

    it('should load and display projects', async () => {
      render(
        <MemoryRouter>
          <ProjectsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
        expect(screen.getByText('Test Project 2')).toBeInTheDocument();
      });
    });

    it('should display project tags', async () => {
      render(
        <MemoryRouter>
          <ProjectsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('typescript')).toBeInTheDocument();
        expect(screen.getByText('electron')).toBeInTheDocument();
      });
    });

    it('should display repository links', async () => {
      render(
        <MemoryRouter>
          <ProjectsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        const link = screen.getByText('https://github.com/user/repo1');
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', 'https://github.com/user/repo1');
        expect(link).toHaveAttribute('target', '_blank');
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no projects exist', async () => {
      window.api.invoke = vi.fn(() => {
        return Promise.resolve<IPCResponse<Project[]>>({
          success: true,
          data: [],
        });
      }) as any;

      render(
        <MemoryRouter>
          <ProjectsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('No projects yet.')).toBeInTheDocument();
        expect(screen.getByText('Create your first project to get started.')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message on load failure', async () => {
      window.api.invoke = vi.fn(() => {
        return Promise.resolve<IPCResponse<Project[]>>({
          success: false,
          error: 'Failed to load projects',
        });
      }) as any;

      render(
        <MemoryRouter>
          <ProjectsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Failed to load projects/)).toBeInTheDocument();
      });
    });

    it('should allow retry on error', async () => {
      let callCount = 0;
      window.api.invoke = vi.fn(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve<IPCResponse<Project[]>>({
            success: false,
            error: 'Network error',
          });
        }
        return Promise.resolve<IPCResponse<Project[]>>({
          success: true,
          data: mockProjects,
        });
      }) as any;

      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <ProjectsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
      });

      const retryButton = screen.getByText('Retry');
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      });
    });
  });

  describe('New Project Modal', () => {
    it('should open modal when New Project button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <ProjectsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      });

      const newProjectButton = screen.getByRole('button', { name: /New Project/i });
      await user.click(newProjectButton);

      await waitFor(() => {
        expect(screen.getByText('Create New Project')).toBeInTheDocument();
      });
    });
  });

  describe('Project Actions', () => {
    it('should delete project when delete button is clicked', async () => {
      const user = userEvent.setup();
      let deleteCallCount = 0;

      window.api.invoke = vi.fn((channel: string, ...args: any[]) => {
        if (channel === IPC_CHANNELS.PROJECT_GET_ALL) {
          if (deleteCallCount === 0) {
            return Promise.resolve<IPCResponse<Project[]>>({
              success: true,
              data: mockProjects,
            });
          } else {
            // After delete, return only one project
            return Promise.resolve<IPCResponse<Project[]>>({
              success: true,
              data: [mockProjects[1]],
            });
          }
        }
        if (channel === IPC_CHANNELS.PROJECT_DELETE) {
          deleteCallCount++;
          return Promise.resolve<IPCResponse<void>>({
            success: true,
          });
        }
        return Promise.resolve({ success: false, error: 'Unknown channel' });
      }) as any;

      render(
        <MemoryRouter>
          <ProjectsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
      await user.click(deleteButtons[0]);

      expect(global.confirm).toHaveBeenCalled();

      await waitFor(() => {
        expect(screen.queryByText('Test Project 1')).not.toBeInTheDocument();
        expect(screen.getByText('Test Project 2')).toBeInTheDocument();
      });
    });

    it('should not delete if user cancels confirmation', async () => {
      const user = userEvent.setup();
      (global.confirm as any).mockReturnValueOnce(false);

      render(
        <MemoryRouter>
          <ProjectsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
      await user.click(deleteButtons[0]);

      expect(window.api.invoke).not.toHaveBeenCalledWith(
        IPC_CHANNELS.PROJECT_DELETE,
        expect.anything()
      );
    });

    it('should set active project when Set Active button is clicked', async () => {
      const user = userEvent.setup();

      window.api.invoke = vi.fn((channel: string, ...args: any[]) => {
        if (channel === IPC_CHANNELS.PROJECT_GET_ALL) {
          return Promise.resolve<IPCResponse<Project[]>>({
            success: true,
            data: mockProjects,
          });
        }
        if (channel === IPC_CHANNELS.PROJECT_SET_ACTIVE) {
          return Promise.resolve<IPCResponse<void>>({
            success: true,
          });
        }
        return Promise.resolve({ success: false, error: 'Unknown channel' });
      }) as any;

      render(
        <MemoryRouter>
          <ProjectsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      });

      const setActiveButtons = screen.getAllByRole('button', { name: /Set Active/i });
      await user.click(setActiveButtons[0]);

      await waitFor(() => {
        expect(window.api.invoke).toHaveBeenCalledWith(
          IPC_CHANNELS.PROJECT_SET_ACTIVE,
          'project-1'
        );
      });
    });
  });
});
