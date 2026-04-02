import type { AnalysisLog, AnalysisRule, LogAnalysisSeverity } from '@renderer/utils/intelligent-analysis/log-analysis-engine';

export interface RuleMatch {
  rule: AnalysisRule;
  log: AnalysisLog;
  evidence: string;
  severity: LogAnalysisSeverity;
}

const logToSeverity = (log: AnalysisLog): LogAnalysisSeverity => {
  if (log.severity === 'error') {
    return 'high';
  }

  if (log.severity === 'warning') {
    return 'medium';
  }

  return 'low';
};

const asEvidence = (log: AnalysisLog): string => {
  const timestamp = log.monthDay && log.time ? `${log.monthDay} ${log.time}` : log.receivedAt;
  return `${timestamp} | ${log.tag || 'unknown'} | ${log.message || log.raw}`;
};

const inHaystack = (log: AnalysisLog): string => `${log.tag} ${log.message} ${log.raw}`.toLowerCase();

const includesAny = (log: AnalysisLog, patterns: RegExp[]): boolean => {
  const haystack = inHaystack(log);
  return patterns.some((pattern) => pattern.test(haystack));
};

export const analysisRules: AnalysisRule[] = [
  {
    match: (log) => includesAny(log, [/\bnullpointerexception\b/i]),
    cause: 'A null reference is being used before required initialization.',
    recommendation: 'Initialize required objects and add null-safety checks before usage.',
    severity: 'high'
  },
  {
    match: (log) => includesAny(log, [/\bfatal exception\b/i]),
    cause: 'A fatal runtime exception is crashing the app process.',
    recommendation: 'Inspect the stack trace and fix the top failing frame first.',
    severity: 'critical'
  },
  {
    match: (log) => includesAny(log, [/\banr\b/i, /application not responding/i]),
    cause: 'Main thread appears blocked, causing an ANR condition.',
    recommendation: 'Move heavy work off the main thread and profile long operations.',
    severity: 'critical'
  },
  {
    match: (log) => includesAny(log, [/\btimeout\b/i, /timed out/i]),
    cause: 'An operation exceeded its expected timeout window.',
    recommendation: 'Increase timeout only if needed and investigate slow upstream dependencies.',
    severity: 'medium'
  },
  {
    match: (log) => includesAny(log, [/permission denied/i, /\bsecurityexception\b/i]),
    cause: 'The operation failed due to missing or denied permissions.',
    recommendation: 'Verify manifest/runtime permissions and ensure required grants are present.',
    severity: 'high'
  },
  {
    match: (log) => includesAny(log, [/\bsigsegv\b/i]),
    cause: 'Native layer segmentation fault detected.',
    recommendation: 'Inspect native stack traces and validate JNI/native memory usage.',
    severity: 'critical'
  },
  {
    match: (log) => includesAny(log, [/\billegalstateexception\b/i]),
    cause: 'Code is executing in an invalid lifecycle or state context.',
    recommendation: 'Guard lifecycle transitions and validate preconditions before state-dependent calls.',
    severity: 'high'
  },
  {
    match: (log) =>
      includesAny(log, [
        /network error/i,
        /failed to connect/i,
        /connection refused/i,
        /unable to resolve host/i,
        /\beconnreset\b/i,
        /\benotfound\b/i,
        /host unreachable/i,
        /socket closed/i
      ]),
    cause: 'Network communication is failing or unstable.',
    recommendation: 'Check endpoint reachability, DNS resolution, TLS setup, and retry/backoff strategy.',
    severity: 'medium'
  }
];

export const applyAnalysisRules = (logs: AnalysisLog[]): RuleMatch[] => {
  const matches: RuleMatch[] = [];

  for (const log of logs) {
    for (const rule of analysisRules) {
      if (!rule.match(log)) {
        continue;
      }

      matches.push({
        rule,
        log,
        evidence: asEvidence(log),
        severity: rule.severity ?? logToSeverity(log)
      });
    }
  }

  return matches;
};
