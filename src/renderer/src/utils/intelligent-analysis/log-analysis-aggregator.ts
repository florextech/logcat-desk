import type { AnalysisLog, LogAnalysisResult, LogAnalysisSeverity } from '@renderer/utils/intelligent-analysis/log-analysis-engine';
import type { RuleMatch } from '@renderer/utils/intelligent-analysis/log-analysis-rules';

interface CauseBucket {
  cause: string;
  severity: LogAnalysisSeverity;
  count: number;
  evidence: Set<string>;
  recommendations: Set<string>;
}

const SEVERITY_RANK: Record<LogAnalysisSeverity, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3
};

const byHigherSeverity = (left: LogAnalysisSeverity, right: LogAnalysisSeverity): LogAnalysisSeverity =>
  SEVERITY_RANK[left] >= SEVERITY_RANK[right] ? left : right;

const asEvidence = (log: AnalysisLog): string => {
  const timestamp = log.monthDay && log.time ? `${log.monthDay} ${log.time}` : log.receivedAt;
  return `${timestamp} | ${log.tag || 'unknown'} | ${log.message || log.raw}`;
};

const hasCrashSignal = (logs: AnalysisLog[]): boolean =>
  logs.some((log) => /\bfatal exception\b|\banr\b|\bsigsegv\b|\bcrash\b/i.test(`${log.message} ${log.raw}`));

const computeSeverity = (
  logs: AnalysisLog[],
  buckets: CauseBucket[],
  matchedErrors: number
): LogAnalysisSeverity => {
  let overall: LogAnalysisSeverity = 'low';

  for (const bucket of buckets) {
    overall = byHigherSeverity(overall, bucket.severity);
  }

  if (hasCrashSignal(logs)) {
    return 'critical';
  }

  if (matchedErrors >= 3 && SEVERITY_RANK[overall] < SEVERITY_RANK.high) {
    overall = 'high';
  }

  const warnings = logs.filter((log) => log.severity === 'warning').length;
  if (warnings > 0 && SEVERITY_RANK[overall] < SEVERITY_RANK.medium) {
    overall = 'medium';
  }

  return overall;
};

const summarize = (causes: string[], severity: LogAnalysisSeverity): string => {
  if (causes.length === 0) {
    return `No known critical patterns detected. Current severity: ${severity}.`;
  }

  const topCause = causes[0] ?? 'Unknown cause';
  const extra = causes.length > 1 ? ` Additional probable causes: ${causes.length - 1}.` : '';
  return `Possible cause: ${topCause}.${extra} Severity: ${severity}.`;
};

export const aggregateLogAnalysis = (logs: AnalysisLog[], matches: RuleMatch[]): LogAnalysisResult => {
  if (logs.length === 0) {
    return {
      summary: 'No logs available to analyze.',
      probableCauses: [],
      evidence: [],
      recommendations: ['Start a logcat session and collect logs before running analysis.'],
      severity: 'low'
    };
  }

  if (matches.length === 0) {
    const warnings = logs.filter((log) => log.severity === 'warning').length;
    const errors = logs.filter((log) => log.severity === 'error').length;
    const severity: LogAnalysisSeverity = errors >= 3 ? 'high' : warnings > 0 ? 'medium' : 'low';

    return {
      summary: summarize([], severity),
      probableCauses: ['No matching rule signatures found in the current log set.'],
      evidence: logs.slice(-5).map((log) => asEvidence(log)),
      recommendations: [
        'Review highlighted logs manually for project-specific failures.',
        'Add a custom rule for repeated patterns in your domain.'
      ],
      severity
    };
  }

  const buckets = new Map<string, CauseBucket>();
  let matchedErrors = 0;

  for (const match of matches) {
    if (match.log.severity === 'error') {
      matchedErrors += 1;
    }

    const bucket = buckets.get(match.rule.cause);
    if (!bucket) {
      buckets.set(match.rule.cause, {
        cause: match.rule.cause,
        severity: match.severity,
        count: 1,
        evidence: new Set([match.evidence]),
        recommendations: new Set([match.rule.recommendation])
      });
      continue;
    }

    bucket.count += 1;
    bucket.severity = byHigherSeverity(bucket.severity, match.severity);
    bucket.evidence.add(match.evidence);
    bucket.recommendations.add(match.rule.recommendation);
  }

  const sortedBuckets = [...buckets.values()].sort((left, right) => {
    const bySeverity = SEVERITY_RANK[right.severity] - SEVERITY_RANK[left.severity];
    if (bySeverity !== 0) {
      return bySeverity;
    }

    return right.count - left.count;
  });

  const probableCauses = sortedBuckets.map((bucket) => bucket.cause);

  const recommendations: string[] = [];
  const recommendationSet = new Set<string>();
  for (const bucket of sortedBuckets) {
    for (const recommendation of bucket.recommendations) {
      if (recommendationSet.has(recommendation)) {
        continue;
      }

      recommendationSet.add(recommendation);
      recommendations.push(recommendation);
    }
  }

  const evidence: string[] = [];
  const evidenceSet = new Set<string>();
  for (const bucket of sortedBuckets) {
    for (const evidenceLine of bucket.evidence) {
      if (evidenceSet.has(evidenceLine)) {
        continue;
      }

      evidenceSet.add(evidenceLine);
      evidence.push(evidenceLine);

      if (evidence.length >= 20) {
        break;
      }
    }

    if (evidence.length >= 20) {
      break;
    }
  }

  const severity = computeSeverity(logs, sortedBuckets, matchedErrors);

  return {
    summary: summarize(probableCauses, severity),
    probableCauses,
    evidence,
    recommendations,
    severity
  };
};
