export const ipcChannels = {
  settingsGet: 'settings:get',
  settingsUpdate: 'settings:update',
  adbStatusGet: 'adb-status:get',
  devicesList: 'devices:list',
  logcatStart: 'logcat:start',
  logcatStop: 'logcat:stop',
  logcatPause: 'logcat:pause',
  logcatResume: 'logcat:resume',
  logcatClearBuffer: 'logcat:clear-buffer',
  updatesCheck: 'updates:check',
  exportLogs: 'export:logs',
  clipboardCopy: 'clipboard:copy',
  events: {
    logBatch: 'events:log-batch',
    sessionState: 'events:session-state'
  }
} as const;
