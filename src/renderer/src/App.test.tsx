/**
 * Unit Tests for App Component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { IPC_CHANNELS } from '@shared/ipc-channels';
import type { IPCResponse, AppSettings, AppVersion } from '@shared/types';

describe('App Component', () => {
  const mockSettings: AppSettings = {
    theme: 'system',
    language: 'en',
    windowBounds: { width: 1200, height: 800 },
  };

  const mockVersion: AppVersion = {
    app: '1.0.0',
    electron: '33.0.0',
    chrome: '120.0.0',
    node: '18.0.0',
  };

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup default mock responses
    window.api.invoke = vi.fn((channel: string, ...args: any[]) => {
      if (channel === IPC_CHANNELS.SETTINGS_GET_ALL) {
        return Promise.resolve<IPCResponse<AppSettings>>({
          success: true,
          data: mockSettings,
        });
      }

      if (channel === IPC_CHANNELS.APP_VERSION) {
        return Promise.resolve<IPCResponse<AppVersion>>({
          success: true,
          data: mockVersion,
        });
      }

      if (channel === IPC_CHANNELS.PING) {
        return Promise.resolve<IPCResponse<string>>({
          success: true,
          data: 'pong',
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
    it('should render the app title', async () => {
      render(<App />);

      expect(screen.getByText('Claude Maestro')).toBeInTheDocument();
      expect(
        screen.getByText('Electron + TypeScript + Vite + React')
      ).toBeInTheDocument();
    });

    it('should load settings on mount', async () => {
      render(<App />);

      await waitFor(() => {
        expect(window.api.invoke).toHaveBeenCalledWith(
          IPC_CHANNELS.SETTINGS_GET_ALL
        );
      });
    });

    it('should load version info on mount', async () => {
      render(<App />);

      await waitFor(() => {
        expect(window.api.invoke).toHaveBeenCalledWith(IPC_CHANNELS.APP_VERSION);
      });
    });

    it('should display loaded version information', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/1\.0\.0/)).toBeInTheDocument();
        expect(screen.getByText(/33\.0\.0/)).toBeInTheDocument();
      });
    });
  });

  describe('IPC Ping Test', () => {
    it('should have a ping test button', () => {
      render(<App />);

      const pingButton = screen.getByRole('button', {
        name: /test ipc \(ping\)/i,
      });
      expect(pingButton).toBeInTheDocument();
    });

    it('should call ping IPC when button clicked', async () => {
      const user = userEvent.setup();
      render(<App />);

      const pingButton = screen.getByRole('button', {
        name: /test ipc \(ping\)/i,
      });

      await user.click(pingButton);

      await waitFor(() => {
        expect(window.api.invoke).toHaveBeenCalledWith(IPC_CHANNELS.PING);
      });
    });

    it('should display success message after ping', async () => {
      const user = userEvent.setup();
      render(<App />);

      const pingButton = screen.getByRole('button', {
        name: /test ipc \(ping\)/i,
      });

      await user.click(pingButton);

      await waitFor(() => {
        expect(screen.getByText(/success: pong/i)).toBeInTheDocument();
      });
    });

    it('should disable button while loading', async () => {
      const user = userEvent.setup();

      // Make invoke delay to test loading state
      window.api.invoke = vi.fn(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve({ success: true, data: 'pong' }),
              100
            )
          )
      ) as any;

      render(<App />);

      const pingButton = screen.getByRole('button', {
        name: /test ipc \(ping\)/i,
      });

      await user.click(pingButton);

      // Button should show loading text
      expect(screen.getByText(/testing\.\.\./i)).toBeInTheDocument();
    });

    it('should display error message on ping failure', async () => {
      const user = userEvent.setup();

      render(<App />);

      // Wait for initial load to complete
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /test ipc \(ping\)/i })).toBeInTheDocument();
      });

      // Now mock the ping to fail
      window.api.invoke = vi.fn((channel: string) => {
        if (channel === IPC_CHANNELS.PING) {
          return Promise.resolve({ success: false, error: 'Connection failed' });
        }
        return Promise.resolve({ success: true, data: 'default' });
      }) as any;

      const pingButton = screen.getByRole('button', {
        name: /test ipc \(ping\)/i,
      });

      await user.click(pingButton);

      await waitFor(() => {
        expect(screen.getByText(/connection failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Theme Settings', () => {
    it('should render theme buttons', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /light/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /dark/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /system/i })).toBeInTheDocument();
      });
    });

    it('should highlight current theme', async () => {
      render(<App />);

      await waitFor(() => {
        const systemButton = screen.getByRole('button', { name: /^system$/i });
        expect(systemButton).toHaveClass('btn-active');
      });
    });

    it('should call IPC to change theme', async () => {
      const user = userEvent.setup();
      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /dark/i })).toBeInTheDocument();
      });

      const darkButton = screen.getByRole('button', { name: /dark/i });
      await user.click(darkButton);

      await waitFor(() => {
        expect(window.api.invoke).toHaveBeenCalledWith(
          IPC_CHANNELS.SETTINGS_SET,
          {
            key: 'theme',
            value: 'dark',
          }
        );
      });
    });

    it('should reload settings after theme change', async () => {
      const user = userEvent.setup();
      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /light/i })).toBeInTheDocument();
      });

      const lightButton = screen.getByRole('button', { name: /light/i });
      await user.click(lightButton);

      await waitFor(() => {
        // Should call SETTINGS_GET_ALL again after set
        const calls = vi.mocked(window.api.invoke).mock.calls;
        const settingsGetAllCalls = calls.filter(
          (call) => call[0] === IPC_CHANNELS.SETTINGS_GET_ALL
        );
        expect(settingsGetAllCalls.length).toBeGreaterThan(1);
      });
    });
  });

  describe('Settings Display', () => {
    it('should display current settings', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/"theme":/)).toBeInTheDocument();
        expect(screen.getByText(/"language":/)).toBeInTheDocument();
      });
    });

    it('should show loading state while settings load', () => {
      window.api.invoke = vi.fn(
        () => new Promise(() => {}) // Never resolves
      ) as any;

      render(<App />);

      expect(screen.getByText(/loading settings\.\.\./i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error banner when error occurs', async () => {
      const user = userEvent.setup();

      render(<App />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /test ipc \(ping\)/i })).toBeInTheDocument();
      });

      // Mock ping to fail
      window.api.invoke = vi.fn((channel: string) => {
        if (channel === IPC_CHANNELS.PING) {
          return Promise.resolve({ success: false, error: 'Network error' });
        }
        return Promise.resolve({ success: true, data: 'default' });
      }) as any;

      const pingButton = screen.getByRole('button', {
        name: /test ipc \(ping\)/i,
      });

      await user.click(pingButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('should allow dismissing error banner', async () => {
      const user = userEvent.setup();

      render(<App />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /test ipc \(ping\)/i })).toBeInTheDocument();
      });

      // Mock ping to fail
      window.api.invoke = vi.fn((channel: string) => {
        if (channel === IPC_CHANNELS.PING) {
          return Promise.resolve({ success: false, error: 'Test error' });
        }
        return Promise.resolve({ success: true, data: 'default' });
      }) as any;

      const pingButton = screen.getByRole('button', {
        name: /test ipc \(ping\)/i,
      });

      await user.click(pingButton);

      await waitFor(() => {
        expect(screen.getByText(/test error/i)).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: /×/ });
      await user.click(closeButton);

      expect(screen.queryByText(/test error/i)).not.toBeInTheDocument();
    });
  });

  describe('Version Information', () => {
    it('should display all version fields', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/app:/i)).toBeInTheDocument();
        expect(screen.getByText(/electron:/i)).toBeInTheDocument();
        expect(screen.getByText(/chrome:/i)).toBeInTheDocument();
        expect(screen.getByText(/node:/i)).toBeInTheDocument();
        expect(screen.getByText(/platform:/i)).toBeInTheDocument();
      });
    });

    it('should show platform from window.api', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/win32/i)).toBeInTheDocument();
      });
    });
  });
});
