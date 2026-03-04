const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const OPENCLAW_DIR = path.join(os.homedir(), '.openclaw');
const isDev = !app.isPackaged;

// Allow autoplay without user gesture (needed for TTS audio playback)
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
// Enable speech recognition in Electron
app.commandLine.appendSwitch('enable-speech-dispatcher');
app.commandLine.appendSwitch('enable-features', 'WebSpeechAPI');

function createWindow() {
    const win = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 700,
        titleBarStyle: 'hiddenInset',
        trafficLightPosition: { x: 16, y: 16 },
        backgroundColor: '#07070d',
        icon: path.join(__dirname, '..', 'assets', 'icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    // Grant ALL permission requests (media, microphone, audio, speech, etc.)
    win.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
        const allowedPermissions = [
            'media',
            'mediaKeySystem',
            'audioCapture',
            'microphone',
            'geolocation',
            'notifications',
            'midi',
            'midiSysex',
            'pointerLock',
            'fullscreen',
            'openExternal',
            'unknown',
            'clipboard-read',
            'clipboard-sanitized-write',
            'window-management',
            'speaker-selection',
            'storage-access',
        ];
        if (allowedPermissions.includes(permission)) {
            callback(true);
        } else {
            callback(true); // Grant all permissions broadly
        }
    });

    win.webContents.session.setPermissionCheckHandler((webContents, permission, requestingOrigin) => {
        // Allow all permission checks
        return true;
    });

    if (isDev) {
        win.loadURL('http://localhost:5173');
        win.webContents.openDevTools({ mode: 'detach' });
    } else {
        win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
    }

    // Pre-request microphone access so SpeechRecognition works
    win.webContents.on('did-finish-load', () => {
        win.webContents.executeJavaScript(`
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    console.log('[C3] Microphone access granted');
                    stream.getTracks().forEach(t => t.stop());
                })
                .catch(err => console.warn('[C3] Mic access error:', err.message));
        `);
    });
}

// IPC handlers for filesystem access
ipcMain.handle('openclaw:read-file', async (_event, relativePath) => {
    try {
        const fullPath = path.join(OPENCLAW_DIR, relativePath);
        // Security: ensure we don't escape the openclaw directory
        if (!fullPath.startsWith(OPENCLAW_DIR)) {
            throw new Error('Access denied');
        }
        const content = await fs.promises.readFile(fullPath, 'utf-8');
        return { ok: true, content };
    } catch (err) {
        return { ok: false, error: err.message };
    }
});

ipcMain.handle('openclaw:read-dir', async (_event, relativePath) => {
    try {
        const fullPath = path.join(OPENCLAW_DIR, relativePath || '');
        if (!fullPath.startsWith(OPENCLAW_DIR)) {
            throw new Error('Access denied');
        }
        const entries = await fs.promises.readdir(fullPath, { withFileTypes: true });
        const result = await Promise.all(
            entries
                .filter((e) => !e.name.startsWith('.'))
                .map(async (e) => {
                    const entryPath = path.join(fullPath, e.name);
                    let size = 0;
                    if (e.isFile()) {
                        const stat = await fs.promises.stat(entryPath);
                        size = stat.size;
                    }
                    return {
                        name: e.name,
                        isDir: e.isDirectory(),
                        size,
                    };
                })
        );
        return { ok: true, entries: result };
    } catch (err) {
        return { ok: false, error: err.message };
    }
});

ipcMain.handle('openclaw:file-exists', async (_event, relativePath) => {
    try {
        const fullPath = path.join(OPENCLAW_DIR, relativePath);
        if (!fullPath.startsWith(OPENCLAW_DIR)) return false;
        await fs.promises.access(fullPath);
        return true;
    } catch {
        return false;
    }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

