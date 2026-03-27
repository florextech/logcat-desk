import type { FilterState, LogEntry } from '@shared/types';

const normalize = (value: string): string => value.trim().toLowerCase();

export const filterLogs = (logs: LogEntry[], filters: FilterState): LogEntry[] => {
  const text = normalize(filters.text);
  const tag = normalize(filters.tag);
  const packageName = normalize(filters.packageName);

  return logs.filter((entry) => {
    if (filters.minLevel !== 'ALL' && entry.level !== filters.minLevel) {
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
