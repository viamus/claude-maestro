/**
 * Unit Tests for Sidebar Component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar } from './Sidebar';
import { IPC_CHANNELS } from '@shared/ipc-channels';
import type { IPCResponse } from '@shared/types';

describe('Sidebar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock for sidebar collapsed state
    window.api.invoke = vi.fn((channel: string, ...args: any[]) => {
      if (channel === IPC_CHANNELS.SETTINGS_GET && args[0] === 'sidebarCollapsed') {
        return Promise.resolve<IPCResponse<boolean>>({
          success: true,
          data: false,
        });
      }

      if (channel === IPC_CHANNELS.SETTINGS_SET) {
        return Promise.resolve<IPCResponse<void>>({
          success: true,
        });
      }

      return Promise.resolve({ success: false, error: 'Unknown channel' });
    }) as any;
  });

  describe('Initial Render', () => {
    it('should render the sidebar with logo', async () => {
      render(<Sidebar />);

      await waitFor(() => {
        expect(screen.getByText('claude-maestro')).toBeInTheDocument();
      });
    });

    it('should render all primary navigation items', async () => {
      render(<Sidebar />);

      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('Backlog')).toBeInTheDocument();
        expect(screen.getByText('Projects')).toBeInTheDocument();
        expect(screen.getByText('Architecture')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });
    });

    it('should render all secondary navigation items', async () => {
      render(<Sidebar />);

      await waitFor(() => {
        expect(screen.getByText('Help / Docs')).toBeInTheDocument();
        expect(screen.getByText('Feedback')).toBeInTheDocument();
        expect(screen.getByText('About')).toBeInTheDocument();
      });
    });

    it('should load collapsed state from settings on mount', async () => {
      render(<Sidebar />);

      await waitFor(() => {
        expect(window.api.invoke).toHaveBeenCalledWith(
          IPC_CHANNELS.SETTINGS_GET,
          'sidebarCollapsed'
        );
      });
    });
  });

  describe('Collapse/Expand Functionality', () => {
    it('should have a toggle button', async () => {
      render(<Sidebar />);

      await waitFor(() => {
        const toggleButton = screen.getByRole('button', { name: /collapse sidebar/i });
        expect(toggleButton).toBeInTheDocument();
      });
    });

    it('should collapse when toggle button is clicked', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);

      await waitFor(() => {
        expect(screen.getByText('claude-maestro')).toBeInTheDocument();
      });

      const toggleButton = screen.getByRole('button', { name: /collapse sidebar/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(window.api.invoke).toHaveBeenCalledWith(
          IPC_CHANNELS.SETTINGS_SET,
          {
            key: 'sidebarCollapsed',
            value: true,
          }
        );
      });
    });

    it('should expand when toggle button is clicked in collapsed state', async () => {
      const user = userEvent.setup();

      // Start in collapsed state
      window.api.invoke = vi.fn((channel: string, ...args: any[]) => {
        if (channel === IPC_CHANNELS.SETTINGS_GET && args[0] === 'sidebarCollapsed') {
          return Promise.resolve<IPCResponse<boolean>>({
            success: true,
            data: true,
          });
        }
        if (channel === IPC_CHANNELS.SETTINGS_SET) {
          return Promise.resolve<IPCResponse<void>>({
            success: true,
          });
        }
        return Promise.resolve({ success: false, error: 'Unknown channel' });
      }) as any;

      render(<Sidebar />);

      await waitFor(() => {
        const toggleButton = screen.getByRole('button', { name: /expand sidebar/i });
        expect(toggleButton).toBeInTheDocument();
      });

      const toggleButton = screen.getByRole('button', { name: /expand sidebar/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(window.api.invoke).toHaveBeenCalledWith(
          IPC_CHANNELS.SETTINGS_SET,
          {
            key: 'sidebarCollapsed',
            value: false,
          }
        );
      });
    });

    it('should apply collapsed CSS class when collapsed', async () => {
      const user = userEvent.setup();
      const { container } = render(<Sidebar />);

      await waitFor(() => {
        expect(screen.getByText('claude-maestro')).toBeInTheDocument();
      });

      const sidebar = container.querySelector('.sidebar');
      expect(sidebar).toHaveClass('sidebar-expanded');

      const toggleButton = screen.getByRole('button', { name: /collapse sidebar/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(sidebar).toHaveClass('sidebar-collapsed');
      });
    });
  });

  describe('Navigation', () => {
    it('should call onNavigate when nav item is clicked', async () => {
      const user = userEvent.setup();
      const onNavigate = vi.fn();

      render(<Sidebar onNavigate={onNavigate} />);

      await waitFor(() => {
        expect(screen.getByText('Backlog')).toBeInTheDocument();
      });

      const backlogButton = screen.getByText('Backlog');
      await user.click(backlogButton);

      expect(onNavigate).toHaveBeenCalledWith('/backlog');
    });

    it('should highlight active navigation item', async () => {
      render(<Sidebar currentPath="/architecture" />);

      await waitFor(() => {
        const architectureButton = screen.getByText('Architecture').closest('button');
        expect(architectureButton).toHaveClass('sidebar-nav-item-active');
      });
    });

    it('should not highlight non-active items', async () => {
      render(<Sidebar currentPath="/architecture" />);

      await waitFor(() => {
        const homeButton = screen.getByText('Home').closest('button');
        expect(homeButton).not.toHaveClass('sidebar-nav-item-active');
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading state while loading collapsed preference', () => {
      // Make invoke delay to test loading state
      window.api.invoke = vi.fn(
        () => new Promise(() => {}) // Never resolves
      ) as any;

      const { container } = render(<Sidebar />);

      const loadingSidebar = container.querySelector('.sidebar-loading');
      expect(loadingSidebar).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle failed load of collapsed state gracefully', async () => {
      window.api.invoke = vi.fn((channel: string) => {
        if (channel === IPC_CHANNELS.SETTINGS_GET) {
          return Promise.resolve<IPCResponse<boolean>>({
            success: false,
            error: 'Failed to load',
          });
        }
        return Promise.resolve({ success: false, error: 'Unknown channel' });
      }) as any;

      render(<Sidebar />);

      // Should still render sidebar even if loading state fails
      await waitFor(() => {
        expect(screen.getByText('claude-maestro')).toBeInTheDocument();
      });
    });

    it('should handle failed save of collapsed state gracefully', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      window.api.invoke = vi.fn((channel: string, ...args: any[]) => {
        if (channel === IPC_CHANNELS.SETTINGS_GET) {
          return Promise.resolve<IPCResponse<boolean>>({
            success: true,
            data: false,
          });
        }
        if (channel === IPC_CHANNELS.SETTINGS_SET) {
          return Promise.reject(new Error('Save failed'));
        }
        return Promise.resolve({ success: false, error: 'Unknown channel' });
      }) as any;

      render(<Sidebar />);

      await waitFor(() => {
        expect(screen.getByText('claude-maestro')).toBeInTheDocument();
      });

      const toggleButton = screen.getByRole('button', { name: /collapse sidebar/i });
      await user.click(toggleButton);

      // Should still toggle UI even if save fails
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on toggle button', async () => {
      render(<Sidebar />);

      await waitFor(() => {
        const toggleButton = screen.getByRole('button', { name: /collapse sidebar/i });
        expect(toggleButton).toHaveAttribute('aria-label', 'Collapse sidebar');
      });
    });

    it('should have proper title attributes on nav items when collapsed', async () => {
      const user = userEvent.setup();

      // Start collapsed
      window.api.invoke = vi.fn((channel: string, ...args: any[]) => {
        if (channel === IPC_CHANNELS.SETTINGS_GET && args[0] === 'sidebarCollapsed') {
          return Promise.resolve<IPCResponse<boolean>>({
            success: true,
            data: true,
          });
        }
        if (channel === IPC_CHANNELS.SETTINGS_SET) {
          return Promise.resolve<IPCResponse<void>>({
            success: true,
          });
        }
        return Promise.resolve({ success: false, error: 'Unknown channel' });
      }) as any;

      const { container } = render(<Sidebar />);

      // Wait for component to load in collapsed state
      await waitFor(() => {
        const sidebar = container.querySelector('.sidebar');
        expect(sidebar).toHaveClass('sidebar-collapsed');
      });

      // Now check that nav items have title attributes
      // When collapsed, buttons are identified by their icon, not the label text
      const homeButton = screen.getByRole('button', { name: '◆' });
      expect(homeButton).toHaveAttribute('title', 'Home');
    });
  });
});
