import type { LogEntry } from '@shared/types';
import { groupLogs } from '@renderer/utils/log-analysis/log-grouping';
import { enrichLogs } from '@renderer/utils/log-analysis/log-highlighter';
import type { EnrichedLog, LogGroup } from '@renderer/utils/log-analysis/types';

export interface ProcessedLogs {
  enrichedLogs: EnrichedLog[];
  groupedLogs: LogGroup[];
}

export const processLogsForRender = (
  logs: LogEntry[],
  options: {
    enableGrouping: boolean;
  }
): ProcessedLogs => {
  const enrichedLogs = enrichLogs(logs);

  return {
    enrichedLogs,
    groupedLogs: options.enableGrouping ? groupLogs(enrichedLogs) : []
  };
};
