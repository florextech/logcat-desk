import { createLogFingerprint, normalizeLogMessage } from '@renderer/utils/log-analysis/log-normalizer';
import type { EnrichedLog, LogGroup } from '@renderer/utils/log-analysis/types';

const toTimestamp = (entry: EnrichedLog): number => {
  const parsed = Date.parse(entry.receivedAt);
  return Number.isNaN(parsed) ? entry.sequence : parsed;
};

export const groupLogs = (logs: EnrichedLog[]): LogGroup[] => {
  const groups = new Map<string, LogGroup>();

  for (const entry of logs) {
    const normalizedMessage = normalizeLogMessage(entry.message || entry.raw);
    const fingerprint = createLogFingerprint(normalizedMessage);
    const at = toTimestamp(entry);
    const current = groups.get(fingerprint);

    if (!current) {
      groups.set(fingerprint, {
        fingerprint,
        message: entry.message || entry.raw,
        count: 1,
        firstSeen: at,
        lastSeen: at,
        logs: [entry]
      });
      continue;
    }

    current.count += 1;
    current.lastSeen = at;
    current.logs.push(entry);
  }

  return [...groups.values()].sort((left, right) => left.lastSeen - right.lastSeen);
};
