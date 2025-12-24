/**
 * LandingPage Component
 *
 * Welcome screen and entry point to the platform.
 * Provides orientation, context, and next-step guidance.
 */

import './LandingPage.css';

interface ActionCardProps {
  icon: string;
  title: string;
  description: string;
  onClick?: () => void;
}

function ActionCard({ icon, title, description, onClick }: ActionCardProps) {
  return (
    <button className="action-card" onClick={onClick}>
      <span className="action-card-icon">{icon}</span>
      <h3 className="action-card-title">{title}</h3>
      <p className="action-card-description">{description}</p>
    </button>
  );
}

export function LandingPage() {
  const handleActionClick = (action: string) => {
    console.log('Action clicked:', action);
    // Future: Navigate to specific views
  };

  return (
    <div className="landing-page">
      <div className="landing-content">
        {/* Welcome Section */}
        <section className="welcome-section">
          <h1 className="welcome-title">Welcome to claude-maestro</h1>
          <p className="welcome-subtitle">
            Your senior AI partner for structuring ideas, generating backlogs,
            and guiding software development with architectural discipline.
          </p>
        </section>

        {/* Next Steps Section */}
        <section className="actions-section">
          <h2 className="section-title">Get started</h2>
          <div className="actions-grid">
            <ActionCard
              icon="☰"
              title="Generate a backlog"
              description="Start with an idea and create structured work items"
              onClick={() => handleActionClick('backlog')}
            />
            <ActionCard
              icon="◉"
              title="Start a new project"
              description="Set up project structure and initial architecture"
              onClick={() => handleActionClick('project')}
            />
            <ActionCard
              icon="▦"
              title="Review architecture"
              description="Get architectural guidance and design validation"
              onClick={() => handleActionClick('architecture')}
            />
          </div>
        </section>

        {/* Changelog Section */}
        <section className="changelog-section">
          <h2 className="section-title">Version 1.0.0</h2>
          <div className="changelog-content">
            <div className="changelog-header">
              <span className="version-badge">Initial Release</span>
              <span className="release-date">December 2024</span>
            </div>

            <div className="changelog-category">
              <h3 className="changelog-category-title">Foundation</h3>
              <ul className="changelog-list">
                <li>Complete Electron + TypeScript + Vite application architecture</li>
                <li>Security-first design with context isolation and sandboxing</li>
                <li>Type-safe IPC communication between all processes</li>
                <li>Persistent settings management with file-based storage</li>
              </ul>
            </div>

            <div className="changelog-category">
              <h3 className="changelog-category-title">User Interface</h3>
              <ul className="changelog-list">
                <li>Collapsible sidebar navigation with persistent state</li>
                <li>Monochromatic icon system with neutral color palette</li>
                <li>Responsive layout foundation for future views</li>
                <li>Dark theme support via system preferences</li>
              </ul>
            </div>

            <div className="changelog-category">
              <h3 className="changelog-category-title">Developer Experience</h3>
              <ul className="changelog-list">
                <li>Hot module replacement in development mode</li>
                <li>Comprehensive test suite with 70+ unit tests</li>
                <li>TypeScript strict mode across all layers</li>
                <li>Production-ready Windows installer build pipeline</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
