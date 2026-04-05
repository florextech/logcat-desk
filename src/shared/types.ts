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
  analysis: AnalysisConfig;
}

export interface LogAnalysisConfig {
  enableGrouping: boolean;
  enableHighlight: boolean;
}

export type AIProvider = 'openai' | 'gemini' | 'openrouter' | 'claude';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
}

export interface AnalysisConfig {
  enableAnalysis: boolean;
  enableAIEnhancement: boolean;
  ai?: AIConfig;
}

export type AnalysisSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface LogAnalysisPayload {
  summary: string;
  probableCauses: string[];
  evidence: string[];
  recommendations: string[];
  severity: AnalysisSeverity;
}

export interface EnhanceAnalysisSummaryInput {
  base: LogAnalysisPayload;
  config: AnalysisConfig;
  locale: Locale;
}

export interface AnalysisChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface AskAnalysisAssistantInput {
  analysis: LogAnalysisPayload;
  config: AnalysisConfig;
  locale: Locale;
  question: string;
  history?: AnalysisChatTurn[];
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
  enhanceAnalysisSummary: (input: EnhanceAnalysisSummaryInput) => Promise<string>;
  askAnalysisAssistant: (input: AskAnalysisAssistantInput) => Promise<string>;
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

export const defaultAnalysisConfig: AnalysisConfig = {
  enableAnalysis: true,
  enableAIEnhancement: false,
  ai: {
    provider: 'openai',
    apiKey: '',
    model: ''
  }
};

export const defaultSettings: AppSettings = {
  adbPath: '',
  autoScroll: true,
  lastDeviceId: null,
  locale: 'es',
  filters: defaultFilters,
  logAnalysis: defaultLogAnalysisConfig,
  analysis: defaultAnalysisConfig
};
