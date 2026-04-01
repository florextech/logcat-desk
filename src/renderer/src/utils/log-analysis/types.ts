import type { LogEntry } from '@shared/types';

export type LogSeverity = 'error' | 'warning' | 'info';

export interface EnrichedLog extends LogEntry {
  severity: LogSeverity;
  highlight: boolean;
  category?: string;
}

export interface LogGroup {
  fingerprint: string;
  message: string;
  count: number;
  firstSeen: number;
  lastSeen: number;
  logs: EnrichedLog[];
}
