# Claude Maestro

A modern, secure Electron desktop application built with TypeScript, Vite, and React.

## Overview

Claude Maestro is a production-ready Electron application template that demonstrates best practices for security, architecture, and developer experience. It features a fully type-safe IPC communication layer, persistent settings management, structured logging, and a scalable project structure.

## Tech Stack

- **Electron**: Desktop application framework
- **TypeScript**: Type-safe development across all processes
- **Vite**: Fast build tool and dev server for renderer process
- **React**: UI library for renderer process
- **electron-log**: Structured logging with file rotation
- **electron-builder**: Windows installer creation

## Features

- ✅ Full TypeScript coverage (main, preload, renderer)
- ✅ Secure Electron configuration (contextIsolation, sandbox, no nodeIntegration)
- ✅ Type-safe IPC communication
- ✅ Persistent settings management with JSON storage
- ✅ Structured logging to console and file
- ✅ Hot reload in development mode
- ✅ ESLint + Prettier configured
- ✅ Windows NSIS installer build

## Requirements

- **Node.js**: 18.x or higher (LTS recommended)
- **npm**: 9.x or higher
- **OS**: Windows 10/11 (primary target)

## Project Structure

```
claude-maestro/
├── src/
│   ├── main/              # Electron main process
│   │   ├── services/      # Business logic (logger, settings)
│   │   ├── ipc-handlers.ts   # IPC communication handlers
│   │   └── main.ts        # Main process entry point
│   ├── preload/           # Preload scripts
│   │   └── preload.ts     # contextBridge API exposure
│   ├── renderer/          # Frontend application
│   │   ├── src/
│   │   │   ├── styles/    # CSS files
│   │   │   ├── App.tsx    # Main React component
│   │   │   └── main.tsx   # Renderer entry point
│   │   ├── index.html     # HTML template
│   │   └── global.d.ts    # Type declarations for window.api
│   └── shared/            # Shared types and contracts
│       ├── ipc-channels.ts   # IPC channel names
│       ├── ipc-contracts.ts  # Type-safe IPC contracts
│       └── types.ts       # Shared type definitions
├── resources/             # App icons and assets
├── dist/                  # Compiled output
├── release/               # Built installers
├── scripts/               # Development scripts
│   └── dev.mjs           # Development mode launcher
├── public/                # Static assets for Vite
├── package.json           # Dependencies and scripts
├── tsconfig.json          # Base TypeScript config
├── tsconfig.main.json     # Main process TS config
├── tsconfig.preload.json  # Preload TS config
├── tsconfig.renderer.json # Renderer TS config
├── vite.config.ts         # Vite configuration
├── electron-builder.yml   # Build configuration
├── .eslintrc.json         # ESLint configuration
└── .prettierrc.json       # Prettier configuration
```

## Getting Started

### Installation

1. Clone or download this repository
2. Install dependencies:

```bash
npm install
```

### Development Mode (Windows)

Start the development environment with hot reload:

```bash
npm run dev
```

This command will:
1. Start Vite dev server on http://localhost:5173
2. Compile TypeScript for main and preload in watch mode
3. Launch Electron with DevTools open
4. Auto-reload on code changes

**How it works:**
- The `scripts/dev.mjs` script orchestrates the development workflow
- TypeScript compilers run in watch mode (`--watch` flag)
- Vite dev server provides HMR (Hot Module Replacement)
- Electron restarts when main process code changes
- Renderer updates instantly via Vite HMR

### Building

Build all processes for production:

```bash
npm run build
```

This compiles:
- Main process → `dist/main/`
- Preload → `dist/preload/`
- Renderer → `dist/renderer/`

### Creating Windows Installer

Generate a Windows NSIS installer:

```bash
npm run package
```

Output: `release/Claude Maestro-1.0.0-Setup.exe`

For directory output without installer:

```bash
npm run package:dir
```

### Code Quality

Lint TypeScript files:

```bash
npm run lint
npm run lint:fix  # Auto-fix issues
```

Format code:

```bash
npm run format
npm run format:check  # Check without modifying
```

## Architecture

### Security Model

The application follows Electron security best practices:

| Setting | Value | Purpose |
|---------|-------|---------|
| `contextIsolation` | `true` | Isolates preload scripts from renderer |
| `nodeIntegration` | `false` | Prevents Node.js access in renderer |
| `sandbox` | `true` | Runs renderer in sandboxed environment |
| `webSecurity` | `true` | Enforces same-origin policy |

**Communication Flow:**
```
Renderer → window.api.invoke() → contextBridge → IPC → Main Process
```

### IPC Communication

Type-safe IPC is implemented via contracts in `src/shared/ipc-contracts.ts`.

**Adding a New IPC Endpoint:**

1. **Define the channel** in `src/shared/ipc-channels.ts`:
```typescript
export const IPC_CHANNELS = {
  // ... existing channels
  MY_NEW_CHANNEL: 'ipc:my:channel',
} as const;
```

2. **Add contract** in `src/shared/ipc-contracts.ts`:
```typescript
export interface IPCInvokeMap {
  // ... existing contracts
  'ipc:my:channel': {
    request: { input: string };
    response: IPCResponse<{ output: string }>;
  };
}
```

3. **Implement handler** in `src/main/ipc-handlers.ts`:
```typescript
ipcMain.handle(
  IPC_CHANNELS.MY_NEW_CHANNEL,
  async (_event, payload: { input: string }) => {
    try {
      const result = { output: payload.input.toUpperCase() };
      return createSuccessResponse(result);
    } catch (error) {
      return createErrorResponse('Failed to process');
    }
  }
);
```

4. **Use in renderer**:
```typescript
const response = await window.api.invoke(IPC_CHANNELS.MY_NEW_CHANNEL, {
  input: 'hello',
});

if (response.success && response.data) {
  console.log(response.data.output); // "HELLO"
}
```

### Settings Management

Settings are stored as JSON in the user data directory:
- **Windows**: `%APPDATA%\claude-maestro\settings.json`

The `SettingsManager` class (`src/main/services/settings-manager.ts`) handles:
- Loading settings from disk with defaults fallback
- Type-safe get/set operations
- Automatic persistence on changes
- Merging with defaults for new keys

### Logging

Logs are managed by `electron-log` with dual output:
- **Console**: Debug and development
- **File**: `%APPDATA%\claude-maestro\logs\main.log`

Features:
- Automatic file rotation (5MB max size)
- Structured log format with timestamps
- Severity levels: debug, info, warn, error

Access logger in main process:
```typescript
import { logger } from './services/logger';

logger.info('Application started');
logger.error('Something went wrong', error);
```

## Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts, electron-builder config |
| `tsconfig.json` | Base TypeScript settings |
| `tsconfig.main.json` | Main process TS compilation |
| `tsconfig.preload.json` | Preload TS compilation |
| `tsconfig.renderer.json` | Renderer (React) TS compilation |
| `vite.config.ts` | Vite dev server and build settings |
| `electron-builder.yml` | Windows installer configuration |
| `.eslintrc.json` | Linting rules |
| `.prettierrc.json` | Code formatting rules |

## Electron Security Checklist

- ✅ `contextIsolation: true` – Preload scripts isolated from renderer
- ✅ `nodeIntegration: false` – No direct Node.js in renderer
- ✅ `sandbox: true` – Renderer runs in OS-level sandbox
- ✅ `webSecurity: true` – Same-origin policy enforced
- ✅ Content Security Policy in HTML
- ✅ No `eval()` or inline scripts in renderer
- ✅ All IPC channels explicitly defined
- ✅ No remote module usage
- ✅ Preload uses `contextBridge` for API exposure
- ✅ Input validation on all IPC handlers

## Data Storage Locations

| Type | Windows Location |
|------|------------------|
| Settings | `%APPDATA%\claude-maestro\settings.json` |
| Logs | `%APPDATA%\claude-maestro\logs\main.log` |
| User Data | `%APPDATA%\claude-maestro\` |

## Troubleshooting

**Development mode won't start:**
- Ensure Node.js 18+ is installed
- Delete `node_modules` and run `npm install`
- Check that port 5173 is not in use

**TypeScript errors in IDE:**
- Ensure you're using the workspace TypeScript version
- Run `npm install` to update type definitions
- Restart IDE/TypeScript server

**Build fails:**
- Run `npm run build` to check for compilation errors
- Ensure all dependencies are installed
- Check `dist/` directory permissions

**Electron won't launch:**
- Check console for error messages
- Verify `dist/main/main.js` and `dist/preload/preload.js` exist
- Check logs in `%APPDATA%\claude-maestro\logs\`

## License

MIT

## Contributing

This is a template project. Fork and customize as needed for your application.

---

**Built with:**
- Electron ^33.3.1
- TypeScript ^5.7.2
- Vite ^5.4.11
- React ^18.3.1
