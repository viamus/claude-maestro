/**
 * Unit Tests for MainLayout Component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MainLayout } from './MainLayout';
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
        <MainLayout>
          <div>Test Content</div>
        </MainLayout>
      );

      await waitFor(() => {
        expect(screen.getByText('claude-maestro')).toBeInTheDocument();
      });
    });

    it('should render children in main content area', async () => {
      render(
        <MainLayout>
          <div>Test Content</div>
        </MainLayout>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Content')).toBeInTheDocument();
      });
    });

    it('should apply correct CSS classes', async () => {
      const { container } = render(
        <MainLayout>
          <div>Test Content</div>
        </MainLayout>
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
        <MainLayout>
          <div>Content</div>
        </MainLayout>
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
    it('should render multiple child elements', async () => {
      render(
        <MainLayout>
          <div>First Element</div>
          <div>Second Element</div>
          <p>Third Element</p>
        </MainLayout>
      );

      await waitFor(() => {
        expect(screen.getByText('First Element')).toBeInTheDocument();
        expect(screen.getByText('Second Element')).toBeInTheDocument();
        expect(screen.getByText('Third Element')).toBeInTheDocument();
      });
    });

    it('should render complex child components', async () => {
      const ComplexComponent = () => (
        <div>
          <h1>Title</h1>
          <p>Description</p>
          <button>Action</button>
        </div>
      );

      render(
        <MainLayout>
          <ComplexComponent />
        </MainLayout>
      );

      await waitFor(() => {
        expect(screen.getByText('Title')).toBeInTheDocument();
        expect(screen.getByText('Description')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
      });
    });
  });

  describe('Navigation Integration', () => {
    it('should pass navigation to sidebar', async () => {
      render(
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      );

      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('Backlog')).toBeInTheDocument();
      });
    });

    it('should track current path state', async () => {
      render(
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      );

      await waitFor(() => {
        // Home should be active by default (path: '/')
        const homeButton = screen.getByText('Home').closest('button');
        expect(homeButton).toHaveClass('sidebar-nav-item-active');
      });
    });
  });
});
