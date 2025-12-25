/**
 * Unit Tests for LandingPage Component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import LandingPage from './LandingPage';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('LandingPage Component', () => {
  describe('Initial Render', () => {
    it('should render the welcome title', () => {
      render(<LandingPage />);

      expect(screen.getByText('Welcome to claude-maestro')).toBeInTheDocument();
    });

    it('should render the welcome subtitle', () => {
      render(<LandingPage />);

      expect(
        screen.getByText(/Your senior AI partner for structuring ideas/i)
      ).toBeInTheDocument();
    });

    it('should apply correct CSS classes to sections', () => {
      const { container } = render(<LandingPage />);

      expect(container.querySelector('.landing-page')).toBeInTheDocument();
      expect(container.querySelector('.landing-content')).toBeInTheDocument();
      expect(container.querySelector('.welcome-section')).toBeInTheDocument();
      expect(container.querySelector('.changelog-section')).toBeInTheDocument();
      expect(container.querySelector('.actions-section')).toBeInTheDocument();
    });
  });

  describe('Changelog Section', () => {
    it('should render the changelog section title', () => {
      render(<LandingPage />);

      expect(screen.getByText('Version 1.0.0')).toBeInTheDocument();
    });

    it('should render version badge and release date', () => {
      render(<LandingPage />);

      expect(screen.getByText('Initial Release')).toBeInTheDocument();
      expect(screen.getByText('December 2024')).toBeInTheDocument();
    });

    it('should render all changelog categories', () => {
      render(<LandingPage />);

      expect(screen.getByText('Foundation')).toBeInTheDocument();
      expect(screen.getByText('User Interface')).toBeInTheDocument();
      expect(screen.getByText('Developer Experience')).toBeInTheDocument();
    });

    it('should render changelog items', () => {
      render(<LandingPage />);

      expect(
        screen.getByText(/Complete Electron \+ TypeScript \+ Vite/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Collapsible sidebar navigation/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Comprehensive test suite/i)
      ).toBeInTheDocument();
    });

    it('should have proper changelog structure', () => {
      const { container } = render(<LandingPage />);

      expect(container.querySelector('.changelog-content')).toBeInTheDocument();
      expect(container.querySelector('.changelog-header')).toBeInTheDocument();
      expect(container.querySelector('.version-badge')).toBeInTheDocument();
      expect(container.querySelector('.release-date')).toBeInTheDocument();

      const categories = container.querySelectorAll('.changelog-category');
      expect(categories.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Actions Section', () => {
    it('should render the actions section title', () => {
      render(<LandingPage />);

      expect(screen.getByText('Get started')).toBeInTheDocument();
    });

    it('should render all action cards', () => {
      render(<LandingPage />);

      expect(screen.getByText('Generate a backlog')).toBeInTheDocument();
      expect(screen.getByText('Start a new project')).toBeInTheDocument();
      expect(screen.getByText('Review architecture')).toBeInTheDocument();
    });

    it('should render action card descriptions', () => {
      render(<LandingPage />);

      expect(
        screen.getByText(/Start with an idea and create structured work items/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Set up project structure and initial architecture/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Get architectural guidance and design validation/i)
      ).toBeInTheDocument();
    });

    it('should render action cards as buttons', () => {
      render(<LandingPage />);

      const actionButtons = screen.getAllByRole('button');
      expect(actionButtons.length).toBeGreaterThanOrEqual(3);
    });

    it('should navigate on backlog card click', async () => {
      const user = userEvent.setup();
      mockNavigate.mockClear();

      render(<LandingPage />);

      const backlogButton = screen.getByText('Generate a backlog').closest('button');
      expect(backlogButton).toBeInTheDocument();

      if (backlogButton) {
        await user.click(backlogButton);
        expect(mockNavigate).toHaveBeenCalledWith('/backlog');
      }
    });

    it('should handle all action card types', async () => {
      const user = userEvent.setup();
      mockNavigate.mockClear();

      render(<LandingPage />);

      // Test backlog action
      const backlogButton = screen.getByText('Generate a backlog').closest('button');
      if (backlogButton) {
        await user.click(backlogButton);
        expect(mockNavigate).toHaveBeenCalledWith('/backlog');
      }

      mockNavigate.mockClear();

      // Test project action
      const projectButton = screen.getByText('Start a new project').closest('button');
      if (projectButton) {
        await user.click(projectButton);
        expect(mockNavigate).toHaveBeenCalledWith('/projects');
      }

      mockNavigate.mockClear();

      // Test architecture action
      const architectureButton = screen.getByText('Review architecture').closest('button');
      if (architectureButton) {
        await user.click(architectureButton);
        expect(mockNavigate).toHaveBeenCalledWith('/architecture');
      }
    });
  });

  describe('Layout and Structure', () => {
    it('should render sections in correct order', () => {
      const { container } = render(<LandingPage />);

      const sections = container.querySelectorAll('.landing-content > section');
      expect(sections).toHaveLength(3);

      expect(sections[0]).toHaveClass('welcome-section');
      expect(sections[1]).toHaveClass('actions-section');
      expect(sections[2]).toHaveClass('changelog-section');
    });

    it('should use proper heading hierarchy', () => {
      render(<LandingPage />);

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('Welcome to claude-maestro');

      const h2Elements = screen.getAllByRole('heading', { level: 2 });
      expect(h2Elements.length).toBeGreaterThanOrEqual(2);
    });

    it('should have proper semantic structure', () => {
      const { container } = render(<LandingPage />);

      const sections = container.querySelectorAll('section');
      expect(sections.length).toBeGreaterThanOrEqual(3);

      const changelogContent = container.querySelector('.changelog-content');
      expect(changelogContent).toBeInTheDocument();

      const actionsGrid = container.querySelector('.actions-grid');
      expect(actionsGrid).toBeInTheDocument();
    });
  });

  describe('Content Validation', () => {
    it('should display product philosophy correctly', () => {
      render(<LandingPage />);

      // Check for calm, confident messaging (not hype)
      expect(
        screen.getByText(/Your senior AI partner/i)
      ).toBeInTheDocument();

      expect(
        screen.getByText(/architectural discipline/i)
      ).toBeInTheDocument();
    });

    it('should emphasize professional changelog format', () => {
      render(<LandingPage />);

      expect(screen.getByText(/Initial Release/i)).toBeInTheDocument();
      expect(screen.getByText(/Version 1\.0\.0/i)).toBeInTheDocument();
      expect(screen.getByText(/December 2024/i)).toBeInTheDocument();

      // Check for category titles using more specific queries
      const categoryTitles = screen.getAllByRole('heading', { level: 3 });
      const categoryNames = categoryTitles.map(el => el.textContent);
      expect(categoryNames).toContain('Foundation');
      expect(categoryNames).toContain('User Interface');
      expect(categoryNames).toContain('Developer Experience');
    });
  });
});
