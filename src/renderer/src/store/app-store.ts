import { create } from 'zustand';
import { defaultSettings, type AdbStatus, type AppSettings, type DeviceInfo, type FilterState, type LogEntry, type SessionState } from '@shared/types';

const MAX_RENDERED_LOGS = 5000;

interface AppState {
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
  setSettings: (settings: AppSettings) => void;
  setSessionState: (state: SessionState) => void;
  selectDevice: (deviceId: string) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
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
    deviceId: null,
    message: 'Ready'
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
  setSettings: (settings) =>
    set({
      settings,
      filters: settings.filters,
      selectedDeviceId: settings.lastDeviceId
    }),
  setSessionState: (sessionState) => set({ sessionState }),
  selectDevice: (deviceId) => set({ selectedDeviceId: deviceId }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null })
}));
