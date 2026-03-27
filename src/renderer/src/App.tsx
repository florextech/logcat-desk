import { type JSX, useEffect, useMemo, useState } from 'react';
import { AppSidebar } from '@renderer/components/app-sidebar';
import { CommandBar } from '@renderer/components/command-bar';
import { EmptyState } from '@renderer/components/empty-state';
import { LogConsole } from '@renderer/components/log-console';
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
  }, [
    ready,
    selectedDeviceId,
    filters,
    settings.autoScroll,
    setError,
    setSettings
  ]);

  const filteredLogs = useMemo(() => filterLogs(logs, filters), [logs, filters]);

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

  return (
    <div className="flx-screen min-h-screen bg-[var(--bg)] text-[var(--foreground)]">
      <div className="mx-auto grid min-h-screen max-w-[1680px] grid-cols-[320px_minmax(0,1fr)] gap-5 px-5 py-5">
        <AppSidebar
          adbPath={adbPathDraft}
          adbStatus={adbStatus}
          devices={devices}
          error={error}
          isRefreshing={isRefreshing}
          isSubmittingAdbPath={isSubmittingAdbPath}
          onAdbPathChange={setAdbPathDraft}
          onRefreshDevices={refreshDeviceList}
          onSaveAdbPath={handleSaveAdbPath}
          onSelectDevice={selectDevice}
          selectedDeviceId={selectedDeviceId}
          sessionState={sessionState}
        />

        <main className="flx-shell flex min-h-0 flex-col overflow-hidden">
          <header className="border-b border-[var(--border)] bg-[linear-gradient(180deg,_rgba(27,40,18,0.42),_rgba(11,13,12,0.08))] px-6 py-5">
            <div className="flex items-start justify-between gap-6">
              <div className="max-w-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[var(--brand-500)]">
                  Android Logcat
                </p>
                <h1 className="mt-3 font-display text-[2.45rem] font-semibold leading-[0.96] tracking-tight text-[var(--foreground)]">
                  Consola rápida para leer logs Android.
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--muted)]">
                  Selecciona un dispositivo, inicia `logcat` y trabaja sobre una vista limpia.
                </p>
              </div>

              <div className="flex items-center gap-3 self-start">
                <StatusBadge status={sessionState.status} label={sessionState.message ?? 'Ready'} />
                <div className="rounded-full border border-[var(--border)] bg-[rgb(17_21_19/0.76)] px-4 py-2 text-sm text-[var(--muted)]">
                  {filteredLogs.length.toLocaleString()} visibles / {logs.length.toLocaleString()} total
                </div>
              </div>
            </div>
          </header>

          <CommandBar
            autoScroll={settings.autoScroll}
            canStart={Boolean(selectedDeviceId) && adbStatus.available}
            filters={filters}
            isExporting={isExporting}
            isPaused={paused}
            isStreaming={streaming}
            onClearBuffer={handleClearBuffer}
            onClearView={clearLogs}
            onCopyVisible={handleCopyVisible}
            onExportAll={() => exportLogs('all', 'log')}
            onExportVisible={() => exportLogs('visible', 'txt')}
            onPauseResume={handlePauseResume}
            onSetAutoScroll={(value) => setAutoScroll(value)}
            onSetFilters={setFilters}
            onStart={handleStartSession}
            onStop={handleStopSession}
          />

          <section className="min-h-0 flex-1 px-6 pb-6 pt-5">
            {filteredLogs.length === 0 ? (
              <EmptyState
                hasDevice={Boolean(selectedDeviceId)}
                isStreaming={streaming || paused}
                title={logs.length > 0 ? 'No logs match the current filters.' : 'No logs yet.'}
                description={
                  logs.length > 0
                    ? 'Relax the filters, search terms, or severity threshold.'
                    : selectedDeviceId
                      ? 'Start a live session to stream logcat in real time.'
                      : 'Connect an Android device and choose it from the sidebar.'
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
    </div>
  );
};
