import { useEffect } from 'react';
import { useI18n } from '@renderer/i18n/provider';
import { electronApi } from '@renderer/services/electron-api';
import { useAppStore } from '@renderer/store/app-store';
import type { LogBatchPayload, SessionState } from '@shared/types';

export const useLogcatEvents = (): void => {
  const { copy } = useI18n();
  const { appendLogs, setError, setSessionState } = useAppStore();

  useEffect(() => {
    const unsubscribeBatch = electronApi.onLogBatch((payload: LogBatchPayload) => {
      appendLogs(payload.entries);
    });

    const unsubscribeState = electronApi.onSessionState((state: SessionState) => {
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
