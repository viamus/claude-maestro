/**
 * Sidebar Component
 *
 * Left navigation panel with collapsible functionality.
 * State persists across app restarts via settings.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { IPC_CHANNELS } from '@shared/ipc-channels';
import type { NavItem } from '@shared/types';
import './Sidebar.css';

const PRIMARY_NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', icon: '◆', path: '/' },
  { id: 'backlog', label: 'Backlog', icon: '☰', path: '/backlog' },
  { id: 'projects', label: 'Projects', icon: '◉', path: '/projects' },
  { id: 'architecture', label: 'Architecture', icon: '▦', path: '/architecture' },
  { id: 'settings', label: 'Settings', icon: '⚙', path: '/settings' },
];

const SECONDARY_NAV_ITEMS: NavItem[] = [
  { id: 'help', label: 'Help / Docs', icon: '?', path: '/help' },
  { id: 'feedback', label: 'Feedback', icon: '◈', path: '/feedback' },
  { id: 'about', label: 'About', icon: 'i', path: '/about' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadCollapsedState();
  }, []);

  const loadCollapsedState = async () => {
    try {
      const response = await window.api.invoke(IPC_CHANNELS.SETTINGS_GET, 'sidebarCollapsed');
      if (response.success && response.data !== undefined) {
        setCollapsed(response.data as boolean);
      }
    } catch (err) {
      console.error('Failed to load sidebar state', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCollapsed = async () => {
    const newState = !collapsed;
    setCollapsed(newState);

    try {
      await window.api.invoke(IPC_CHANNELS.SETTINGS_SET, {
        key: 'sidebarCollapsed',
        value: newState,
      });
    } catch (err) {
      console.error('Failed to save sidebar state', err);
    }
  };

  const handleNavClick = (path: string) => {
    navigate(path);
  };

  if (loading) {
    return <div className="sidebar sidebar-loading" />;
  }

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
      {/* Header */}
      <div className="sidebar-header">
        {!collapsed && <h1 className="sidebar-logo">claude-maestro</h1>}
        <button
          className="sidebar-toggle"
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* Primary Navigation */}
      <nav className="sidebar-nav-primary">
        {PRIMARY_NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`sidebar-nav-item ${location.pathname === item.path ? 'sidebar-nav-item-active' : ''}`}
            onClick={() => handleNavClick(item.path)}
            title={collapsed ? item.label : undefined}
          >
            <span className="sidebar-nav-icon">{item.icon}</span>
            {!collapsed && <span className="sidebar-nav-label">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Secondary Navigation */}
      <nav className="sidebar-nav-secondary">
        {SECONDARY_NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`sidebar-nav-item ${location.pathname === item.path ? 'sidebar-nav-item-active' : ''}`}
            onClick={() => handleNavClick(item.path)}
            title={collapsed ? item.label : undefined}
          >
            <span className="sidebar-nav-icon">{item.icon}</span>
            {!collapsed && <span className="sidebar-nav-label">{item.label}</span>}
          </button>
        ))}
      </nav>
    </aside>
  );
}
