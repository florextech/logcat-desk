import { useEffect, useState } from 'react';
import { useI18n } from '@renderer/i18n/provider';
import { electronApi } from '@renderer/services/electron-api';
import { useAppStore } from '@renderer/store/app-store';

export const useAppBootstrap = (): { ready: boolean; refreshDevices: () => Promise<void> } => {
  const [ready, setReady] = useState(false);
  const { copy } = useI18n();
  const { setAdbStatus, setDevices, setError, setSettings } = useAppStore();

  const persistDetectedAdbPath = async (
    sourcePath: string,
    currentPath: string,
    isCancelled?: () => boolean
  ): Promise<void> => {
    if (!sourcePath || sourcePath === currentPath.trim()) {
      return;
    }

    const updated = await electronApi.updateSettings({ adbPath: sourcePath });
    if (isCancelled?.()) {
      return;
    }

    setSettings(updated);
  };

  const refreshDevices = async (): Promise<void> => {
    const response = await electronApi.listDevices();
    setAdbStatus(response.adbStatus);
    setDevices(response.devices, useAppStore.getState().selectedDeviceId);

    if (response.adbStatus.available && response.adbStatus.source !== 'settings' && response.adbStatus.resolvedPath) {
      await persistDetectedAdbPath(response.adbStatus.resolvedPath, useAppStore.getState().settings.adbPath);
    }

    if (!response.adbStatus.available) {
      setError(response.adbStatus.error ?? copy.errors.adbUnavailable);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async (): Promise<void> => {
      try {
        const [settings, adbStatus] = await Promise.all([
          electronApi.getSettings(),
          electronApi.getAdbStatus()
        ]);

        if (cancelled) {
          return;
        }

        setSettings(settings);
        setAdbStatus(adbStatus);

        if (adbStatus.available && adbStatus.source !== 'settings' && adbStatus.resolvedPath) {
          await persistDetectedAdbPath(adbStatus.resolvedPath, settings.adbPath, () => cancelled);
        }

        const response = await electronApi.listDevices();

        if (cancelled) {
          return;
        }

        setAdbStatus(response.adbStatus);
        setDevices(response.devices, settings.lastDeviceId);

        if (response.adbStatus.available && response.adbStatus.source !== 'settings' && response.adbStatus.resolvedPath) {
          await persistDetectedAdbPath(
            response.adbStatus.resolvedPath,
            useAppStore.getState().settings.adbPath,
            () => cancelled
          );
        }

        if (!response.adbStatus.available) {
          setError(response.adbStatus.error ?? copy.errors.adbUnavailable);
        }
      } catch (bootstrapError) {
        if (!cancelled) {
          setError(
            bootstrapError instanceof Error ? bootstrapError.message : copy.errors.initializeApp
          );
        }
      } finally {
        if (!cancelled) {
          setReady(true);
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [copy.errors.adbUnavailable, copy.errors.initializeApp, setAdbStatus, setDevices, setError, setSettings]);

  return { ready, refreshDevices };
};
