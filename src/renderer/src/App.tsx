/**
 * Main App Component
 */

import React, { useState, useEffect } from 'react';
import type { AppSettings, AppVersion } from '@shared/types';
import { IPC_CHANNELS } from '@shared/ipc-channels';
import './styles/App.css';

function App() {
  const [pingResult, setPingResult] = useState<string>('');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [version, setVersion] = useState<AppVersion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Load initial data on mount
  useEffect(() => {
    loadSettings();
    loadVersion();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await window.api.invoke(IPC_CHANNELS.SETTINGS_GET_ALL);
      if (response.success && response.data) {
        setSettings(response.data);
      } else {
        setError(response.error || 'Failed to load settings');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const loadVersion = async () => {
    try {
      const response = await window.api.invoke(IPC_CHANNELS.APP_VERSION);
      if (response.success && response.data) {
        setVersion(response.data);
      }
    } catch (err) {
      console.error('Failed to load version', err);
    }
  };

  const handlePing = async () => {
    setLoading(true);
    setError('');
    setPingResult('');

    try {
      const response = await window.api.invoke(IPC_CHANNELS.PING);

      if (response.success && response.data) {
        setPingResult(`Success: ${response.data}`);
      } else {
        setError(response.error || 'Ping failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = async (theme: 'light' | 'dark' | 'system') => {
    setLoading(true);
    setError('');

    try {
      const response = await window.api.invoke(IPC_CHANNELS.SETTINGS_SET, {
        key: 'theme',
        value: theme,
      });

      if (response.success) {
        await loadSettings(); // Reload to confirm
      } else {
        setError(response.error || 'Failed to update theme');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Claude Maestro</h1>
        <p className="subtitle">Electron + TypeScript + Vite + React</p>
      </header>

      <main className="app-main">
        {/* Error Display */}
        {error && (
          <div className="error-banner">
            <strong>Error:</strong> {error}
            <button onClick={() => setError('')} className="btn-close">
              ×
            </button>
          </div>
        )}

        {/* IPC Test Section */}
        <section className="card">
          <h2>IPC Communication Test</h2>
          <button onClick={handlePing} disabled={loading} className="btn-primary">
            {loading ? 'Testing...' : 'Test IPC (Ping)'}
          </button>
          {pingResult && <div className="result success">{pingResult}</div>}
        </section>

        {/* Settings Section */}
        <section className="card">
          <h2>Settings</h2>
          {settings ? (
            <div className="settings-container">
              <div className="setting-group">
                <label>Theme:</label>
                <div className="button-group">
                  <button
                    onClick={() => handleThemeChange('light')}
                    disabled={loading}
                    className={
                      settings.theme === 'light' ? 'btn-active' : 'btn-secondary'
                    }
                  >
                    Light
                  </button>
                  <button
                    onClick={() => handleThemeChange('dark')}
                    disabled={loading}
                    className={
                      settings.theme === 'dark' ? 'btn-active' : 'btn-secondary'
                    }
                  >
                    Dark
                  </button>
                  <button
                    onClick={() => handleThemeChange('system')}
                    disabled={loading}
                    className={
                      settings.theme === 'system' ? 'btn-active' : 'btn-secondary'
                    }
                  >
                    System
                  </button>
                </div>
              </div>

              <div className="setting-group">
                <label>Current Settings:</label>
                <pre className="settings-display">
                  {JSON.stringify(settings, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <p>Loading settings...</p>
          )}
        </section>

        {/* Version Info Section */}
        <section className="card">
          <h2>Version Information</h2>
          {version ? (
            <div className="info-grid">
              <div className="info-item">
                <strong>App:</strong> {version.app}
              </div>
              <div className="info-item">
                <strong>Electron:</strong> {version.electron}
              </div>
              <div className="info-item">
                <strong>Chrome:</strong> {version.chrome}
              </div>
              <div className="info-item">
                <strong>Node:</strong> {version.node}
              </div>
              <div className="info-item">
                <strong>Platform:</strong> {window.api.platform}
              </div>
            </div>
          ) : (
            <p>Loading version info...</p>
          )}
        </section>
      </main>

      <footer className="app-footer">
        <p>
          Secure Electron app with contextIsolation and sandbox enabled
        </p>
      </footer>
    </div>
  );
}

export default App;
