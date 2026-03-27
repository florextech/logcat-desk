import { type JSX, useEffect, useMemo, useState } from 'react';
import { ActionsModal } from '@renderer/components/actions-modal';
import { CommandBar } from '@renderer/components/command-bar';
import { DeviceModal } from '@renderer/components/device-modal';
import { EmptyState } from '@renderer/components/empty-state';
import { IconButton } from '@renderer/components/icon-button';
import { LogConsole } from '@renderer/components/log-console';
import { SettingsModal } from '@renderer/components/settings-modal';
import { StatusBadge } from '@renderer/components/status-badge';
import { useAppBootstrap } from '@renderer/hooks/use-app-bootstrap';
import { useLogcatEvents } from '@renderer/hooks/use-logcat-events';
import { electronApi } from '@renderer/services/electron-api';
import { useAppStore } from '@renderer/store/app-store';
import { filterLogs } from '@renderer/utils/log-filtering';

export const App = (): JSX.Element => {
  const {
    adbStatus,
    devices,
    filters,
    logs,
    selectedDeviceId,
    sessionState,
    settings,
    error,
    setError,
    clearError,
    setFilters,
    clearLogs,
    setAutoScroll,
    setSettings,
    setSessionState,
    selectDevice
  } = useAppStore();

  const { ready, refreshDevices } = useAppBootstrap();
  useLogcatEvents();

  const [adbPathDraft, setAdbPathDraft] = useState(settings.adbPath);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmittingAdbPath, setIsSubmittingAdbPath] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDevicesOpen, setIsDevicesOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);

  useEffect(() => {
    setAdbPathDraft(settings.adbPath);
  }, [settings.adbPath]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    const timer = window.setTimeout(() => {
      electronApi
        .updateSettings({
          autoScroll: settings.autoScroll,
          lastDeviceId: selectedDeviceId,
          filters
        })
        .then((updated) => {
          setSettings(updated);
        })
        .catch((updateError) => {
          setError(updateError instanceof Error ? updateError.message : 'Failed to persist preferences.');
        });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [ready, selectedDeviceId, filters, settings.autoScroll, setError, setSettings]);

  const filteredLogs = useMemo(() => filterLogs(logs, filters), [logs, filters]);
  const selectedDevice = devices.find((device) => device.id === selectedDeviceId) ?? null;

  const refreshDeviceList = async (): Promise<void> => {
    setIsRefreshing(true);
    clearError();

    try {
      await refreshDevices();
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'Failed to refresh devices.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSaveAdbPath = async (): Promise<void> => {
    setIsSubmittingAdbPath(true);
    clearError();

    try {
      const nextSettings = await electronApi.updateSettings({ adbPath: adbPathDraft.trim() });
      setSettings(nextSettings);
      await refreshDeviceList();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save ADB path.');
    } finally {
      setIsSubmittingAdbPath(false);
    }
  };

  const handleStartSession = async (): Promise<void> => {
    if (!selectedDeviceId) {
      setError('Select an Android device first.');
      return;
    }

    clearError();
    clearLogs();

    try {
      const nextState = await electronApi.startLogcat({ deviceId: selectedDeviceId });
      setSessionState(nextState);
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : 'Failed to start logcat.');
    }
  };

  const handleStopSession = async (): Promise<void> => {
    try {
      const nextState = await electronApi.stopLogcat();
      setSessionState(nextState);
    } catch (stopError) {
      setError(stopError instanceof Error ? stopError.message : 'Failed to stop logcat.');
    }
  };

  const handlePauseResume = async (): Promise<void> => {
    try {
      const nextState =
        sessionState.status === 'paused'
          ? await electronApi.resumeLogcat()
          : await electronApi.pauseLogcat();
      setSessionState(nextState);
    } catch (pauseError) {
      setError(pauseError instanceof Error ? pauseError.message : 'Failed to update capture state.');
    }
  };

  const handleClearBuffer = async (): Promise<void> => {
    if (!selectedDeviceId) {
      setError('Select a device before clearing the logcat buffer.');
      return;
    }

    try {
      await electronApi.clearLogcatBuffer({ deviceId: selectedDeviceId });
      clearLogs();
    } catch (clearErrorState) {
      setError(
        clearErrorState instanceof Error
          ? clearErrorState.message
          : 'Failed to clear the device logcat buffer.'
      );
    }
  };

  const exportLogs = async (scope: 'visible' | 'all', format: 'txt' | 'log'): Promise<void> => {
    setIsExporting(true);
    clearError();

    try {
      const suggestedName = `logcat-${selectedDeviceId ?? 'session'}-${new Date()
        .toISOString()
        .replaceAll(':', '-')}`;

      await electronApi.exportLogs({
        scope,
        format,
        suggestedName,
        content: scope === 'visible' ? filteredLogs.map((entry) => entry.raw).join('\n') : undefined
      });
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : 'Failed to export logs.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyVisible = async (): Promise<void> => {
    try {
      await electronApi.copyToClipboard(filteredLogs.map((entry) => entry.raw).join('\n'));
    } catch (copyError) {
      setError(copyError instanceof Error ? copyError.message : 'Failed to copy visible logs.');
    }
  };

  const streaming = sessionState.status === 'streaming';
  const paused = sessionState.status === 'paused';

  const deviceIcon = (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 24 24" width="16">
      <rect height="14" rx="3" stroke="currentColor" strokeWidth="1.8" width="10" x="7" y="5" />
      <path d="M10 2.5h4M10 21.5h4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );

  const settingsIcon = (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 24 24" width="16">
      <path
        d="M12 8.5A3.5 3.5 0 1 0 12 15.5A3.5 3.5 0 1 0 12 8.5z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1 1 0 0 0 5 15.6a1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6H20a2 2 0 1 1 0 4h-.2a1 1 0 0 0-.9.6Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );

  const actionsIcon = (
    <svg aria-hidden="true" fill="currentColor" height="16" viewBox="0 0 24 24" width="16">
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  );

  return (
    <div className="flx-screen min-h-screen bg-[var(--bg)] text-[var(--foreground)]">
      <div className="mx-auto flex min-h-screen max-w-[1480px] flex-col px-6 py-6">
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] bg-transparent shadow-none">
          <div className="drag-region h-9" />

          <header className="bg-transparent px-6 pb-4">
            <div className="flex items-center justify-between gap-6">
              <div className="drag-region max-w-[38rem]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[var(--brand-500)]">
                  Logcat Desk
                </p>
              </div>

              <div className="no-drag rounded-full bg-[rgb(13_16_14/0.62)] px-2 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <div className="flex items-center gap-1">
                  <StatusBadge status={sessionState.status} label={sessionState.message ?? 'Ready'} />
                  <span className="mx-1 h-5 w-px bg-[rgb(38_48_40)]" />
                  <IconButton
                    active={Boolean(selectedDeviceId)}
                    icon={deviceIcon}
                    label={selectedDevice ? selectedDevice.model ?? 'Device' : 'Device'}
                    onClick={() => setIsDevicesOpen(true)}
                  />
                  <IconButton icon={settingsIcon} label="Settings" onClick={() => setIsSettingsOpen(true)} />
                  <IconButton icon={actionsIcon} label="More" onClick={() => setIsActionsOpen(true)} />
                </div>
              </div>
            </div>

            <div className="drag-region mt-3 flex items-center gap-3 text-sm text-[var(--muted)]">
              <span>
                {selectedDevice
                  ? `Dispositivo: ${selectedDevice.model ?? selectedDevice.id}`
                  : 'Sin dispositivo seleccionado'}
              </span>
              <span className="text-[rgb(88_102_90)]">/</span>
              <span>{filteredLogs.length.toLocaleString()} visibles</span>
            </div>
          </header>

          {error ? (
            <div className="mx-6 mt-4 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-500/8 px-4 py-3 text-sm text-red-200">
              <span className="mt-0.5 text-red-300">!</span>
              <span>{error}</span>
            </div>
          ) : null}

          <CommandBar
            canStart={Boolean(selectedDeviceId) && adbStatus.available}
            filters={filters}
            isPaused={paused}
            isStreaming={streaming}
            onOpenActions={() => setIsActionsOpen(true)}
            onPauseResume={handlePauseResume}
            onSetFilters={setFilters}
            onStart={handleStartSession}
            onStop={handleStopSession}
          />

          <section className="min-h-0 flex-1 px-6 pb-6 pt-4">
            {filteredLogs.length === 0 ? (
              <EmptyState
                hasDevice={Boolean(selectedDeviceId)}
                isStreaming={streaming || paused}
                title={logs.length > 0 ? 'No logs match the current filters.' : 'No logs yet.'}
                description={
                  logs.length > 0
                    ? 'Relaja los filtros o la severidad minima.'
                    : selectedDeviceId
                      ? 'Inicia la captura para ver logcat en tiempo real.'
                      : 'Abre el panel Device y selecciona un Android conectado.'
                }
              />
            ) : (
              <LogConsole
                autoScroll={settings.autoScroll}
                logs={filteredLogs}
                searchQuery={filters.search}
                onCopyLine={(line) => electronApi.copyToClipboard(line)}
              />
            )}
          </section>
        </main>
      </div>

      {isDevicesOpen ? (
        <DeviceModal
          devices={devices}
          isRefreshing={isRefreshing}
          onClose={() => setIsDevicesOpen(false)}
          onRefreshDevices={refreshDeviceList}
          onSelectDevice={selectDevice}
          selectedDeviceId={selectedDeviceId}
          sessionState={sessionState}
        />
      ) : null}

      {isSettingsOpen ? (
        <SettingsModal
          adbPath={adbPathDraft}
          adbStatus={adbStatus}
          autoScroll={settings.autoScroll}
          isSubmittingAdbPath={isSubmittingAdbPath}
          onAdbPathChange={setAdbPathDraft}
          onClose={() => setIsSettingsOpen(false)}
          onSaveAdbPath={handleSaveAdbPath}
          onSetAutoScroll={(value) => setAutoScroll(value)}
        />
      ) : null}

      {isActionsOpen ? (
        <ActionsModal
          isExporting={isExporting}
          onClearBuffer={handleClearBuffer}
          onClearView={clearLogs}
          onClose={() => setIsActionsOpen(false)}
          onCopyVisible={handleCopyVisible}
          onExportAll={() => void exportLogs('all', 'log')}
          onExportVisible={() => void exportLogs('visible', 'txt')}
        />
      ) : null}
    </div>
  );
};
