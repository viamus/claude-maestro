/**
 * MainLayout Component
 *
 * Reusable application shell with sidebar and main content area.
 * This layout is used across all pages in the application.
 */

import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import './MainLayout.css';

export default function MainLayout() {
  return (
    <div className="main-layout">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
