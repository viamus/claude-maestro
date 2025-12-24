# Layout System

## Overview

The claude-maestro application uses a reusable layout system that provides a consistent structure across all views. This document describes the layout architecture, components, and usage patterns.

## Architecture

### Components

#### MainLayout

**Location:** `src/renderer/src/components/MainLayout.tsx`

The root layout component that establishes the two-column application structure:
- Left column: Sidebar navigation
- Right column: Main content area

**Usage:**
```tsx
import { MainLayout } from './components/MainLayout';

function App() {
  return (
    <MainLayout>
      <YourPageComponent />
    </MainLayout>
  );
}
```

**Responsibilities:**
- Provides the foundational flex layout
- Manages navigation state (current path)
- Integrates the Sidebar component
- Renders children in the main content area

---

#### Sidebar

**Location:** `src/renderer/src/components/Sidebar.tsx`

The left navigation panel with collapsible functionality.

**Features:**
- Collapse/expand toggle with persistent state
- Primary navigation items (Home, Backlog, Projects, Architecture, Settings)
- Secondary navigation items (Help, Feedback, About)
- Active route highlighting
- Monochromatic icons that inherit text color + labels when expanded, icons only when collapsed
- Tooltips on collapsed items
- Clean, minimal icon design (no colorful emojis)

**Props:**
```typescript
interface SidebarProps {
  onNavigate?: (path: string) => void;
  currentPath?: string;
}
```

**State Persistence:**
- Sidebar collapsed state is stored in app settings (`sidebarCollapsed`)
- Automatically loads on mount
- Automatically saves on toggle
- Uses IPC communication with main process for persistence

**Accessibility:**
- ARIA labels on toggle button
- Title attributes on nav items when collapsed
- Semantic HTML (aside, nav, button elements)

---

#### LandingPage

**Location:** `src/renderer/src/components/LandingPage.tsx`

The welcome screen and entry point to the application.

**Sections:**
1. **Welcome Section:**
   - Product name
   - Value proposition
   - Calm, confident messaging

2. **Actions Section (Get Started):**
   - Call-to-action cards with monochromatic icons
   - Quick access to core features (Generate backlog, Start project, Review architecture)
   - Neutral gray color palette on hover
   - Prioritized for immediate user engagement

3. **Changelog Section:**
   - Professional version history (Version 1.0.0)
   - Categorized release notes (Foundation, User Interface, Developer Experience)
   - Version badge and release date
   - Structured, engineering-focused content

**Philosophy:**
- No hype or buzzwords
- Minimal visual noise
- Clear hierarchy and spacing
- Emphasizes engineering discipline and professionalism
- Neutral color palette throughout (grays only, no bright colors)

---

## State Management

### Sidebar State Persistence

The sidebar collapsed state is managed through the settings system:

**IPC Flow:**
1. Sidebar component requests current state on mount
   - Channel: `ipc:settings:get`
   - Key: `sidebarCollapsed`

2. User toggles sidebar
   - State updates in React component
   - IPC call saves to settings
   - Channel: `ipc:settings:set`
   - Payload: `{ key: 'sidebarCollapsed', value: boolean }`

3. Settings manager persists to disk
   - Location: `%APPDATA%\claude-maestro\settings.json`

**Type Safety:**
```typescript
// src/shared/types.ts
export interface AppSettings {
  // ... other settings
  sidebarCollapsed?: boolean;
}
```

---

## CSS Architecture

### Layout Styles

**MainLayout.css:**
- Flexbox-based layout
- Full viewport height
- Scrollable main content area
- Dark theme support via media queries

**Sidebar.css:**
- Fixed width in expanded state (240px)
- Narrow width in collapsed state (60px)
- Smooth transitions on collapse/expand
- Responsive hover states
- Neutral gray color scheme (no bright blues)
- Active item: Dark gray (#495057) with white text
- Hover state: Light gray background (#e9ecef)
- Dark theme overrides with consistent gray palette

**LandingPage.css:**
- Centered content layout
- Max-width constraint (1000px)
- Grid-based feature and action sections
- Responsive design with auto-fit grids

### Global Styles

**App.css:**
- CSS reset (box-sizing, margin, padding)
- Default font stack
- Global button styles
- Minimal, non-opinionated

---

## Navigation System

### Current Implementation

Navigation is currently managed via local state in MainLayout:
- `currentPath` tracks the active route
- Sidebar highlights the active item
- Navigation clicks log to console (future: integrate router)

### Future Enhancement

When adding client-side routing (e.g., React Router):
1. Replace `MainLayout`'s `currentPath` state with router location
2. Replace `handleNavigate` console.log with router navigation
3. Maintain the same component structure

**Example with React Router:**
```tsx
import { useLocation, useNavigate } from 'react-router-dom';

function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <div className="main-layout">
      <Sidebar currentPath={location.pathname} onNavigate={handleNavigate} />
      <main className="main-content">{children}</main>
    </div>
  );
}
```

---

## Extending the Layout

### Adding a New Page

1. Create your page component in `src/renderer/src/components/`
2. Wrap it in `MainLayout` when rendering:

```tsx
import { MainLayout } from './components/MainLayout';
import { MyNewPage } from './components/MyNewPage';

function App() {
  return (
    <MainLayout>
      <MyNewPage />
    </MainLayout>
  );
}
```

3. Add a navigation item to the Sidebar (if needed):

```tsx
// In Sidebar.tsx
const PRIMARY_NAV_ITEMS: NavItem[] = [
  // ... existing items
  { id: 'my-page', label: 'My Page', icon: '🎯', path: '/my-page' },
];
```

### Adding Navigation Sections

To add a new section between primary and secondary nav:

```tsx
// In Sidebar.tsx
<nav className="sidebar-nav-primary">
  {/* Primary items */}
</nav>

<nav className="sidebar-nav-tertiary"> {/* New section */}
  {/* New items */}
</nav>

<nav className="sidebar-nav-secondary">
  {/* Secondary items */}
</nav>
```

---

## Testing

All layout components have comprehensive unit tests:

**Sidebar.test.tsx:**
- Render tests
- Collapse/expand functionality
- Navigation integration
- State persistence
- Error handling
- Accessibility

**MainLayout.test.tsx:**
- Layout structure
- Content rendering
- Sidebar integration
- Navigation state

**LandingPage.test.tsx:**
- Section rendering
- Content validation
- Action card interactions
- Philosophy adherence

**Run tests:**
```bash
npm run test
npm run test:watch
npm run test:coverage
```

---

## Design Principles

### Minimal Aesthetic
- No CSS frameworks
- Simple, functional design
- Clear hierarchy over visual flair
- Dark theme support via media queries

### Reusability
- MainLayout is the foundational shell for all views
- Components are composable and focused
- Styles are scoped and non-conflicting

### Accessibility
- Semantic HTML
- ARIA labels where needed
- Keyboard navigation support
- Proper heading hierarchy

### Type Safety
- All props are typed
- Shared types in `src/shared/types.ts`
- IPC contracts enforce type safety across processes

---

## Future Considerations

### Router Integration
When adding routing, maintain the current structure:
- `MainLayout` remains the wrapper
- Sidebar navigation integrates with router
- Pages render as children of `MainLayout`

### Dynamic Navigation
For role-based or conditional nav items:
- Extend `NavItem` type with visibility rules
- Filter nav items in Sidebar component
- Keep navigation definition declarative

### Multi-level Navigation
If nested navigation is needed:
- Extend `NavItem` to support children
- Add expand/collapse for sub-items
- Maintain the current visual simplicity

### Responsive Design
Current layout is desktop-first. For mobile:
- Sidebar could become a drawer overlay
- Collapse state could auto-trigger on small screens
- Maintain the same component APIs

---

## Security Notes

### IPC Communication
- All sidebar state persistence uses type-safe IPC
- Settings validation happens in main process
- No direct file system access from renderer

### State Isolation
- Sidebar state is in app settings, not localStorage
- No sensitive data in sidebar state
- Settings are validated before persistence

---

## Related Documentation

- [Architecture Overview](.wiki/architecture.md)
- [IPC System](.wiki/examples.md)
- [Testing Guide](.wiki/testing-guide.md)
- [Security Checklist](.wiki/security-checklist.md)
