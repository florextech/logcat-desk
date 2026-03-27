import { app, BrowserWindow } from 'electron';
import { join } from 'node:path';
import { registerIpc } from '@main/ipc/register-ipc';
import { ExportService } from '@main/services/export/export-service';
import { LogcatSessionManager } from '@main/services/logcat/logcat-session-manager';
import { SettingsStore } from '@main/services/settings/settings-store';

let mainWindow: BrowserWindow | null = null;

const createMainWindow = async (): Promise<void> => {
  const window = new BrowserWindow({
    width: 1540,
    height: 960,
    minWidth: 1220,
    minHeight: 760,
    title: 'Logcat Desk',
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#050811',
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow = window;

  const settingsStore = new SettingsStore();
  const sessionManager = new LogcatSessionManager();
  const exportService = new ExportService(sessionManager);

  registerIpc({
    mainWindow: window,
    settingsStore,
    sessionManager,
    exportService
  });

  window.on('closed', () => {
    void sessionManager.stop(false);
    mainWindow = null;
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    await window.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    await window.loadFile(join(__dirname, '../renderer/index.html'));
  }

};

app.whenReady().then(async () => {
  await createMainWindow();

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
