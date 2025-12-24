# Testing Guide

Complete guide for writing and running tests in claude-maestro.

## Testing Stack

| Tool | Purpose |
|------|---------|
| **Vitest** | Test runner (fast, Vite-native) |
| **@testing-library/react** | React component testing |
| **@testing-library/user-event** | User interaction simulation |
| **happy-dom** | Lightweight DOM implementation |
| **vi** (Vitest) | Mocking and spying |

---

## Test Structure

### File Naming Convention

```
ComponentName.ts  → ComponentName.test.ts
ComponentName.tsx → ComponentName.test.tsx
```

Tests live **alongside** the code they test, not in a separate `__tests__` directory.

### Test File Template

```typescript
/**
 * Unit Tests for [ComponentName]
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
// Import component under test
// Import dependencies

describe('[ComponentName]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('[Feature/Method Name]', () => {
    it('should [expected behavior]', () => {
      // Arrange: Setup test data
      // Act: Execute the behavior
      // Assert: Verify results
    });

    it('should handle [error case]', () => {
      // Test error scenarios
    });
  });
});
```

---

## Testing Main Process

### Testing Services

**Example**: `src/main/services/settings-manager.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';

// Mock dependencies
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/mock/path'),
  },
}));

vi.mock('fs');

import { SettingsManager } from './settings-manager';

describe('SettingsManager', () => {
  it('should load settings from file', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readFileSync').mockReturnValue('{"theme":"dark"}');

    const manager = new SettingsManager();

    expect(manager.get('theme')).toBe('dark');
  });

  it('should create defaults if file missing', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);
    vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});

    const manager = new SettingsManager();

    expect(fs.writeFileSync).toHaveBeenCalled();
  });
});
```

**Key Points:**
- Mock `electron` module (not available in test environment)
- Mock file system operations
- Test both success and error paths

---

### Testing IPC Handlers

**Example**: `src/main/ipc-handlers.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { ipcMain } from 'electron';

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
    removeHandler: vi.fn(),
  },
}));

import { registerIPCHandlers } from './ipc-handlers';

describe('IPC Handlers', () => {
  it('should register all handlers', () => {
    registerIPCHandlers();

    expect(ipcMain.handle).toHaveBeenCalledWith(
      'ipc:ping',
      expect.any(Function)
    );
  });

  it('should handle ping request', async () => {
    let pingHandler: Function | null = null;

    vi.mocked(ipcMain.handle).mockImplementation((channel, handler) => {
      if (channel === 'ipc:ping') {
        pingHandler = handler;
      }
    });

    registerIPCHandlers();

    const result = await pingHandler!({}, undefined);

    expect(result).toEqual({
      success: true,
      data: 'pong',
    });
  });
});
```

**Key Points:**
- Capture handler functions from `ipcMain.handle`
- Invoke handlers directly with mock events
- Verify response structure matches contracts

---

## Testing Renderer

### Testing React Components

**Example**: `src/renderer/src/App.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('App Component', () => {
  beforeEach(() => {
    // Setup mock IPC
    window.api.invoke = vi.fn((channel) => {
      if (channel === 'ipc:ping') {
        return Promise.resolve({ success: true, data: 'pong' });
      }
      return Promise.resolve({ success: false });
    });
  });

  it('should render title', () => {
    render(<App />);

    expect(screen.getByText('Claude Maestro')).toBeInTheDocument();
  });

  it('should call IPC on button click', async () => {
    const user = userEvent.setup();
    render(<App />);

    const button = screen.getByRole('button', { name: /ping/i });
    await user.click(button);

    await waitFor(() => {
      expect(window.api.invoke).toHaveBeenCalledWith('ipc:ping');
    });
  });

  it('should display result after IPC call', async () => {
    const user = userEvent.setup();
    render(<App />);

    const button = screen.getByRole('button', { name: /ping/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/pong/i)).toBeInTheDocument();
    });
  });
});
```

**Key Points:**
- Use `render()` from `@testing-library/react`
- Query with `screen` (accessible by role, text, label)
- Simulate user events with `userEvent.setup()`
- Use `waitFor()` for async updates

---

## Mocking

### Mocking Electron

```typescript
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn((key) => `/mock/${key}`),
    getVersion: vi.fn(() => '1.0.0'),
    quit: vi.fn(),
  },
  ipcMain: {
    handle: vi.fn(),
    removeHandler: vi.fn(),
  },
  BrowserWindow: vi.fn(),
}));
```

### Mocking Node Modules

```typescript
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

vi.mock('path', () => ({
  join: vi.fn((...args) => args.join('/')),
}));
```

### Mocking Services

```typescript
vi.mock('./services/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));
```

### Spy on Existing Functions

```typescript
const readSpy = vi.spyOn(fs, 'readFileSync');
readSpy.mockReturnValue('mock data');

expect(readSpy).toHaveBeenCalledWith('/path/to/file', 'utf-8');

readSpy.mockRestore(); // Clean up
```

---

## Testing Patterns

### Arrange-Act-Assert (AAA)

```typescript
it('should update theme setting', () => {
  // Arrange: Setup
  const manager = new SettingsManager();
  const newTheme = 'dark';

  // Act: Execute
  manager.set('theme', newTheme);

  // Assert: Verify
  expect(manager.get('theme')).toBe(newTheme);
});
```

### Testing Async Code

```typescript
it('should load data asynchronously', async () => {
  const promise = fetchData();

  await expect(promise).resolves.toEqual({ data: 'value' });
});

// Or with await
it('should load data', async () => {
  const result = await fetchData();

  expect(result).toEqual({ data: 'value' });
});
```

### Testing Error Cases

```typescript
it('should throw on invalid input', () => {
  expect(() => {
    validateInput(null);
  }).toThrow('Input cannot be null');
});

it('should return error response on failure', async () => {
  vi.mocked(fs.readFileSync).mockImplementation(() => {
    throw new Error('File not found');
  });

  const result = await handler();

  expect(result.success).toBe(false);
  expect(result.error).toBe('File not found');
});
```

### Testing User Interactions

```typescript
it('should handle button click', async () => {
  const user = userEvent.setup();
  render(<MyComponent />);

  const button = screen.getByRole('button', { name: /submit/i });
  await user.click(button);

  expect(screen.getByText(/submitted/i)).toBeInTheDocument();
});

it('should handle text input', async () => {
  const user = userEvent.setup();
  render(<MyForm />);

  const input = screen.getByLabelText(/username/i);
  await user.type(input, 'john');

  expect(input).toHaveValue('john');
});
```

---

## Running Tests

### Basic Commands

```bash
# Run all tests once
npm run test

# Watch mode (re-run on changes)
npm run test:watch

# Coverage report
npm run test:coverage

# Visual UI
npm run test:ui
```

### Filtering Tests

```bash
# Run specific file
npx vitest src/main/services/settings-manager.test.ts

# Run tests matching pattern
npx vitest --grep "SettingsManager"

# Run only tests in watch mode
npx vitest --watch src/renderer
```

### Coverage Thresholds

Current requirements:
- **New files**: ≥80% coverage
- **Critical paths** (IPC, security): 100% coverage

View coverage report:
```bash
npm run test:coverage
open coverage/index.html  # View in browser
```

---

## Common Issues

### Issue: `window.api` is undefined

**Solution**: Ensure `test/setup.ts` mocks it:

```typescript
(global.window as any).api = {
  invoke: vi.fn(),
  platform: 'win32',
  versions: { node: '18.0.0', electron: '33.0.0', chrome: '120.0.0' },
};
```

### Issue: Electron modules not found

**Solution**: Mock them at the top of test file:

```typescript
vi.mock('electron', () => ({ /* mock implementation */ }));
```

### Issue: Tests hang or timeout

**Causes**:
- Async operation never resolves
- Missing `await` keyword
- Mock not returning a promise

**Fix**:
```typescript
// Bad: Mock doesn't return promise
window.api.invoke = vi.fn();

// Good: Returns promise
window.api.invoke = vi.fn(() => Promise.resolve({ success: true }));
```

### Issue: Test pollution (tests affect each other)

**Solution**: Clear mocks in `beforeEach`:

```typescript
beforeEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});
```

---

## Best Practices

### ✅ DO:
- Test behavior, not implementation
- Use descriptive test names
- Test edge cases and error paths
- Mock external dependencies
- Keep tests focused (one assertion per test)
- Use `beforeEach` for setup
- Clean up after tests

### ❌ DON'T:
- Test framework internals
- Duplicate tests
- Skip error cases
- Hardcode implementation details
- Use `setTimeout` (use `waitFor` instead)
- Leave `.only` or `.skip` in committed code
- Mock everything (test real logic where possible)

---

## Test Checklist

Before considering code "done":

- [ ] All new functions have tests
- [ ] All branches tested (if/else, switch)
- [ ] Error cases tested
- [ ] Edge cases covered
- [ ] Tests pass locally
- [ ] Coverage ≥80% for new files
- [ ] No `.only` or `.skip` in tests
- [ ] Mocks cleaned up in `beforeEach`

---

## Examples by Type

### Service Test Example

See: `src/main/services/settings-manager.test.ts`
- Mocking file system
- Testing initialization
- Testing get/set operations
- Testing error recovery

### IPC Test Example

See: `src/main/ipc-handlers.test.ts`
- Capturing handler registration
- Invoking handlers directly
- Verifying response contracts

### Component Test Example

See: `src/renderer/src/App.test.tsx`
- Rendering components
- User interactions
- Async state updates
- Error display

---

## Integration with CI/CD

Tests run automatically in:
- Pre-commit hooks (planned)
- CI pipeline (planned)
- Before package builds

**All tests must pass before merge.**

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [User Event](https://testing-library.com/docs/user-event/intro)
- Project examples: `src/**/*.test.ts(x)`

---

**Testing is not optional. It's part of the definition of "done".**
