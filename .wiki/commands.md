# Command Reference

Quick reference for all npm scripts and common operations.

## NPM Scripts

### Development

```bash
# Start development mode (recommended)
npm run dev

# This will:
# - Start Vite dev server (port 5173)
# - Compile TypeScript in watch mode
# - Launch Electron with hot reload
# - Open DevTools automatically
```

### Building

```bash
# Build all processes for production
npm run build

# Build individual processes
npm run build:renderer    # Vite build (renderer)
npm run build:main        # TypeScript compile (main)
npm run build:preload     # TypeScript compile (preload)
```

### Packaging

```bash
# Create Windows installer
npm run package

# Create unpacked directory (for testing)
npm run package:dir

# Output location: release/
```

### Code Quality

```bash
# Run ESLint
npm run lint

# Auto-fix ESLint issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check formatting without changes
npm run format:check
```

## Development Workflow

### First Time Setup

```bash
# 1. Install dependencies
npm install

# 2. Start development
npm run dev
```

### Daily Development

```bash
# Start dev mode
npm run dev

# Edit files in src/
# - Renderer changes: instant HMR
# - Main changes: automatic restart

# Ctrl+C to stop
```

### Before Committing

```bash
# Format and lint
npm run format
npm run lint:fix

# Verify build works
npm run build
```

### Creating a Release

```bash
# 1. Update version in package.json
# 2. Build and package
npm run package

# 3. Test installer
# 4. Distribute release/Claude Maestro-{version}-Setup.exe
```

## Manual Commands

### TypeScript Compilation

```bash
# Watch mode (development)
npx tsc -p tsconfig.main.json --watch
npx tsc -p tsconfig.preload.json --watch

# Single compilation
npx tsc -p tsconfig.main.json
npx tsc -p tsconfig.preload.json

# Check for errors without emitting
npx tsc -p tsconfig.main.json --noEmit
```

### Vite Commands

```bash
# Start dev server only
npx vite

# Build renderer only
npx vite build

# Preview production build
npx vite preview
```

### Electron Commands

```bash
# Run Electron (after building)
npx electron .

# Run with specific main file
npx electron dist/main/main.js
```

### Linting

```bash
# Lint all TypeScript files
npx eslint . --ext .ts,.tsx

# Lint specific file
npx eslint src/main/main.ts

# Auto-fix all files
npx eslint . --ext .ts,.tsx --fix
```

### Formatting

```bash
# Format all files
npx prettier --write "src/**/*.{ts,tsx,json}"

# Check formatting
npx prettier --check "src/**/*.{ts,tsx,json}"

# Format specific file
npx prettier --write src/main/main.ts
```

## Troubleshooting Commands

### Clean Build

```bash
# Remove all build artifacts
rm -rf dist release

# Or on Windows:
rmdir /s /q dist
rmdir /s /q release

# Rebuild
npm run build
```

### Reset Dependencies

```bash
# Remove node_modules and lockfile
rm -rf node_modules package-lock.json

# Or on Windows:
rmdir /s /q node_modules
del package-lock.json

# Reinstall
npm install
```

### Check Versions

```bash
# Node.js version
node --version

# npm version
npm --version

# Electron version
npx electron --version

# TypeScript version
npx tsc --version

# Vite version
npx vite --version
```

### View Logs

```bash
# Main process logs (Windows)
type "%APPDATA%\claude-maestro\logs\main.log"

# Or open in notepad
notepad "%APPDATA%\claude-maestro\logs\main.log"
```

### View Settings

```bash
# Settings file (Windows)
type "%APPDATA%\claude-maestro\settings.json"

# Or open in notepad
notepad "%APPDATA%\claude-maestro\settings.json"
```

### Debug Mode

```bash
# Enable Electron debug logs
set ELECTRON_ENABLE_LOGGING=1
npm run dev

# Enable Vite debug
set DEBUG=vite:*
npm run dev
```

## Build Debugging

### Check Build Output

```bash
# List compiled files
dir /s dist

# Check main process output
type dist\main\main.js

# Check preload output
type dist\preload\preload.js
```

### electron-builder Debug

```bash
# Build with debug output
npx electron-builder build --win --config --debug

# Build without compression (faster)
npx electron-builder build --win --dir
```

### Inspect Installer

```bash
# Build to directory (no installer)
npm run package:dir

# Manually run the built app
cd release\win-unpacked
"Claude Maestro.exe"
```

## Development Server Info

### Ports

- **Vite Dev Server**: http://localhost:5173
- **Change port**: Edit `vite.config.ts` → `server.port`

### URLs

```bash
# Check if Vite is running
curl http://localhost:5173

# Or in browser
start http://localhost:5173
```

## Git Workflow

```bash
# Initialize repository (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Claude Maestro project setup"

# Add remote
git remote add origin https://github.com/yourusername/claude-maestro.git

# Push
git push -u origin main
```

## Performance

### Check Bundle Size

```bash
# Build and analyze
npm run build

# Check renderer bundle
ls -lh dist/renderer/assets/

# Or on Windows
dir dist\renderer\assets
```

### Build Time

```bash
# Time the build
time npm run build

# Or on Windows (using PowerShell)
Measure-Command { npm run build }
```

## Testing

### Manual IPC Testing

```bash
# In DevTools console (F12 in dev mode):
window.api.invoke('ipc:ping').then(console.log)
window.api.invoke('ipc:settings:getAll').then(console.log)
window.api.invoke('ipc:app:version').then(console.log)
```

### Test Settings Persistence

```bash
# 1. Run app
npm run dev

# 2. Change a setting (e.g., theme)
# 3. Close app
# 4. Check settings file
type "%APPDATA%\claude-maestro\settings.json"

# 5. Restart app - setting should persist
npm run dev
```

## Environment Variables

### Available in Scripts

```bash
# Set development mode
set NODE_ENV=development
npm run dev

# Set production mode
set NODE_ENV=production
npm run build

# Vite dev server URL (set automatically by dev.mjs)
set VITE_DEV_SERVER_URL=http://localhost:5173
```

## CI/CD Commands

### GitHub Actions Example

```bash
# Install
npm ci

# Lint
npm run lint

# Build
npm run build

# Package (optional)
npm run package
```

## Useful Shortcuts

### Development

- **F5**: Reload Electron window
- **Ctrl+Shift+I**: Open DevTools
- **Ctrl+R**: Reload renderer (preserves main process)
- **Ctrl+C**: Stop dev server

### Code Editor (VS Code)

- **F2**: Rename symbol
- **Ctrl+Shift+O**: Go to symbol
- **Ctrl+P**: Quick file open
- **Ctrl+Shift+F**: Find in files

## Common File Locations

| Item | Windows Path |
|------|-------------|
| User Data | `%APPDATA%\claude-maestro\` |
| Settings | `%APPDATA%\claude-maestro\settings.json` |
| Logs | `%APPDATA%\claude-maestro\logs\main.log` |
| Temp | `%TEMP%\claude-maestro\` |
| Installer | `release\Claude Maestro-{version}-Setup.exe` |
| Unpacked | `release\win-unpacked\` |

## Advanced

### Custom Electron Args

```bash
# Disable GPU acceleration
npx electron . --disable-gpu

# Enable verbose logging
npx electron . --enable-logging --v=1
```

### Custom Build Config

```bash
# Build with custom config
npx electron-builder build --config custom-builder.yml
```

### Inspect electron-builder

```bash
# Show computed configuration
npx electron-builder --help
npx electron-builder build --help
```

## Quick Fixes

### "Port 5173 already in use"

```bash
# Find and kill process
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Or change port in vite.config.ts
```

### "Cannot find module"

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### "TypeScript errors"

```bash
# Check all projects
npx tsc -p tsconfig.main.json --noEmit
npx tsc -p tsconfig.preload.json --noEmit
npx tsc -p tsconfig.renderer.json --noEmit
```

### "Electron won't start"

```bash
# Check if compiled
ls dist/main/main.js
ls dist/preload/preload.js

# Rebuild
npm run build

# Check logs
type "%APPDATA%\claude-maestro\logs\main.log"
```

---

**Tip**: Add these commands to your editor's task runner for quick access.
