import { type JSX, useEffect, useMemo, useState } from 'react';
import { ActionsModal } from '@renderer/components/actions-modal';
import { CommandBar } from '@renderer/components/command-bar';
import { DeviceModal } from '@renderer/components/device-modal';
import { EmptyState } from '@renderer/components/empty-state';
import { IconButton } from '@renderer/components/icon-button';
import { useI18n } from '@renderer/i18n/provider';
import { LogConsole } from '@renderer/components/log-console';
import { SettingsModal } from '@renderer/components/settings-modal';
import { StatusBadge } from '@renderer/components/status-badge';
import logcatDeskMark from '@renderer/assets/logcat-desk-mark.svg';
import { useAppBootstrap } from '@renderer/hooks/use-app-bootstrap';
import { useLogcatEvents } from '@renderer/hooks/use-logcat-events';
import { electronApi } from '@renderer/services/electron-api';
import { useAppStore } from '@renderer/store/app-store';
import { filterLogs } from '@renderer/utils/log-filtering';
import type { Locale } from '@shared/types';

export const App = (): JSX.Element => {
  const { copy, locale } = useI18n();
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
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
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

    const timer = globalThis.setTimeout(() => {
      electronApi
        .updateSettings({
          autoScroll: settings.autoScroll,
          lastDeviceId: selectedDeviceId,
          filters
        })
        .then((updated: typeof settings) => {
          setSettings(updated);
        })
        .catch((updateError: unknown) => {
          setError(updateError instanceof Error ? updateError.message : copy.errors.persistPreferences);
        });
    }, 250);

    return () => globalThis.clearTimeout(timer);
  }, [copy.errors.persistPreferences, ready, selectedDeviceId, filters, settings.autoScroll, setError, setSettings]);

  const filteredLogs = useMemo(() => filterLogs(logs, filters), [logs, filters]);
  const selectedDevice = devices.find((device) => device.id === selectedDeviceId) ?? null;

  const refreshDeviceList = async (): Promise<void> => {
    setIsRefreshing(true);
    clearError();

    try {
      await refreshDevices();
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : copy.errors.refreshDevices);
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
      setError(saveError instanceof Error ? saveError.message : copy.errors.saveAdbPath);
    } finally {
      setIsSubmittingAdbPath(false);
    }
  };

  const handleStartSession = async (): Promise<void> => {
    if (!selectedDeviceId) {
      setError(copy.errors.selectDeviceFirst);
      return;
    }

    clearError();
    clearLogs();

    try {
      const nextState = await electronApi.startLogcat({ deviceId: selectedDeviceId });
      setSessionState(nextState);
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : copy.errors.startLogcat);
    }
  };

  const handleStopSession = async (): Promise<void> => {
    try {
      const nextState = await electronApi.stopLogcat();
      setSessionState(nextState);
    } catch (stopError) {
      setError(stopError instanceof Error ? stopError.message : copy.errors.stopLogcat);
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
      setError(pauseError instanceof Error ? pauseError.message : copy.errors.updateCaptureState);
    }
  };

  const handleClearBuffer = async (): Promise<void> => {
    if (!selectedDeviceId) {
      setError(copy.errors.selectDeviceBeforeClearBuffer);
      return;
    }

    try {
      await electronApi.clearLogcatBuffer({ deviceId: selectedDeviceId });
      clearLogs();
    } catch (error_) {
      setError(
        error_ instanceof Error
          ? error_.message
          : copy.errors.clearDeviceBuffer
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
      setError(exportError instanceof Error ? exportError.message : copy.errors.exportLogs);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyVisible = async (): Promise<void> => {
    try {
      await electronApi.copyToClipboard(filteredLogs.map((entry) => entry.raw).join('\n'));
    } catch (copyError) {
      setError(copyError instanceof Error ? copyError.message : copy.errors.copyVisibleLogs);
    }
  };

  const handleCheckForUpdates = async (): Promise<void> => {
    setIsCheckingUpdates(true);
    clearError();
    setIsActionsOpen(false);

    try {
      await electronApi.checkForUpdates();
    } catch (checkError) {
      setError(checkError instanceof Error ? checkError.message : copy.errors.checkForUpdates);
    } finally {
      setIsCheckingUpdates(false);
    }
  };

  const handleLocaleChange = async (nextLocale: Locale): Promise<void> => {
    const nextSettings = await electronApi.updateSettings({ locale: nextLocale });
    setSettings(nextSettings);
  };

  const streaming = sessionState.status === 'streaming';
  const paused = sessionState.status === 'paused';
  const sessionLabel =
    sessionState.status === 'error' || sessionState.status === 'disconnected'
      ? sessionState.message ?? copy.status[sessionState.status]
      : copy.status[sessionState.status];

  const deviceIcon = (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 24 24" width="16">
      <rect height="14" rx="3" stroke="currentColor" strokeWidth="1.8" width="10" x="7" y="5" />
      <path d="M10 2.5h4M10 21.5h4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );

  const settingsIcon = (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 24 24" width="16">
      <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M5.9 5.9l1.6 1.6M16.5 16.5l1.6 1.6M18.1 5.9l-1.6 1.6M7.5 16.5l-1.6 1.6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
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
              <div className="drag-region flex min-w-0 items-center gap-3">
                <img
                  alt={copy.common.appName}
                  className="h-11 w-11 rounded-2xl shadow-[0_0_28px_rgba(185,255,46,0.18)]"
                  src={logcatDeskMark}
                />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[var(--brand-500)]">
                    {copy.common.appName}
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {copy.header.tagline}
                  </p>
                </div>
              </div>

              <div className="no-drag rounded-full bg-[rgb(13_16_14/0.62)] px-2 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <div className="flex items-center gap-1">
                  <StatusBadge status={sessionState.status} label={sessionLabel} />
                  <span className="mx-1 h-5 w-px bg-[rgb(38_48_40)]" />
                  <IconButton
                    active={Boolean(selectedDeviceId)}
                    icon={deviceIcon}
                    label={selectedDevice ? selectedDevice.model ?? copy.common.device : copy.common.device}
                    onClick={() => setIsDevicesOpen(true)}
                  />
                  <IconButton icon={settingsIcon} label={copy.common.settings} onClick={() => setIsSettingsOpen(true)} />
                  <IconButton icon={actionsIcon} label={copy.common.more} onClick={() => setIsActionsOpen(true)} />
                </div>
              </div>
            </div>

            <div className="drag-region mt-3 flex items-center gap-3 text-sm text-[var(--muted)]">
              <span>
                {selectedDevice
                  ? copy.header.selectedDevice(selectedDevice.model ?? selectedDevice.id)
                  : copy.header.noDeviceSelected}
              </span>
              <span className="text-[rgb(88_102_90)]">/</span>
              <span>{copy.header.visibleCount(filteredLogs.length.toLocaleString(locale))}</span>
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
            canClearLogs={filteredLogs.length > 0}
            filters={filters}
            isPaused={paused}
            isStreaming={streaming}
            onClearLogs={clearLogs}
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
                title={logs.length > 0 ? copy.empty.noLogsMatch : copy.empty.noLogsYet}
                description={
                  logs.length > 0
                    ? copy.empty.relaxFilters
                    : selectedDeviceId
                      ? copy.empty.startSession
                      : copy.empty.chooseDevice
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
          locale={settings.locale}
          onAdbPathChange={setAdbPathDraft}
          onClose={() => setIsSettingsOpen(false)}
          onSaveAdbPath={handleSaveAdbPath}
          onSetLocale={(locale) => void handleLocaleChange(locale)}
          onSetAutoScroll={(value) => setAutoScroll(value)}
        />
      ) : null}

      {isActionsOpen ? (
        <ActionsModal
          isCheckingUpdates={isCheckingUpdates}
          isExporting={isExporting}
          onCheckForUpdates={() => void handleCheckForUpdates()}
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
