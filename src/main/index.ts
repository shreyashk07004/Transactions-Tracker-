import { app, BrowserWindow, shell, session } from 'electron';
import path from 'path';
import fs from 'fs';
import { createRollingBackup } from './backup';
import { registerIpcHandlers } from './ipc';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  const userDataDir = app.getPath('userData');

  // Create rolling backup on start
  createRollingBackup(userDataDir);

  // Restore window bounds if stored
  const boundsFile = path.join(userDataDir, 'window-state.json');
  let bounds = { width: 1280, height: 820, x: undefined as number | undefined, y: undefined as number | undefined };
  try {
    if (fs.existsSync(boundsFile)) {
      bounds = JSON.parse(fs.readFileSync(boundsFile, 'utf-8'));
    }
  } catch {
    // ignore
  }

  mainWindow = new BrowserWindow({
    width: bounds.width || 1280,
    height: bounds.height || 820,
    minWidth: 1024,
    minHeight: 700,
    x: bounds.x,
    y: bounds.y,
    center: bounds.x === undefined,
    show: false,
    autoHideMenuBar: true,
    title: 'SpendLedger',
    icon: path.join(__dirname, '../../build/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // CSP: strict in production; relaxed in dev so the Vite dev server (inline
  // React-refresh preamble + HMR websocket) can run.
  const isDev = !!process.env.ELECTRON_RENDERER_URL;
  const csp = isDev
    ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' ws: wss: http://localhost:* ws://localhost:*"
    : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'none'; font-src 'self'";

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp]
      }
    });
  });

  // Block all new window requests and navigation
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file:') && !url.startsWith('http://localhost')) {
      event.preventDefault();
    }
  });

  // Notify renderer on focus / blur to pause ambient animations
  mainWindow.on('blur', () => {
    mainWindow?.webContents.send('window:focus-change', false);
  });

  mainWindow.on('focus', () => {
    mainWindow?.webContents.send('window:focus-change', true);
  });

  // Save window bounds on close
  mainWindow.on('close', () => {
    if (mainWindow) {
      try {
        const b = mainWindow.getBounds();
        fs.writeFileSync(boundsFile, JSON.stringify(b), 'utf-8');
      } catch {
        // ignore
      }
    }
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
  });

  registerIpcHandlers(userDataDir, mainWindow);

  // Load the renderer
  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
