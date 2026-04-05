import type { JSX } from 'react';
import type { DeviceInfo, SessionState } from '@shared/types';
import { useI18n } from '@renderer/i18n/provider';
import { ModalShell } from '@renderer/components/modal-shell';

interface DeviceModalProps {
  devices: DeviceInfo[];
  isRefreshing: boolean;
  onClose: () => void;
  onRefreshDevices: () => void;
  onSelectDevice: (deviceId: string) => void;
  selectedDeviceId: string | null;
  sessionState: SessionState;
}

const deviceStateTone = (state: string): string => {
  if (state === 'device') {
    return 'border-[rgb(189_241_70/0.24)] bg-[rgb(189_241_70/0.12)] text-(--brand-700)';
  }

  if (state === 'offline') {
    return 'border-amber-400/18 bg-amber-500/10 text-amber-300';
  }

  return 'border-red-400/18 bg-red-500/10 text-red-300';
};

export const DeviceModal = ({
  devices,
  isRefreshing,
  onClose,
  onRefreshDevices,
  onSelectDevice,
  selectedDeviceId,
  sessionState
}: DeviceModalProps): JSX.Element => {
  const { copy } = useI18n();
  const sessionLabel =
    sessionState.status === 'error' || sessionState.status === 'disconnected'
      ? sessionState.message ?? copy.status[sessionState.status]
      : copy.status[sessionState.status];

  return (
  <ModalShell onClose={onClose} title={copy.modals.devices.title}>
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-(--foreground)">{copy.modals.devices.connectedCount(devices.length)}</p>
        <p className="mt-1 text-sm text-(--muted)">
          {copy.modals.devices.intro}
        </p>
      </div>
      <button
        className="flx-btn flx-btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
        disabled={isRefreshing}
        onClick={onRefreshDevices}
      >
        {isRefreshing ? `${copy.common.refresh}...` : copy.common.refresh}
      </button>
    </div>

    <div className="mt-5 space-y-3">
      {devices.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-(--border) bg-[rgb(11_13_12/0.82)] px-4 py-6 text-sm text-(--muted)">
          {copy.modals.devices.noDevices}
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
                  : 'border-(--border) bg-[rgb(14_17_15/0.7)] hover:border-[rgb(189_241_70/0.22)] hover:bg-[rgb(18_23_20/0.84)]'
              }`}
              onClick={() => {
                onSelectDevice(device.id);
                onClose();
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-(--foreground)">
                    {device.model ?? device.deviceName ?? copy.modals.devices.defaultDeviceName}
                  </p>
                  <p className="mt-1 font-mono text-xs text-(--muted)">{device.id}</p>
                  {device.product ? (
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-(--brand-500)">
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

    <div className="mt-5 rounded-2xl border border-(--border) bg-[rgb(11_13_12/0.8)] px-4 py-4 text-sm text-(--muted)">
      <span className="font-medium text-(--foreground)">{copy.modals.devices.session}:</span> {sessionLabel}
    </div>
  </ModalShell>
  );
};
