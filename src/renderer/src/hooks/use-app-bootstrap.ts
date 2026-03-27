import { useEffect, useState } from 'react';
import { electronApi } from '@renderer/services/electron-api';
import { useAppStore } from '@renderer/store/app-store';

export const useAppBootstrap = (): { ready: boolean; refreshDevices: () => Promise<void> } => {
  const [ready, setReady] = useState(false);
  const { setAdbStatus, setDevices, setError, setSettings } = useAppStore();

  const refreshDevices = async (): Promise<void> => {
    const response = await electronApi.listDevices();
    setAdbStatus(response.adbStatus);
    setDevices(response.devices, useAppStore.getState().selectedDeviceId);

    if (!response.adbStatus.available) {
      setError(response.adbStatus.error ?? 'ADB is not available.');
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

        const response = await electronApi.listDevices();

        if (cancelled) {
          return;
        }

        setAdbStatus(response.adbStatus);
        setDevices(response.devices, settings.lastDeviceId);

        if (!response.adbStatus.available) {
          setError(response.adbStatus.error ?? 'ADB is not available.');
        }
      } catch (bootstrapError) {
        if (!cancelled) {
          setError(
            bootstrapError instanceof Error ? bootstrapError.message : 'Failed to initialize the app.'
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
  }, [setAdbStatus, setDevices, setError, setSettings]);

  return { ready, refreshDevices };
};
