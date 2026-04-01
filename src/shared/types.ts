export const LOG_LEVELS = ['V', 'D', 'I', 'W', 'E', 'F'] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];
export type LogLevelFilter = 'ALL' | LogLevel;
export type Locale = 'es' | 'en';

export type SessionStatus =
  | 'idle'
  | 'starting'
  | 'streaming'
  | 'paused'
  | 'stopped'
  | 'error'
  | 'disconnected';

export type Emphasis = 'normal' | 'warning' | 'critical';

export interface DeviceInfo {
  id: string;
  state: string;
  model?: string;
  product?: string;
  transportId?: string;
  deviceName?: string;
}

export interface LogEntry {
  id: string;
  sequence: number;
  deviceId: string;
  raw: string;
  monthDay?: string;
  time?: string;
  pid?: number;
  tid?: number;
  level: LogLevel;
  tag: string;
  message: string;
  emphasis: Emphasis;
  receivedAt: string;
}

export interface FilterState {
  text: string;
  tag: string;
  packageName: string;
  minLevel: LogLevelFilter;
  search: string;
}

export interface AppSettings {
  adbPath: string;
  autoScroll: boolean;
  lastDeviceId: string | null;
  locale: Locale;
  filters: FilterState;
  logAnalysis: LogAnalysisConfig;
}

export interface LogAnalysisConfig {
  enableGrouping: boolean;
  enableHighlight: boolean;
}

export interface AdbStatus {
  available: boolean;
  resolvedPath: string | null;
  source: 'settings' | 'path' | 'env' | 'common' | 'missing';
  error?: string;
}

export interface DeviceListResponse {
  devices: DeviceInfo[];
  adbStatus: AdbStatus;
}

export interface SessionState {
  status: SessionStatus;
  deviceId: string | null;
  message?: string;
  startedAt?: string;
}

export interface StartSessionInput {
  deviceId: string;
  adbPath?: string;
}

export interface ClearBufferInput {
  deviceId: string;
  adbPath?: string;
}

export type ExportScope = 'visible' | 'all';
export type ExportFormat = 'txt' | 'log';

export interface ExportLogsInput {
  scope: ExportScope;
  format: ExportFormat;
  suggestedName: string;
  content?: string;
}

export interface ExportLogsResult {
  canceled: boolean;
  filePath?: string;
}

export interface UpdateCheckResult {
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  releaseUrl: string;
}

export interface LogBatchPayload {
  entries: LogEntry[];
}

export interface RendererApi {
  getSettings: () => Promise<AppSettings>;
  updateSettings: (partial: Partial<AppSettings>) => Promise<AppSettings>;
  getAdbStatus: () => Promise<AdbStatus>;
  listDevices: () => Promise<DeviceListResponse>;
  startLogcat: (input: StartSessionInput) => Promise<SessionState>;
  stopLogcat: () => Promise<SessionState>;
  pauseLogcat: () => Promise<SessionState>;
  resumeLogcat: () => Promise<SessionState>;
  clearLogcatBuffer: (input: ClearBufferInput) => Promise<void>;
  checkForUpdates: () => Promise<UpdateCheckResult>;
  exportLogs: (input: ExportLogsInput) => Promise<ExportLogsResult>;
  copyToClipboard: (text: string) => Promise<void>;
  onLogBatch: (listener: (payload: LogBatchPayload) => void) => () => void;
  onSessionState: (listener: (state: SessionState) => void) => () => void;
}

export const defaultFilters: FilterState = {
  text: '',
  tag: '',
  packageName: '',
  minLevel: 'ALL',
  search: ''
};

export const defaultLogAnalysisConfig: LogAnalysisConfig = {
  enableGrouping: false,
  enableHighlight: true
};

export const defaultSettings: AppSettings = {
  adbPath: '',
  autoScroll: true,
  lastDeviceId: null,
  locale: 'es',
  filters: defaultFilters,
  logAnalysis: defaultLogAnalysisConfig
};
