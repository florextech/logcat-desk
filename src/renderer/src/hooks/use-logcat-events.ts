import { useEffect } from 'react';
import { electronApi } from '@renderer/services/electron-api';
import { useAppStore } from '@renderer/store/app-store';

export const useLogcatEvents = (): void => {
  const { appendLogs, setError, setSessionState } = useAppStore();

  useEffect(() => {
    const unsubscribeBatch = electronApi.onLogBatch((payload) => {
      appendLogs(payload.entries);
    });

    const unsubscribeState = electronApi.onSessionState((state) => {
      setSessionState(state);

      if (state.status === 'error' || state.status === 'disconnected') {
        setError(state.message ?? 'Logcat session ended unexpectedly.');
      }
    });

    return () => {
      unsubscribeBatch();
      unsubscribeState();
    };
  }, [appendLogs, setError, setSessionState]);
};
