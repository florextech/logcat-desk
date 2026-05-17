import { create } from 'zustand';
import {
  defaultSettings,
  type AdbStatus,
  type AnalysisConfig,
  type AIConfig,
  type AppSettings,
  type DeviceInfo,
  type FilterState,
  type LogAnalysisConfig,
  type LogEntry,
  type SessionState
} from '@shared/types';

const MAX_RENDERED_LOGS = 5000;
const FALLBACK_AI_CONFIG = {
  provider: 'openai',
  apiKey: '',
  model: ''
} as const;

interface AppState {
  activeProjectId: string;
  adbStatus: AdbStatus;
  devices: DeviceInfo[];
  logs: LogEntry[];
  filters: FilterState;
  settings: AppSettings;
  selectedDeviceId: string | null;
  sessionState: SessionState;
  error: string | null;
  setAdbStatus: (status: AdbStatus) => void;
  setDevices: (devices: DeviceInfo[], preferredDeviceId?: string | null) => void;
  appendLogs: (entries: LogEntry[]) => void;
  clearLogs: () => void;
  setFilters: (partial: Partial<FilterState>) => void;
  setAutoScroll: (value: boolean) => void;
  setLogAnalysis: (partial: Partial<LogAnalysisConfig>) => void;
  setAnalysisConfig: (partial: Partial<AnalysisConfig>) => void;
  setAnalysisAI: (partial: Partial<AIConfig>) => void;
  setSettings: (settings: AppSettings) => void;
  setSessionState: (state: SessionState) => void;
  selectDevice: (deviceId: string) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setActiveProjectId: (projectId: string) => void;
  saveFilterPreset: (name: string) => void;
  applyFilterPreset: (presetId: string) => void;
  deleteFilterPreset: (presetId: string) => void;
  saveSessionSnapshot: () => void;
  restoreSessionSnapshot: () => void;
  addSnippet: (logId: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  activeProjectId: 'default',
  adbStatus: {
    available: false,
    resolvedPath: null,
    source: 'missing'
  },
  devices: [],
  logs: [],
  filters: defaultSettings.filters,
  settings: defaultSettings,
  selectedDeviceId: null,
  sessionState: {
    status: 'idle',
    deviceId: null
  },
  error: null,
  setAdbStatus: (status) => set({ adbStatus: status }),
  setDevices: (devices, preferredDeviceId) =>
    set((state) => {
      const selectedStillExists = state.selectedDeviceId
        ? devices.some((device) => device.id === state.selectedDeviceId)
        : false;

      const nextSelected =
        selectedStillExists
          ? state.selectedDeviceId
          : preferredDeviceId && devices.some((device) => device.id === preferredDeviceId)
            ? preferredDeviceId
            : devices[0]?.id ?? null;

      return {
        devices,
        selectedDeviceId: nextSelected
      };
    }),
  appendLogs: (entries) =>
    set((state) => ({
      logs: [...state.logs, ...entries].slice(-MAX_RENDERED_LOGS)
    })),
  clearLogs: () => set({ logs: [] }),
  setFilters: (partial) =>
    set((state) => ({
      filters: {
        ...state.filters,
        ...partial
      }
    })),
  setAutoScroll: (value) =>
    set((state) => ({
      settings: {
        ...state.settings,
        autoScroll: value
      }
    })),
  setLogAnalysis: (partial) =>
    set((state) => ({
      settings: {
        ...state.settings,
        logAnalysis: {
          ...state.settings.logAnalysis,
          ...partial
        }
      }
    })),
  setAnalysisConfig: (partial) =>
    set((state) => {
      const currentAi = state.settings.analysis.ai ?? defaultSettings.analysis.ai ?? FALLBACK_AI_CONFIG;
      const nextAiPartial = partial.ai;

      return {
        settings: {
          ...state.settings,
          analysis: {
            ...state.settings.analysis,
            ...partial,
            ai: {
              provider: nextAiPartial?.provider ?? currentAi.provider,
              apiKey: nextAiPartial?.apiKey ?? currentAi.apiKey,
              model: nextAiPartial?.model ?? currentAi.model
            }
          }
        }
      };
    }),
  setAnalysisAI: (partial) =>
    set((state) => {
      const currentAi = state.settings.analysis.ai ?? defaultSettings.analysis.ai ?? FALLBACK_AI_CONFIG;

      return {
        settings: {
          ...state.settings,
          analysis: {
            ...state.settings.analysis,
            ai: {
              provider: partial.provider ?? currentAi.provider,
              apiKey: partial.apiKey ?? currentAi.apiKey,
              model: partial.model ?? currentAi.model
            }
          }
        }
      };
    }),
  setSettings: (settings) =>
    set({
      settings,
      filters: settings.filters,
      selectedDeviceId: settings.lastDeviceId
    }),
  setSessionState: (sessionState) => set({ sessionState }),
  selectDevice: (deviceId) => set({ selectedDeviceId: deviceId }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  setActiveProjectId: (projectId) => set({ activeProjectId: projectId }),
  saveFilterPreset: (name) =>
    set((state) => {
      const trimmed = name.trim();
      if (!trimmed) {
        return state;
      }

      const now = new Date().toISOString();
      return {
        settings: {
          ...state.settings,
          filterPresets: [
            {
              id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
              name: trimmed,
              filters: { ...state.filters },
              updatedAt: now
            },
            ...state.settings.filterPresets
          ]
        }
      };
    }),
  applyFilterPreset: (presetId) =>
    set((state) => {
      const preset = state.settings.filterPresets.find((entry) => entry.id === presetId);
      if (!preset) {
        return state;
      }

      return {
        filters: { ...preset.filters }
      };
    }),
  deleteFilterPreset: (presetId) =>
    set((state) => ({
      settings: {
        ...state.settings,
        filterPresets: state.settings.filterPresets.filter((entry) => entry.id !== presetId)
      }
    })),
  saveSessionSnapshot: () =>
    set((state) => ({
      settings: {
        ...state.settings,
        projectSessions: {
          ...state.settings.projectSessions,
          [state.activeProjectId]: {
            filters: { ...state.filters },
            lastDeviceId: state.selectedDeviceId,
            updatedAt: new Date().toISOString()
          }
        }
      }
    })),
  restoreSessionSnapshot: () =>
    set((state) => {
      const snapshot = state.settings.projectSessions[state.activeProjectId];
      if (!snapshot) {
        return state;
      }

      return {
        filters: { ...snapshot.filters },
        selectedDeviceId: snapshot.lastDeviceId
      };
    }),
  addSnippet: (logId) =>
    set((state) => {
      const target = state.logs.find((entry) => entry.id === logId);
      if (!target) {
        return state;
      }

      return {
        settings: {
          ...state.settings,
          savedSnippets: [
            {
              id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
              createdAt: new Date().toISOString(),
              deviceId: target.deviceId,
              level: target.level,
              tag: target.tag,
              message: target.message,
              raw: target.raw
            },
            ...state.settings.savedSnippets
          ].slice(0, 300)
        }
      };
    })
}));
