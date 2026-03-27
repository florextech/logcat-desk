import type {
  AdbStatus,
  AppSettings,
  DeviceListResponse,
  ExportLogsInput,
  ExportLogsResult,
  LogBatchPayload,
  RendererApi,
  SessionState
} from '@shared/types';
import { defaultSettings } from '@shared/types';

const preloadUnavailableMessage =
  'The Electron preload API is unavailable. Restart the app after rebuilding the desktop process.';

const rejectUnavailable = async (): Promise<never> => {
  throw new Error(preloadUnavailableMessage);
};

const noopUnsubscribe = (): (() => void) => () => undefined;
const globalScope = globalThis as typeof globalThis & {
  logcatDesk?: RendererApi;
};

const fallbackApi: RendererApi = {
  getSettings: async (): Promise<AppSettings> => defaultSettings,
  updateSettings: async (): Promise<AppSettings> => defaultSettings,
  getAdbStatus: async (): Promise<AdbStatus> => ({
    available: false,
    resolvedPath: null,
    source: 'missing',
    error: preloadUnavailableMessage
  }),
  listDevices: async (): Promise<DeviceListResponse> => ({
    devices: [],
    adbStatus: {
      available: false,
      resolvedPath: null,
      source: 'missing',
      error: preloadUnavailableMessage
    }
  }),
  startLogcat: async (): Promise<SessionState> => rejectUnavailable(),
  stopLogcat: async (): Promise<SessionState> => rejectUnavailable(),
  pauseLogcat: async (): Promise<SessionState> => rejectUnavailable(),
  resumeLogcat: async (): Promise<SessionState> => rejectUnavailable(),
  clearLogcatBuffer: async (): Promise<void> => rejectUnavailable(),
  exportLogs: async (_input: ExportLogsInput): Promise<ExportLogsResult> => rejectUnavailable(),
  copyToClipboard: async (): Promise<void> => rejectUnavailable(),
  onLogBatch: (_listener: (payload: LogBatchPayload) => void) => noopUnsubscribe(),
  onSessionState: (_listener: (state: SessionState) => void) => noopUnsubscribe()
};

export const electronApi: RendererApi = globalScope.logcatDesk ?? fallbackApi;
export const hasElectronApi = Boolean(globalScope.logcatDesk);
