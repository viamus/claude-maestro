# Architecture Documentation

## Overview

Claude Maestro follows a secure, multi-process architecture as recommended by Electron best practices.

## Process Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         MAIN PROCESS                             │
│  (Node.js environment - Full system access)                      │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Logger     │  │   Settings   │  │   IPC        │          │
│  │   Service    │  │   Manager    │  │   Handlers   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                  │                  │                  │
│         └──────────────────┴──────────────────┘                  │
│                            │                                     │
│                    ┌───────▼────────┐                           │
│                    │   main.ts      │                           │
│                    │ (Entry Point)  │                           │
│                    └───────┬────────┘                           │
└────────────────────────────┼──────────────────────────────────────┘
                             │
                             │ IPC Communication
                             │ (contextBridge)
                             │
┌────────────────────────────┼──────────────────────────────────────┐
│                    ┌───────▼────────┐                           │
│                    │  preload.ts    │                           │
│                    │ (Isolated)     │                           │
│                    └───────┬────────┘                           │
│                            │                                     │
│                    ┌───────▼────────┐                           │
│                    │  window.api    │                           │
│                    │ (Exposed API)  │                           │
│                    └───────┬────────┘                           │
│                            │                                     │
│                  RENDERER PROCESS                                │
│        (Sandboxed - No Node.js access)                          │
│                                                                   │
│  ┌─────────────────────────────────────────────────┐            │
│  │              React Application                   │            │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐     │            │
│  │  │  App.tsx │  │Components│  │  Styles  │     │            │
│  │  └──────────┘  └──────────┘  └──────────┘     │            │
│  └─────────────────────────────────────────────────┘            │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

## Security Boundaries

### Isolation Layers

1. **Main Process** (Privileged)
   - Full Node.js and Electron API access
   - File system, OS operations
   - Manages application lifecycle

2. **Preload Script** (Bridge)
   - Runs before renderer loads
   - Has access to both Node.js and DOM
   - Exposes controlled API via `contextBridge`
   - **Isolated** from renderer context

3. **Renderer Process** (Sandboxed)
   - No direct Node.js access
   - Only uses exposed `window.api`
   - Runs in OS-level sandbox
   - Content Security Policy enforced

### Security Configuration

```typescript
// src/main/main.ts
webPreferences: {
  contextIsolation: true,    // ✅ Isolates preload from renderer
  nodeIntegration: false,    // ✅ No Node.js in renderer
  sandbox: true,             // ✅ OS-level sandboxing
  webSecurity: true,         // ✅ Same-origin policy
  preload: path.join(__dirname, '../preload/preload.js')
}
```

## Data Flow

### IPC Request/Response Pattern

```
┌──────────────┐
│  Renderer    │
│  (App.tsx)   │
└──────┬───────┘
       │ 1. Call window.api.invoke('channel', data)
       ▼
┌──────────────┐
│  Preload     │
│  API         │
└──────┬───────┘
       │ 2. ipcRenderer.invoke() via contextBridge
       ▼
┌──────────────┐
│  Main        │
│  IPC Handler │
└──────┬───────┘
       │ 3. Process request
       │ 4. Access services (logger, settings)
       │ 5. Return IPCResponse<T>
       ▼
┌──────────────┐
│  Renderer    │
│  (Callback)  │
└──────────────┘
```

### Type Safety Flow

```typescript
// 1. Define contract (shared/ipc-contracts.ts)
interface IPCInvokeMap {
  'ipc:ping': {
    request: void;
    response: IPCResponse<string>;
  };
}

// 2. Expose typed API (preload/preload.ts)
const ipcInvoke: IPCInvoke = (channel, ...args) =>
  ipcRenderer.invoke(channel, ...args);

// 3. Use in renderer (renderer/src/App.tsx)
const response = await window.api.invoke('ipc:ping');
// TypeScript knows: response is IPCResponse<string>
```

## Module Organization

### Shared Module (`src/shared/`)
**Purpose**: Types and contracts used by all processes

- `types.ts` - Data structures (AppSettings, AppVersion, etc.)
- `ipc-channels.ts` - Channel name constants
- `ipc-contracts.ts` - Type-safe IPC contracts

**Why shared?**
- Single source of truth for types
- Compile-time safety across processes
- Prevents type drift

### Main Process (`src/main/`)

```
src/main/
├── services/
│   ├── logger.ts         # Logging service
│   └── settings-manager.ts  # Settings persistence
├── ipc-handlers.ts       # IPC endpoint implementations
└── main.ts               # Application entry point
```

**Responsibilities:**
- Window lifecycle management
- IPC handler registration
- Service initialization
- System-level operations

### Preload (`src/preload/`)

```
src/preload/
└── preload.ts            # contextBridge API exposure
```

**Responsibilities:**
- Expose minimal, explicit API to renderer
- Type-safe IPC wrapper
- No business logic (thin layer)

### Renderer (`src/renderer/`)

```
src/renderer/
├── src/
│   ├── styles/
│   │   ├── index.css     # Global styles
│   │   └── App.css       # Component styles
│   ├── App.tsx           # Main React component
│   └── main.tsx          # React entry point
├── index.html            # HTML template
└── global.d.ts           # window.api type declarations
```

**Responsibilities:**
- User interface
- User interactions
- IPC communication via `window.api`
- No direct file/system access

## Build Pipeline

### Development Mode

```
┌─────────────────┐
│  npm run dev    │
└────────┬────────┘
         │
    ┌────▼─────┐
    │ dev.mjs  │
    └────┬─────┘
         │
    ┌────┴──────────────────────────────┐
    │                                   │
    ▼                                   ▼
┌────────────┐                    ┌──────────┐
│ Vite Dev   │                    │   tsc    │
│ Server     │                    │  Watch   │
│ (Renderer) │                    │ (Main +  │
│            │                    │ Preload) │
└─────┬──────┘                    └────┬─────┘
      │                                │
      │         ┌──────────────────────┘
      │         │
      └─────────▼
      ┌──────────────┐
      │   Electron   │
      │   Process    │
      └──────────────┘
```

### Production Build

```
┌─────────────────┐
│  npm run build  │
└────────┬────────┘
         │
    ┌────┴─────────────────────────────┐
    │                                   │
    ▼                                   ▼
┌────────────┐                    ┌──────────┐
│ vite build │                    │   tsc    │
│ (Renderer) │                    │ (Main +  │
│            │                    │ Preload) │
└─────┬──────┘                    └────┬─────┘
      │                                │
      └────────────┬───────────────────┘
                   │
                   ▼
            ┌──────────────┐
            │    dist/     │
            │  ├─main/     │
            │  ├─preload/  │
            │  └─renderer/ │
            └──────┬───────┘
                   │
                   ▼
          ┌─────────────────┐
          │ electron-builder│
          └────────┬────────┘
                   │
                   ▼
            ┌──────────────┐
            │  release/    │
            │  Setup.exe   │
            └──────────────┘
```

## Settings Persistence

### Storage Location
- **Windows**: `%APPDATA%/claude-maestro/settings.json`

### Flow

```
┌──────────────┐
│  Renderer    │ getSetting('theme')
│              │────────────────────────┐
└──────────────┘                        │
                                        ▼
                              ┌──────────────────┐
                              │  IPC Handler     │
                              └────────┬─────────┘
                                       │
                                       ▼
                              ┌──────────────────┐
                              │ SettingsManager  │
                              │  - Load from     │
                              │    JSON file     │
                              │  - Merge with    │
                              │    defaults      │
                              │  - Return value  │
                              └────────┬─────────┘
                                       │
┌──────────────┐                       │
│  Renderer    │◄──────────────────────┘
│  (Updates)   │
└──────────────┘
```

### Default Values
Defined in `src/shared/types.ts`:

```typescript
export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  language: 'en',
  windowBounds: { width: 1200, height: 800 },
};
```

## Error Handling

### Consistent Response Pattern

All IPC handlers return:

```typescript
interface IPCResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

### Error Flow

```
Main Process Error
       │
       ▼
┌──────────────────┐
│  try/catch       │
│  in handler      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ createErrorResp  │
│ { success:false, │
│   error: msg }   │
└────────┬─────────┘
         │
         ▼
     Renderer
   (Check .success)
```

## Logging Strategy

### Dual Output

1. **Console** (Development)
   - All log levels
   - Colored output
   - Immediate feedback

2. **File** (Production)
   - Info level and above
   - Timestamped entries
   - Auto-rotation at 5MB

### Log Locations
- **Main logs**: `%APPDATA%/claude-maestro/logs/main.log`
- **Console**: Development only

## Extensibility

### Adding a New Service

1. Create service in `src/main/services/my-service.ts`
2. Export singleton instance
3. Import in `main.ts` or `ipc-handlers.ts`
4. Use in handlers

### Adding a New UI Component

1. Create component in `src/renderer/src/components/`
2. Import in `App.tsx`
3. Use `window.api.invoke()` for IPC

### Adding a New Setting

1. Update `AppSettings` interface in `src/shared/types.ts`
2. Update `DEFAULT_SETTINGS`
3. Use existing `SETTINGS_GET`/`SETTINGS_SET` IPC channels

No additional code needed - type safety and persistence work automatically.

## Performance Considerations

- **IPC**: Asynchronous by design, non-blocking
- **Settings**: Cached in memory, loaded once at startup
- **Logging**: Async file writes, buffered
- **Renderer**: Vite HMR for instant updates in dev
- **Build**: Parallel TypeScript compilation

## Best Practices

1. **Never** expose full Node.js API to renderer
2. **Always** validate IPC inputs in handlers
3. **Keep** preload script minimal (thin API layer)
4. **Use** shared types for compile-time safety
5. **Log** errors with context for debugging
6. **Handle** async errors with try/catch
7. **Test** IPC endpoints with the test button

---

This architecture prioritizes security, maintainability, and developer experience while following Electron best practices.
