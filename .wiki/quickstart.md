# Quick Start Guide

## Initial Setup (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development
```bash
npm run dev
```

The app will launch automatically with:
- Vite dev server running
- TypeScript compiling in watch mode
- Electron window with DevTools open

### 3. Test the Application

In the opened window:
1. Click **"Test IPC (Ping)"** button → Should display "Success: pong"
2. Change theme by clicking **Light/Dark/System** buttons
3. Verify settings persist by restarting the app

## Key Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development mode |
| `npm run build` | Compile all TypeScript |
| `npm run package` | Create Windows installer |
| `npm run lint` | Check code quality |
| `npm run format` | Format all code |

## Project Entry Points

- **Main Process**: `src/main/main.ts`
- **Preload Script**: `src/preload/preload.ts`
- **Renderer UI**: `src/renderer/src/App.tsx`
- **IPC Handlers**: `src/main/ipc-handlers.ts`
- **Shared Types**: `src/shared/types.ts`

## Development Workflow

1. **Edit renderer code** → Vite HMR updates instantly
2. **Edit main process** → Electron restarts automatically
3. **Add IPC endpoint** → Follow guide in README.md
4. **Add setting** → Update `AppSettings` in `src/shared/types.ts`

## Build for Production

```bash
# Compile all TypeScript
npm run build

# Create Windows installer
npm run package
```

Installer location: `release/Claude Maestro-1.0.0-Setup.exe`

## Debugging

### Enable verbose logging
Check logs at: `%APPDATA%\claude-maestro\logs\main.log`

### DevTools
- Renderer DevTools: Opens automatically in dev mode
- Main process debugging: Use VS Code debugger or `console.log`

### Common Issues

**Port 5173 in use:**
```bash
# Change port in vite.config.ts → server.port
```

**TypeScript errors:**
```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

## Next Steps

1. Customize `package.json` (name, author, description)
2. Add app icons to `resources/` folder
3. Update `electron-builder.yml` with your appId
4. Implement your features in `src/renderer/src/App.tsx`
5. Add business logic in `src/main/services/`

For detailed information, see [README.md](README.md)
