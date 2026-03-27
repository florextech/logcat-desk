import type { FilterState, LogEntry, LogLevelFilter } from '@shared/types';

const levelOrder: Record<LogLevelFilter, number> = {
  ALL: -1,
  V: 0,
  D: 1,
  I: 2,
  W: 3,
  E: 4,
  F: 5
};

const normalize = (value: string): string => value.trim().toLowerCase();

export const filterLogs = (logs: LogEntry[], filters: FilterState): LogEntry[] => {
  const text = normalize(filters.text);
  const tag = normalize(filters.tag);
  const packageName = normalize(filters.packageName);
  const minimumLevel = levelOrder[filters.minLevel];

  return logs.filter((entry) => {
    if (minimumLevel >= 0 && levelOrder[entry.level] < minimumLevel) {
      return false;
    }

    if (text) {
      const haystack = `${entry.raw}\n${entry.message}`.toLowerCase();
      if (!haystack.includes(text)) {
        return false;
      }
    }

    if (tag && !entry.tag.toLowerCase().includes(tag)) {
      return false;
    }

    if (packageName && !entry.raw.toLowerCase().includes(packageName)) {
      return false;
    }

    return true;
  });
};
