import { useEffect } from 'react';
import { useI18n } from '@renderer/i18n/provider';
import { electronApi } from '@renderer/services/electron-api';
import { useAppStore } from '@renderer/store/app-store';

export const useLogcatEvents = (): void => {
  const { copy } = useI18n();
  const { appendLogs, setError, setSessionState } = useAppStore();

  useEffect(() => {
    const unsubscribeBatch = electronApi.onLogBatch((payload) => {
      appendLogs(payload.entries);
    });

    const unsubscribeState = electronApi.onSessionState((state) => {
      setSessionState(state);

      if (state.status === 'error' || state.status === 'disconnected') {
        setError(state.message ?? copy.errors.sessionEndedUnexpectedly);
      }
    });

    return () => {
      unsubscribeBatch();
      unsubscribeState();
    };
  }, [appendLogs, copy.errors.sessionEndedUnexpectedly, setError, setSessionState]);
};
