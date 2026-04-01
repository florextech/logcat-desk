import { contextBridge, ipcRenderer } from 'electron';
import { ipcChannels } from '@shared/ipc';
import type { RendererApi } from '@shared/types';

const api: RendererApi = {
  getSettings: () => ipcRenderer.invoke(ipcChannels.settingsGet),
  updateSettings: (partial) => ipcRenderer.invoke(ipcChannels.settingsUpdate, partial),
  getAdbStatus: () => ipcRenderer.invoke(ipcChannels.adbStatusGet),
  listDevices: () => ipcRenderer.invoke(ipcChannels.devicesList),
  startLogcat: (input) => ipcRenderer.invoke(ipcChannels.logcatStart, input),
  stopLogcat: () => ipcRenderer.invoke(ipcChannels.logcatStop),
  pauseLogcat: () => ipcRenderer.invoke(ipcChannels.logcatPause),
  resumeLogcat: () => ipcRenderer.invoke(ipcChannels.logcatResume),
  clearLogcatBuffer: (input) => ipcRenderer.invoke(ipcChannels.logcatClearBuffer, input),
  checkForUpdates: () => ipcRenderer.invoke(ipcChannels.updatesCheck),
  exportLogs: (input) => ipcRenderer.invoke(ipcChannels.exportLogs, input),
  copyToClipboard: (text) => ipcRenderer.invoke(ipcChannels.clipboardCopy, text),
  onLogBatch: (listener) => {
    const wrapped = (_event: Electron.IpcRendererEvent, payload: Parameters<typeof listener>[0]) =>
      listener(payload);
    ipcRenderer.on(ipcChannels.events.logBatch, wrapped);
    return () => ipcRenderer.removeListener(ipcChannels.events.logBatch, wrapped);
  },
  onSessionState: (listener) => {
    const wrapped = (_event: Electron.IpcRendererEvent, payload: Parameters<typeof listener>[0]) =>
      listener(payload);
    ipcRenderer.on(ipcChannels.events.sessionState, wrapped);
    return () => ipcRenderer.removeListener(ipcChannels.events.sessionState, wrapped);
  }
};

contextBridge.exposeInMainWorld('logcatDesk', api);
