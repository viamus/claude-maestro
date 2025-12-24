/**
 * Development Script
 * Starts Vite dev server and Electron in watch mode
 */

import { spawn } from 'child_process';
import { createServer } from 'vite';
import electron from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import waitOn from 'wait-on';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

let electronProcess = null;
let viteServer = null;

/**
 * Start Vite dev server
 */
async function startVite() {
  console.log('Starting Vite dev server...');

  viteServer = await createServer({
    configFile: join(rootDir, 'vite.config.ts'),
    mode: 'development',
  });

  await viteServer.listen();
  const address = viteServer.httpServer.address();
  const port = typeof address === 'object' ? address.port : 5173;

  console.log(`Vite dev server running at http://localhost:${port}`);
  return `http://localhost:${port}`;
}

/**
 * Compile TypeScript (main and preload)
 */
function compileTypeScript() {
  console.log('Compiling TypeScript...');

  return new Promise((resolve, reject) => {
    // Compile main and preload in parallel
    const mainCompile = spawn('npx', ['tsc', '-p', 'tsconfig.main.json', '--watch'], {
      shell: true,
      stdio: 'inherit',
      cwd: rootDir,
    });

    const preloadCompile = spawn(
      'npx',
      ['tsc', '-p', 'tsconfig.preload.json', '--watch'],
      {
        shell: true,
        stdio: 'inherit',
        cwd: rootDir,
      }
    );

    // Wait a bit for initial compilation
    setTimeout(() => {
      console.log('TypeScript compilation started in watch mode');
      resolve();
    }, 3000);

    mainCompile.on('error', reject);
    preloadCompile.on('error', reject);
  });
}

/**
 * Start Electron process
 */
function startElectron(devServerUrl) {
  console.log('Starting Electron...');

  electronProcess = spawn(electron, ['.'], {
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: 'development',
      VITE_DEV_SERVER_URL: devServerUrl,
    },
    stdio: 'inherit',
    cwd: rootDir,
  });

  electronProcess.on('close', (code) => {
    console.log(`Electron exited with code ${code}`);
    process.exit(code);
  });

  electronProcess.on('error', (err) => {
    console.error('Failed to start Electron:', err);
    process.exit(1);
  });
}

/**
 * Cleanup on exit
 */
function cleanup() {
  console.log('\nShutting down...');

  if (electronProcess) {
    electronProcess.kill();
  }

  if (viteServer) {
    viteServer.close();
  }

  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

/**
 * Main execution
 */
async function main() {
  try {
    // Start Vite dev server
    const devServerUrl = await startVite();

    // Compile TypeScript in watch mode
    await compileTypeScript();

    // Wait for compiled files to exist
    console.log('Waiting for compilation to complete...');
    await waitOn({
      resources: [
        join(rootDir, 'dist/main/main.js'),
        join(rootDir, 'dist/preload/preload.js'),
      ],
      timeout: 30000,
    });

    // Start Electron
    startElectron(devServerUrl);

    console.log('\n✓ Development environment ready!');
    console.log('  - Vite dev server running');
    console.log('  - TypeScript compiling in watch mode');
    console.log('  - Electron app started\n');
  } catch (error) {
    console.error('Failed to start development environment:', error);
    cleanup();
  }
}

main();
