/**
 * Unit Tests for App Component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { IPC_CHANNELS } from '@shared/ipc-channels';
import type { IPCResponse } from '@shared/types';

describe('App Component', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup default mock responses for sidebar
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
    it('should render the main layout with sidebar', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('claude-maestro')).toBeInTheDocument();
      });
    });

    it('should render the landing page', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Welcome to claude-maestro')).toBeInTheDocument();
      });
    });

    it('should integrate MainLayout and LandingPage correctly', async () => {
      const { container } = render(<App />);

      await waitFor(() => {
        expect(container.querySelector('.main-layout')).toBeInTheDocument();
        expect(container.querySelector('.landing-page')).toBeInTheDocument();
      });
    });
  });

  describe('Sidebar Integration', () => {
    it('should render sidebar navigation items', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('Backlog')).toBeInTheDocument();
        expect(screen.getByText('Projects')).toBeInTheDocument();
      });
    });
  });

  describe('Landing Page Integration', () => {
    it('should render welcome message', async () => {
      render(<App />);

      await waitFor(() => {
        expect(
          screen.getByText(/Your senior AI partner for structuring ideas/i)
        ).toBeInTheDocument();
      });
    });

    it('should render action cards', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Generate a backlog')).toBeInTheDocument();
        expect(screen.getByText('Start a new project')).toBeInTheDocument();
        expect(screen.getByText('Review architecture')).toBeInTheDocument();
      });
    });
  });
});
