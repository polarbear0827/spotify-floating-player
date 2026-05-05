// Electron main process
const { app, BrowserWindow, ipcMain, shell, session } = require('electron');
const path = require('path');
const http = require('http');
const url = require('url');
const Store = require('electron-store');

const store = new Store({
  defaults: {
    bounds: { x: undefined, y: undefined, width: 700, height: 400 },
    opacity: 1.0,
    alwaysOnTop: true,
    clientId: '',
    tokens: null, // { access_token, refresh_token, expires_at }
  },
});

let mainWindow = null;
let oauthServer = null;

const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  const bounds = store.get('bounds');
  const alwaysOnTop = store.get('alwaysOnTop');
  const opacity = store.get('opacity');

  mainWindow = new BrowserWindow({
    width: bounds.width || 700,
    height: bounds.height || 400,
    x: bounds.x,
    y: bounds.y,
    minWidth: 320,
    minHeight: 180,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: alwaysOnTop,
    resizable: true,
    hasShadow: false,
    roundedCorners: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.setOpacity(opacity);

  // Load renderer
  if (isDev) {
    mainWindow.loadURL('http://127.0.0.1:5173');
    if (process.env.OPEN_DEVTOOLS) {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Save bounds on resize/move
  const saveBounds = () => {
    if (!mainWindow.isDestroyed()) {
      store.set('bounds', mainWindow.getBounds());
    }
  };
  mainWindow.on('resize', saveBounds);
  mainWindow.on('move', saveBounds);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// =============== IPC handlers ===============

ipcMain.handle('config:get', (_e, key) => store.get(key));
ipcMain.handle('config:set', (_e, key, value) => {
  store.set(key, value);
  return true;
});

ipcMain.handle('window:minimize', () => mainWindow?.minimize());
ipcMain.handle('window:close', () => mainWindow?.close());
ipcMain.handle('window:toggleAlwaysOnTop', () => {
  if (!mainWindow) return false;
  const next = !mainWindow.isAlwaysOnTop();
  mainWindow.setAlwaysOnTop(next);
  store.set('alwaysOnTop', next);
  return next;
});
ipcMain.handle('window:isAlwaysOnTop', () => mainWindow?.isAlwaysOnTop() ?? false);
ipcMain.handle('window:setOpacity', (_e, value) => {
  if (!mainWindow) return;
  const v = Math.max(0.1, Math.min(1.0, value));
  mainWindow.setOpacity(v);
  store.set('opacity', v);
});

// ---- PKCE OAuth ----
// Renderer requests an authorization URL; we start a local HTTP server to catch the callback.
ipcMain.handle('oauth:start', async (_e, { clientId, scopes, codeChallenge, redirectUri }) => {
  return new Promise((resolve, reject) => {
    if (oauthServer) {
      try { oauthServer.close(); } catch {}
      oauthServer = null;
    }

    const port = 8888;
    oauthServer = http.createServer((req, res) => {
      const parsed = url.parse(req.url, true);
      if (parsed.pathname === '/callback') {
        const { code, error } = parsed.query;
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        if (error) {
          res.end(`<html><body style="font-family:sans-serif;background:#121212;color:#fff;padding:40px;text-align:center;"><h2>授權失敗</h2><p>${error}</p><p>你可以關閉這個視窗</p></body></html>`);
          oauthServer.close();
          oauthServer = null;
          reject(new Error(error));
          return;
        }
        res.end(`<html><body style="font-family:sans-serif;background:#121212;color:#1DB954;padding:40px;text-align:center;"><h2>✅ 授權成功</h2><p>你可以關閉這個視窗，回到 Spotify Floating Player</p><script>setTimeout(()=>window.close(),1500)</script></body></html>`);
        oauthServer.close();
        oauthServer = null;
        resolve(code);
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    oauthServer.listen(port, '127.0.0.1', () => {
      const authUrl =
        'https://accounts.spotify.com/authorize?' +
        new URLSearchParams({
          client_id: clientId,
          response_type: 'code',
          redirect_uri: redirectUri,
          code_challenge_method: 'S256',
          code_challenge: codeChallenge,
          scope: scopes,
        }).toString();
      shell.openExternal(authUrl);
    });

    oauthServer.on('error', (err) => reject(err));

    // Timeout safety: 5 min
    setTimeout(() => {
      if (oauthServer) {
        try { oauthServer.close(); } catch {}
        oauthServer = null;
        reject(new Error('OAuth timeout'));
      }
    }, 5 * 60 * 1000);
  });
});

ipcMain.handle('oauth:cancel', () => {
  if (oauthServer) {
    try { oauthServer.close(); } catch {}
    oauthServer = null;
  }
});

// =============== App lifecycle ===============

app.whenReady().then(() => {
  // Allow Spotify CDN images
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({ responseHeaders: details.responseHeaders });
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
