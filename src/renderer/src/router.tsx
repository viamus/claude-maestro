/**
 * Router Configuration
 * Defines all application routes using React Router v7
 */

import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import LandingPage from './components/LandingPage';
import ProjectsPage from './components/ProjectsPage';

/**
 * Application routes
 */
const routes: RouteObject[] = [
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: 'projects',
        element: <ProjectsPage />,
      },
      // Future routes:
      // { path: 'backlog', element: <BacklogPage /> },
      // { path: 'architecture', element: <ArchitecturePage /> },
      // { path: 'settings', element: <SettingsPage /> },
    ],
  },
];

/**
 * Router instance
 */
export const router = createBrowserRouter(routes);
