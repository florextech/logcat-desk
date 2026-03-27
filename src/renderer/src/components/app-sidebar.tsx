import type { JSX } from 'react';
import type { AdbStatus, DeviceInfo, SessionState } from '@shared/types';

interface AppSidebarProps {
  adbPath: string;
  adbStatus: AdbStatus;
  devices: DeviceInfo[];
  error: string | null;
  isRefreshing: boolean;
  isSubmittingAdbPath: boolean;
  onAdbPathChange: (value: string) => void;
  onRefreshDevices: () => void;
  onSaveAdbPath: () => void;
  onSelectDevice: (deviceId: string) => void;
  selectedDeviceId: string | null;
  sessionState: SessionState;
}

const deviceStateTone = (state: string): string => {
  if (state === 'device') {
    return 'border-[rgb(189_241_70/0.24)] bg-[rgb(189_241_70/0.12)] text-[var(--brand-700)]';
  }

  if (state === 'offline') {
    return 'border-amber-400/18 bg-amber-500/10 text-amber-300';
  }

  return 'border-red-400/18 bg-red-500/10 text-red-300';
};

export const AppSidebar = ({
  adbPath,
  adbStatus,
  devices,
  error,
  isRefreshing,
  isSubmittingAdbPath,
  onAdbPathChange,
  onRefreshDevices,
  onSaveAdbPath,
  onSelectDevice,
  selectedDeviceId,
  sessionState
}: AppSidebarProps): JSX.Element => (
  <aside className="flx-shell flex min-h-0 flex-col p-3">
    <div className="flx-card rounded-[20px] bg-[linear-gradient(180deg,_rgba(23,31,18,0.9),_rgba(17,21,19,0.84))] px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[var(--brand-500)]">
            Logcat
          </p>
          <h2 className="mt-3 text-3xl font-semibold leading-none tracking-tight text-[var(--foreground)]">
            Desk
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)]">ADB-first log viewer for macOS.</p>
        </div>
        <div className="flx-pill">
          MVP
        </div>
      </div>
    </div>

    <div className="mt-3 flx-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--brand-500)]">Setup</p>
          <p className="mt-2 text-sm font-medium text-[var(--foreground)]">
            {adbStatus.available ? 'ADB listo' : 'ADB no disponible'}
          </p>
        </div>
        <div
          className={`h-3 w-3 rounded-full ${
            adbStatus.available
              ? 'bg-[var(--brand-600)] shadow-[0_0_20px_rgba(189,241,70,0.75)]'
              : 'bg-red-400 shadow-[0_0_20px_rgba(239,68,68,0.8)]'
          }`}
        />
      </div>

      <p className="mt-1 text-xs text-[var(--muted)]">
        {adbStatus.resolvedPath ?? 'Usa PATH o configura la ruta manual.'}
      </p>

      <label className="mt-4 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
        Custom adb path
      </label>
      <input
        className="flx-focus mt-2 w-full rounded-2xl border border-[var(--border)] bg-[rgb(11_13_12/0.88)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[rgb(189_241_70/0.42)]"
        placeholder="/opt/homebrew/bin/adb"
        value={adbPath}
        onChange={(event) => onAdbPathChange(event.target.value)}
      />

      <button
        className="flx-btn flx-btn-secondary mt-3 w-full disabled:cursor-not-allowed disabled:opacity-50"
        disabled={isSubmittingAdbPath}
        onClick={onSaveAdbPath}
      >
        {isSubmittingAdbPath ? 'Saving...' : 'Save ADB path'}
      </button>
    </div>

    <div className="mt-3 flx-card flex min-h-0 flex-1 flex-col p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--brand-500)]">
            Devices
          </p>
          <p className="mt-2 text-sm text-[var(--foreground)]">{devices.length} connected</p>
        </div>
        <button
          className="flx-btn flx-btn-secondary rounded-full px-3 py-2 text-xs uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isRefreshing}
          onClick={onRefreshDevices}
        >
          {isRefreshing ? 'Refreshing' : 'Refresh'}
        </button>
      </div>

      <div className="mt-4 flex-1 space-y-3 overflow-auto pr-1">
        {devices.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[rgb(11_13_12/0.82)] px-4 py-5 text-sm text-[var(--muted)]">
            No Android devices detected.
          </div>
        ) : (
          devices.map((device) => {
            const selected = selectedDeviceId === device.id;

            return (
              <button
                key={device.id}
                className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                  selected
                    ? 'border-[rgb(189_241_70/0.42)] bg-[linear-gradient(180deg,_rgba(34,42,24,0.84),_rgba(17,21,19,0.88))] shadow-[0_0_0_1px_rgba(189,241,70,0.12)]'
                    : 'border-[var(--border)] bg-[rgb(14_17_15/0.7)] hover:border-[rgb(189_241_70/0.22)] hover:bg-[rgb(18_23_20/0.84)]'
                }`}
                onClick={() => onSelectDevice(device.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      {device.model ?? device.deviceName ?? 'Android device'}
                    </p>
                    <p className="mt-1 font-mono text-xs text-[var(--muted)]">{device.id}</p>
                    {device.product ? (
                      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[var(--brand-500)]">
                        {device.product}
                      </p>
                    ) : null}
                  </div>
                    <span
                    className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${deviceStateTone(device.state)}`}
                  >
                    {device.state}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>

    <div className="mt-3 flx-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--brand-500)]">
            Session
          </p>
          <p className="mt-2 text-sm font-medium text-[var(--foreground)]">{sessionState.status}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">{sessionState.message ?? 'Waiting for capture.'}</p>
        </div>
        <div className="flx-pill">{selectedDeviceId ? 'Ready' : 'No device'}</div>
      </div>
    </div>

    {error ? (
      <div className="mt-3 rounded-[20px] border border-red-400/20 bg-red-500/8 p-4 text-sm text-red-200">
        {error}
      </div>
    ) : null}
  </aside>
);
