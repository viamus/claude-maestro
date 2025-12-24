# Code Examples

This document provides practical examples for common development tasks.

## Adding a New IPC Endpoint

Let's add a feature to read a file from disk.

### Step 1: Define the Channel

```typescript
// src/shared/ipc-channels.ts
export const IPC_CHANNELS = {
  // ... existing channels
  FILE_READ: 'ipc:file:read',
} as const;
```

### Step 2: Define Types and Contract

```typescript
// src/shared/ipc-contracts.ts
export interface IPCInvokeMap {
  // ... existing contracts
  'ipc:file:read': {
    request: { path: string };
    response: IPCResponse<{ content: string; size: number }>;
  };
}
```

### Step 3: Implement Handler

```typescript
// src/main/ipc-handlers.ts
import * as fs from 'fs';

// Inside registerIPCHandlers():
ipcMain.handle(
  IPC_CHANNELS.FILE_READ,
  async (
    _event,
    payload: { path: string }
  ): Promise<IPCResponse<{ content: string; size: number }>> => {
    try {
      logger.info(`Reading file: ${payload.path}`);

      // Validate input
      if (!payload.path) {
        return createErrorResponse('Path is required');
      }

      // Read file
      const content = fs.readFileSync(payload.path, 'utf-8');
      const stats = fs.statSync(payload.path);

      return createSuccessResponse({
        content,
        size: stats.size,
      });
    } catch (error) {
      logger.error(`Error reading file: ${payload.path}`, error);
      return createErrorResponse(
        error instanceof Error ? error.message : 'Failed to read file'
      );
    }
  }
);

// Don't forget to unregister in unregisterIPCHandlers():
ipcMain.removeHandler(IPC_CHANNELS.FILE_READ);
```

### Step 4: Use in Renderer

```typescript
// src/renderer/src/App.tsx
const handleReadFile = async () => {
  const response = await window.api.invoke(IPC_CHANNELS.FILE_READ, {
    path: 'C:\\Users\\example\\file.txt',
  });

  if (response.success && response.data) {
    console.log('File content:', response.data.content);
    console.log('File size:', response.data.size);
  } else {
    console.error('Error:', response.error);
  }
};
```

## Adding a New Setting

Let's add a "fontSize" setting.

### Step 1: Update Types

```typescript
// src/shared/types.ts
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  fontSize: number; // ← NEW
  windowBounds?: {
    width: number;
    height: number;
    x?: number;
    y?: number;
  };
  lastOpened?: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  language: 'en',
  fontSize: 14, // ← NEW DEFAULT
  windowBounds: {
    width: 1200,
    height: 800,
  },
};
```

### Step 2: Use in Renderer

```typescript
// src/renderer/src/App.tsx
const [fontSize, setFontSize] = useState(14);

// Load on mount
useEffect(() => {
  const loadFontSize = async () => {
    const response = await window.api.invoke(IPC_CHANNELS.SETTINGS_GET, 'fontSize');
    if (response.success && response.data) {
      setFontSize(response.data);
    }
  };
  loadFontSize();
}, []);

// Update handler
const handleFontSizeChange = async (newSize: number) => {
  const response = await window.api.invoke(IPC_CHANNELS.SETTINGS_SET, {
    key: 'fontSize',
    value: newSize,
  });

  if (response.success) {
    setFontSize(newSize);
  }
};

// In JSX:
<input
  type="range"
  min="10"
  max="24"
  value={fontSize}
  onChange={(e) => handleFontSizeChange(Number(e.target.value))}
/>
```

**That's it!** The setting will automatically persist to disk.

## Adding a New Service

Let's create a "NotificationService" to show system notifications.

### Step 1: Create Service

```typescript
// src/main/services/notification-service.ts
import { Notification } from 'electron';
import { logger } from './logger';

export class NotificationService {
  /**
   * Show a system notification
   */
  public show(title: string, body: string): void {
    try {
      if (!Notification.isSupported()) {
        logger.warn('Notifications not supported on this system');
        return;
      }

      const notification = new Notification({
        title,
        body,
      });

      notification.show();
      logger.info(`Notification shown: ${title}`);
    } catch (error) {
      logger.error('Failed to show notification', error);
    }
  }

  /**
   * Check if notifications are supported
   */
  public isSupported(): boolean {
    return Notification.isSupported();
  }
}

// Singleton instance
export const notificationService = new NotificationService();
```

### Step 2: Add IPC Endpoint

```typescript
// src/shared/ipc-channels.ts
export const IPC_CHANNELS = {
  // ...
  NOTIFICATION_SHOW: 'ipc:notification:show',
} as const;

// src/shared/ipc-contracts.ts
export interface IPCInvokeMap {
  // ...
  'ipc:notification:show': {
    request: { title: string; body: string };
    response: IPCResponse<void>;
  };
}

// src/main/ipc-handlers.ts
import { notificationService } from './services/notification-service';

// In registerIPCHandlers():
ipcMain.handle(
  IPC_CHANNELS.NOTIFICATION_SHOW,
  async (
    _event,
    payload: { title: string; body: string }
  ): Promise<IPCResponse<void>> => {
    try {
      notificationService.show(payload.title, payload.body);
      return createSuccessResponse(undefined);
    } catch (error) {
      return createErrorResponse('Failed to show notification');
    }
  }
);
```

### Step 3: Use in Renderer

```typescript
// src/renderer/src/App.tsx
const showNotification = async () => {
  await window.api.invoke(IPC_CHANNELS.NOTIFICATION_SHOW, {
    title: 'Hello!',
    body: 'This is a system notification.',
  });
};

<button onClick={showNotification}>Show Notification</button>
```

## Error Handling Pattern

### Robust Error Handling in Renderer

```typescript
const safeIPCCall = async <T,>(
  channel: keyof IPCInvokeMap,
  payload?: any
): Promise<T | null> => {
  try {
    const response = await window.api.invoke(channel, payload);

    if (response.success && response.data) {
      return response.data as T;
    } else {
      console.error(`IPC Error (${channel}):`, response.error);
      // Show user-friendly error
      setError(response.error || 'An error occurred');
      return null;
    }
  } catch (err) {
    console.error(`IPC Exception (${channel}):`, err);
    setError('Connection error');
    return null;
  }
};

// Usage:
const data = await safeIPCCall<string>('ipc:ping');
if (data) {
  console.log('Success:', data);
}
```

## Custom React Hook for Settings

```typescript
// src/renderer/src/hooks/useSettings.ts
import { useState, useEffect } from 'react';
import { IPC_CHANNELS } from '@shared/ipc-channels';
import type { AppSettings, SettingKey } from '@shared/types';

export function useSetting<K extends SettingKey>(
  key: K
): [AppSettings[K] | null, (value: AppSettings[K]) => Promise<void>] {
  const [value, setValue] = useState<AppSettings[K] | null>(null);

  // Load initial value
  useEffect(() => {
    const load = async () => {
      const response = await window.api.invoke(IPC_CHANNELS.SETTINGS_GET, key);
      if (response.success && response.data !== undefined) {
        setValue(response.data);
      }
    };
    load();
  }, [key]);

  // Update function
  const updateValue = async (newValue: AppSettings[K]) => {
    const response = await window.api.invoke(IPC_CHANNELS.SETTINGS_SET, {
      key,
      value: newValue,
    });

    if (response.success) {
      setValue(newValue);
    } else {
      throw new Error(response.error || 'Failed to update setting');
    }
  };

  return [value, updateValue];
}

// Usage:
const [theme, setTheme] = useSetting('theme');

<button onClick={() => setTheme('dark')}>
  Dark Mode
</button>
```

## Logging Best Practices

```typescript
// src/main/services/my-service.ts
import { logger } from './logger';

export class MyService {
  public async processData(input: string): Promise<string> {
    // Log entry point
    logger.info('Processing data', { inputLength: input.length });

    try {
      // ... processing logic

      // Log success
      logger.info('Data processed successfully');
      return result;
    } catch (error) {
      // Log error with context
      logger.error('Failed to process data', error, {
        input: input.substring(0, 100), // Truncate sensitive data
      });
      throw error;
    }
  }

  public debugComplexObject(obj: any): void {
    logger.debug('Complex object:', JSON.stringify(obj, null, 2));
  }
}
```

## Validating IPC Input

```typescript
// src/main/ipc-handlers.ts

// Helper function for validation
function validateFilePath(path: string): string | null {
  if (!path || typeof path !== 'string') {
    return 'Path must be a non-empty string';
  }

  if (path.includes('..')) {
    return 'Path traversal not allowed';
  }

  if (!fs.existsSync(path)) {
    return 'File does not exist';
  }

  return null; // Valid
}

// Use in handler
ipcMain.handle(
  IPC_CHANNELS.FILE_READ,
  async (_event, payload: { path: string }) => {
    try {
      // Validate
      const error = validateFilePath(payload.path);
      if (error) {
        return createErrorResponse(error);
      }

      // Process
      const content = fs.readFileSync(payload.path, 'utf-8');
      return createSuccessResponse({ content });
    } catch (err) {
      return createErrorResponse('Failed to read file');
    }
  }
);
```

## Window State Management

```typescript
// src/main/main.ts

// Save window state on close
window.on('close', () => {
  if (!window.isMaximized() && !window.isMinimized()) {
    const bounds = window.getBounds();
    settingsManager.set('windowBounds', {
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
    });
  }

  // Save other state
  settingsManager.set('lastOpened', new Date().toISOString());
});

// Restore on create
const savedBounds = settingsManager.get('windowBounds');
const window = new BrowserWindow({
  width: savedBounds?.width ?? 1200,
  height: savedBounds?.height ?? 800,
  x: savedBounds?.x,
  y: savedBounds?.y,
  // ...
});
```

## React Component with IPC

```typescript
// src/renderer/src/components/FileViewer.tsx
import React, { useState } from 'react';
import { IPC_CHANNELS } from '@shared/ipc-channels';

export function FileViewer() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadFile = async (path: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await window.api.invoke(IPC_CHANNELS.FILE_READ, { path });

      if (response.success && response.data) {
        setContent(response.data.content);
      } else {
        setError(response.error || 'Failed to load file');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={() => loadFile('C:\\example.txt')} disabled={loading}>
        {loading ? 'Loading...' : 'Load File'}
      </button>

      {error && <div className="error">{error}</div>}
      {content && <pre>{content}</pre>}
    </div>
  );
}
```

## Testing IPC Handlers Manually

```typescript
// Create a test script: scripts/test-ipc.ts
import { ipcRenderer } from 'electron';

async function testPing() {
  const response = await ipcRenderer.invoke('ipc:ping');
  console.log('Ping result:', response);
}

async function testSettings() {
  const response = await ipcRenderer.invoke('ipc:settings:getAll');
  console.log('Settings:', response);
}

testPing();
testSettings();
```

Run in DevTools console:
```javascript
window.api.invoke('ipc:ping').then(console.log)
```

## Production Build Checklist

Before building for production:

1. **Update package.json**:
   - Set correct `version`
   - Update `author`, `description`

2. **Update electron-builder.yml**:
   - Set unique `appId`
   - Update `productName`

3. **Add app icon**:
   - Place `icon.ico` in `resources/`
   - 256x256 PNG converted to ICO

4. **Test build**:
```bash
npm run build
npm run package:dir  # Test without installer
# Manual test the app in release/win-unpacked/
npm run package      # Create installer
```

5. **Test installer**:
   - Install on clean Windows machine
   - Verify shortcuts created
   - Check app launches correctly
   - Verify settings persist

---

These examples cover the most common development scenarios. For more details, see the README.md and ARCHITECTURE.md files.
