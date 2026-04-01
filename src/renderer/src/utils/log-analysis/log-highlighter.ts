import type { LogEntry, LogLevel } from '@shared/types';
import type { EnrichedLog, LogSeverity } from '@renderer/utils/log-analysis/types';

interface CategoryRule {
  category: string;
  matcher: RegExp;
  severity: LogSeverity;
}

const CATEGORY_RULES: CategoryRule[] = [
  { category: 'NullPointerException', matcher: /\bnullpointerexception\b/i, severity: 'error' },
  { category: 'IllegalStateException', matcher: /\billegalstateexception\b/i, severity: 'error' },
  { category: 'SIGSEGV', matcher: /\bsigsegv\b/i, severity: 'error' },
  { category: 'ANR', matcher: /\banr\b/i, severity: 'error' },
  { category: 'FATAL', matcher: /\bfatal\b/i, severity: 'error' },
  { category: 'Exception', matcher: /\bexception\b/i, severity: 'error' },
  { category: 'Crash', matcher: /\bcrash\b/i, severity: 'error' },
  { category: 'Abort', matcher: /\babort\b/i, severity: 'error' },
  { category: 'Error', matcher: /\berror\b/i, severity: 'error' },
  { category: 'Timeout', matcher: /\btimeout\b/i, severity: 'warning' }
];

const levelToSeverity = (level: LogLevel): LogSeverity => {
  if (level === 'E' || level === 'F') {
    return 'error';
  }

  if (level === 'W') {
    return 'warning';
  }

  return 'info';
};

const resolveEmphasisSeverity = (entry: LogEntry): LogSeverity => {
  if (entry.emphasis === 'critical') {
    return 'error';
  }

  if (entry.emphasis === 'warning') {
    return 'warning';
  }

  return levelToSeverity(entry.level);
};

const detectCategory = (message: string): CategoryRule | undefined =>
  CATEGORY_RULES.find((rule) => rule.matcher.test(message));

export const enrichLog = (entry: LogEntry): EnrichedLog => {
  const sourceMessage = entry.message || entry.raw;
  const category = detectCategory(sourceMessage);
  const severity = category?.severity ?? resolveEmphasisSeverity(entry);

  return {
    ...entry,
    severity,
    highlight: severity !== 'info' || Boolean(category),
    category: category?.category
  };
};

export const enrichLogs = (entries: LogEntry[]): EnrichedLog[] => entries.map((entry) => enrichLog(entry));
