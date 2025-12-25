/**
 * Unit Tests for MainLayout Component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Outlet } from 'react-router-dom';
import MainLayout from './MainLayout';
import { IPC_CHANNELS } from '@shared/ipc-channels';
import type { IPCResponse } from '@shared/types';

describe('MainLayout Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock for sidebar
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
    it('should render the sidebar', async () => {
      render(
        <MemoryRouter>
          <MainLayout />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('claude-maestro')).toBeInTheDocument();
      });
    });

    it('should render Outlet in main content area', async () => {
      const TestChild = () => <div>Test Content</div>;

      render(
        <MemoryRouter initialEntries={['/test']}>
          <MainLayout />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('should apply correct CSS classes', async () => {
      const { container } = render(
        <MemoryRouter>
          <MainLayout />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(container.querySelector('.main-layout')).toBeInTheDocument();
        expect(container.querySelector('.main-content')).toBeInTheDocument();
      });
    });
  });

  describe('Layout Structure', () => {
    it('should render sidebar and content in correct order', async () => {
      const { container } = render(
        <MemoryRouter>
          <MainLayout />
        </MemoryRouter>
      );

      await waitFor(() => {
        const layout = container.querySelector('.main-layout');
        expect(layout).toBeInTheDocument();

        const children = layout?.children;
        expect(children).toHaveLength(2);

        // First child should be sidebar
        expect(children?.[0]).toHaveClass('sidebar');

        // Second child should be main content
        expect(children?.[1]).toHaveClass('main-content');
      });
    });
  });

  describe('Content Rendering', () => {
    it('should render Outlet for route content', async () => {
      render(
        <MemoryRouter>
          <MainLayout />
        </MemoryRouter>
      );

      await waitFor(() => {
        const mainContent = screen.getByRole('main');
        expect(mainContent).toBeInTheDocument();
        expect(mainContent).toHaveClass('main-content');
      });
    });
  });

  describe('Navigation Integration', () => {
    it('should render sidebar with navigation items', async () => {
      render(
        <MemoryRouter>
          <MainLayout />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('Backlog')).toBeInTheDocument();
      });
    });

    it('should track current path state', async () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <MainLayout />
        </MemoryRouter>
      );

      await waitFor(() => {
        // Home should be active by default (path: '/')
        const homeButton = screen.getByText('Home').closest('button');
        expect(homeButton).toHaveClass('sidebar-nav-item-active');
      });
    });
  });
});
