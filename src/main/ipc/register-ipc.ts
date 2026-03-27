import { clipboard, dialog, ipcMain } from 'electron';
import type { BrowserWindow } from 'electron';
import { clearLogcatBuffer } from '@main/services/adb/device-service';
import { resolveAdbStatus } from '@main/services/adb/adb-resolver';
import { ExportService } from '@main/services/export/export-service';
import { LogcatSessionManager } from '@main/services/logcat/logcat-session-manager';
import { SettingsStore } from '@main/services/settings/settings-store';
import { ipcChannels } from '@shared/ipc';
import type {
  AppSettings,
  ClearBufferInput,
  ExportLogsInput,
  StartSessionInput
} from '@shared/types';
import { listDevices } from '@main/services/adb/device-service';

interface RegisterIpcDependencies {
  mainWindow: BrowserWindow;
  settingsStore: SettingsStore;
  sessionManager: LogcatSessionManager;
  exportService: ExportService;
}

const resolveConfiguredAdb = async (settingsStore: SettingsStore, customPath?: string) => {
  const settings = await settingsStore.getSettings();
  const status = await resolveAdbStatus(customPath ?? settings.adbPath);

  if (!status.available || !status.resolvedPath) {
    throw new Error(status.error ?? 'ADB is not available on this machine.');
  }

  return status;
};

export const registerIpc = ({
  mainWindow,
  settingsStore,
  sessionManager,
  exportService
}: RegisterIpcDependencies): void => {
  const safeHandle = <TArgs extends unknown[], TResult>(
    channel: string,
    listener: (_event: Electron.IpcMainInvokeEvent, ...args: TArgs) => Promise<TResult> | TResult
  ): void => {
    ipcMain.removeHandler(channel);
    ipcMain.handle(channel, listener);
  };

  sessionManager.on('log-batch', (payload) => {
    mainWindow.webContents.send(ipcChannels.events.logBatch, payload);
  });

  sessionManager.on('session-state', (state) => {
    mainWindow.webContents.send(ipcChannels.events.sessionState, state);
  });

  safeHandle(ipcChannels.settingsGet, async () => settingsStore.getSettings());

  safeHandle(ipcChannels.settingsUpdate, async (_, partial: Partial<AppSettings>) =>
    settingsStore.update(partial)
  );

  safeHandle(ipcChannels.adbStatusGet, async () => {
    const settings = await settingsStore.getSettings();
    return resolveAdbStatus(settings.adbPath);
  });

  safeHandle(ipcChannels.devicesList, async () => {
    const settings = await settingsStore.getSettings();
    const adbStatus = await resolveAdbStatus(settings.adbPath);

    if (!adbStatus.available || !adbStatus.resolvedPath) {
      return { devices: [], adbStatus };
    }

    const devices = await listDevices(adbStatus.resolvedPath);
    return { devices, adbStatus };
  });

  safeHandle(ipcChannels.logcatStart, async (_, input: StartSessionInput) => {
    const adbStatus = await resolveConfiguredAdb(settingsStore, input.adbPath);
    await settingsStore.update({ lastDeviceId: input.deviceId });
    await sessionManager.start({
      adbPath: adbStatus.resolvedPath as string,
      deviceId: input.deviceId
    });
    return sessionManager.getState();
  });

  safeHandle(ipcChannels.logcatStop, async () => {
    await sessionManager.stop();
    return sessionManager.getState();
  });

  safeHandle(ipcChannels.logcatPause, async () => {
    sessionManager.pause();
    return sessionManager.getState();
  });

  safeHandle(ipcChannels.logcatResume, async () => {
    sessionManager.resume();
    return sessionManager.getState();
  });

  safeHandle(ipcChannels.logcatClearBuffer, async (_, input: ClearBufferInput) => {
    const adbStatus = await resolveConfiguredAdb(settingsStore, input.adbPath);
    await clearLogcatBuffer(adbStatus.resolvedPath as string, input.deviceId);
  });

  safeHandle(ipcChannels.exportLogs, async (_, input: ExportLogsInput) => {
    return exportService.exportWithDialog(input, dialog);
  });

  safeHandle(ipcChannels.clipboardCopy, async (_, text: string) => {
    clipboard.writeText(text);
  });
};
