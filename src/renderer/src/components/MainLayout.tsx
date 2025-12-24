/**
 * MainLayout Component
 *
 * Reusable application shell with sidebar and main content area.
 * This layout is used across all pages in the application.
 */

import { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import './MainLayout.css';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [currentPath, setCurrentPath] = useState('/');

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    // Future: Integrate with router when navigation is implemented
    console.log('Navigate to:', path);
  };

  return (
    <div className="main-layout">
      <Sidebar currentPath={currentPath} onNavigate={handleNavigate} />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
