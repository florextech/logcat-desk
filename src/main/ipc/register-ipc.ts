import { app, clipboard, dialog, ipcMain, shell } from 'electron';
import type { BrowserWindow } from 'electron';
import { clearLogcatBuffer, listDevices } from '@main/services/adb/device-service';
import { resolveAdbStatus } from '@main/services/adb/adb-resolver';
import { enhanceAnalysisSummary } from '@main/services/analysis/analysis-ai-service';
import { ExportService } from '@main/services/export/export-service';
import { LogcatSessionManager } from '@main/services/logcat/logcat-session-manager';
import { SettingsStore } from '@main/services/settings/settings-store';
import { getUpdateCheckFailedCopy, getUpdateDialogCopy } from '@main/services/update/update-dialog-copy';
import { UpdateService } from '@main/services/update/update-service';
import { ipcChannels } from '@shared/ipc';
import type {
  AppSettings,
  ClearBufferInput,
  EnhanceAnalysisSummaryInput,
  ExportLogsInput,
  StartSessionInput
} from '@shared/types';

interface RegisterIpcDependencies {
  mainWindow: BrowserWindow;
  settingsStore: SettingsStore;
  sessionManager: LogcatSessionManager;
  exportService: ExportService;
  updateService: UpdateService;
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
  exportService,
  updateService
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

  safeHandle(ipcChannels.updatesCheck, async () => {
    const settings = await settingsStore.getSettings();
    const locale = settings.locale;
    try {
      const result = await updateService.checkLatestRelease(app.getVersion());
      const copy = getUpdateDialogCopy(locale, result);

      if (result.hasUpdate) {
        const dialogResult = await dialog.showMessageBox(mainWindow, {
          type: 'info',
          title: copy.availableTitle,
          message: copy.availableMessage,
          detail: copy.availableDetail,
          buttons: [copy.openDownloadLabel, copy.closeLabel],
          defaultId: 0,
          cancelId: 1
        });

        if (dialogResult.response === 0) {
          await shell.openExternal(result.releaseUrl);
        }
      } else {
        await dialog.showMessageBox(mainWindow, {
          type: 'info',
          title: copy.upToDateTitle,
          message: copy.upToDateMessage,
          buttons: [copy.closeLabel],
          defaultId: 0
        });
      }

      return result;
    } catch (error_) {
      const copy = getUpdateCheckFailedCopy(locale);
      const message =
        error_ instanceof Error
          ? error_.message
          : copy.checkFailedMessage;

      await dialog.showMessageBox(mainWindow, {
        type: 'error',
        title: copy.checkFailedTitle,
        message,
        buttons: [copy.closeLabel],
        defaultId: 0
      });

      throw error_;
    }
  });

  safeHandle(ipcChannels.exportLogs, async (_, input: ExportLogsInput) => {
    return exportService.exportWithDialog(input, dialog);
  });

  safeHandle(ipcChannels.analysisEnhanceSummary, async (_, input: EnhanceAnalysisSummaryInput) => {
    return enhanceAnalysisSummary(input);
  });

  safeHandle(ipcChannels.clipboardCopy, async (_, text: string) => {
    clipboard.writeText(text);
  });
};
