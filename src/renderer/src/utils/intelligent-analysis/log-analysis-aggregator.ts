import type { Locale } from '@shared/types';
import type { AnalysisLog, LogAnalysisResult, LogAnalysisSeverity } from '@renderer/utils/intelligent-analysis/log-analysis-engine';
import type { RuleMatch } from '@renderer/utils/intelligent-analysis/log-analysis-rules';

interface CauseBucket {
  cause: string;
  severity: LogAnalysisSeverity;
  count: number;
  evidence: Set<string>;
  recommendations: Set<string>;
}

interface LocalizedText {
  en: string;
  es: string;
}

interface HeuristicSignal {
  cause: LocalizedText;
  recommendation: LocalizedText;
  severity: LogAnalysisSeverity;
  test: (text: string) => boolean;
}

const SEVERITY_RANK: Record<LogAnalysisSeverity, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3
};

const ANALYSIS_COPY = {
  en: {
    unknownTag: 'unknown',
    noLogsSummary: 'No logs available to analyze.',
    noLogsRecommendation: 'Start a logcat session and collect logs before running analysis.',
    noPatternCause: 'No matching rule signatures found in the current log set.',
    noPatternRecommendationA: 'Review highlighted logs manually for project-specific failures.',
    noPatternRecommendationB: 'Add a custom rule for repeated patterns in your domain.',
    noCauseSummary: (): string =>
      'No known critical patterns detected in the current logs.',
    withCauseSummary: (cause: string, extraCount: number): string =>
      `Possible cause: ${cause}.${extraCount > 0 ? ` Additional probable causes: ${extraCount}.` : ''}`
  },
  es: {
    unknownTag: 'desconocido',
    noLogsSummary: 'No hay logs disponibles para analizar.',
    noLogsRecommendation: 'Inicia una sesion de logcat y captura logs antes de ejecutar el analisis.',
    noPatternCause: 'No se encontraron firmas de reglas coincidentes en el conjunto de logs actual.',
    noPatternRecommendationA: 'Revisa manualmente los logs resaltados para fallos especificos del proyecto.',
    noPatternRecommendationB: 'Agrega una regla personalizada para patrones repetidos de tu dominio.',
    noCauseSummary: (): string =>
      'No se detectaron patrones criticos conocidos en los logs actuales.',
    withCauseSummary: (cause: string, extraCount: number): string =>
      `Causa posible: ${cause}.${extraCount > 0 ? ` Causas probables adicionales: ${extraCount}.` : ''}`
  }
} as const;

const HEURISTIC_SIGNALS: HeuristicSignal[] = [
  {
    cause: {
      en: 'Request payload or parameters look invalid for the target API.',
      es: 'La carga o parametros de la solicitud parecen invalidos para la API destino.'
    },
    recommendation: {
      en: 'Validate request body/schema and required fields before sending.',
      es: 'Valida body/esquema de la solicitud y campos requeridos antes de enviar.'
    },
    severity: 'medium',
    test: (text) =>
      /\bresponse code\s*400\b|\bhttp\s*400\b|\bstatus\s*400\b|\bbad request\b|\binvalid argument\b/.test(text)
  },
  {
    cause: {
      en: 'Response parsing/serialization appears incompatible with returned data.',
      es: 'El parseo/serializacion de respuesta parece incompatible con los datos devueltos.'
    },
    recommendation: {
      en: 'Review parser contracts (protobuf/json) and handle malformed payloads safely.',
      es: 'Revisa contratos del parser (protobuf/json) y maneja payloads malformados de forma segura.'
    },
    severity: 'medium',
    test: (text) =>
      /\bparse proto exception\b|\bparse exception\b|\bserialization\b|\bdeserializ(e|ation)\b|\bmalformed\b|\bdecode\b/.test(
        text
      )
  },
  {
    cause: {
      en: 'Network transport instability is affecting request/response flow.',
      es: 'La inestabilidad de transporte de red esta afectando el flujo de peticion/respuesta.'
    },
    recommendation: {
      en: 'Inspect connectivity, DNS/TLS, and retry strategy for transient I/O failures.',
      es: 'Inspecciona conectividad, DNS/TLS y estrategia de reintentos para fallos transitorios de I/O.'
    },
    severity: 'medium',
    test: (text) =>
      /\berrno=\-?\d+\b|\bsocket\b|\bfailed to connect\b|\bconnection refused\b|\bnetwork\b|\bdns\b|\bhost unreachable\b/.test(
        text
      )
  },
  {
    cause: {
      en: 'Upstream service returned server-side failures.',
      es: 'El servicio upstream devolvio fallos del lado del servidor.'
    },
    recommendation: {
      en: 'Check backend health and retries for 5xx responses before surfacing hard failures.',
      es: 'Verifica salud del backend y reintentos para respuestas 5xx antes de marcar fallo duro.'
    },
    severity: 'high',
    test: (text) =>
      /\bresponse code\s*5\d\d\b|\bhttp\s*5\d\d\b|\bstatus\s*5\d\d\b|\binternal server error\b|\bservice unavailable\b/.test(
        text
      )
  }
];

const byHigherSeverity = (left: LogAnalysisSeverity, right: LogAnalysisSeverity): LogAnalysisSeverity =>
  SEVERITY_RANK[left] >= SEVERITY_RANK[right] ? left : right;

const localize = (text: LocalizedText, locale: Locale): string => (locale === 'es' ? text.es : text.en);

const asEvidence = (log: AnalysisLog, locale: Locale): string => {
  const timestamp = log.monthDay && log.time ? `${log.monthDay} ${log.time}` : log.receivedAt;
  const copy = ANALYSIS_COPY[locale];
  return `${timestamp} | ${log.tag || copy.unknownTag} | ${log.message || log.raw}`;
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

const summarize = (causes: string[], locale: Locale): string => {
  const copy = ANALYSIS_COPY[locale];

  if (causes.length === 0) {
    return copy.noCauseSummary();
  }

  const topCause = causes[0] ?? 'Unknown cause';
  return copy.withCauseSummary(topCause, causes.length - 1);
};

const inferHeuristicNoRuleInsights = (
  logs: AnalysisLog[],
  locale: Locale
): {
  causes: string[];
  recommendations: string[];
  evidence: string[];
  severity: LogAnalysisSeverity;
} => {
  const matchedCauses: string[] = [];
  const matchedRecommendations: string[] = [];
  const matchedEvidence: string[] = [];
  const evidenceSet = new Set<string>();
  let inferredSeverity: LogAnalysisSeverity = 'low';

  for (const signal of HEURISTIC_SIGNALS) {
    const matchingLogs = logs.filter((log) => signal.test(`${log.message} ${log.raw}`.toLowerCase()));
    if (matchingLogs.length === 0) {
      continue;
    }

    matchedCauses.push(localize(signal.cause, locale));
    matchedRecommendations.push(localize(signal.recommendation, locale));
    inferredSeverity = byHigherSeverity(inferredSeverity, signal.severity);

    for (const log of matchingLogs.slice(0, 2)) {
      const line = asEvidence(log, locale);
      if (evidenceSet.has(line)) {
        continue;
      }
      evidenceSet.add(line);
      matchedEvidence.push(line);
    }
  }

  return {
    causes: matchedCauses,
    recommendations: matchedRecommendations,
    evidence: matchedEvidence,
    severity: inferredSeverity
  };
};

export const aggregateLogAnalysis = (
  logs: AnalysisLog[],
  matches: RuleMatch[],
  locale: Locale = 'en'
): LogAnalysisResult => {
  const copy = ANALYSIS_COPY[locale];

  if (logs.length === 0) {
    return {
      summary: copy.noLogsSummary,
      probableCauses: [],
      evidence: [],
      recommendations: [copy.noLogsRecommendation],
      severity: 'low'
    };
  }

  if (matches.length === 0) {
    const warnings = logs.filter((log) => log.severity === 'warning').length;
    const errors = logs.filter((log) => log.severity === 'error').length;
    const baseSeverity: LogAnalysisSeverity = errors >= 3 ? 'high' : warnings > 0 ? 'medium' : 'low';
    const inferred = inferHeuristicNoRuleInsights(logs, locale);
    const severity = byHigherSeverity(baseSeverity, inferred.severity);
    const probableCauses = inferred.causes.length > 0 ? inferred.causes : [copy.noPatternCause];
    const recommendations = inferred.recommendations.length > 0
      ? [...new Set([...inferred.recommendations, copy.noPatternRecommendationB])]
      : [copy.noPatternRecommendationA, copy.noPatternRecommendationB];
    const evidence = inferred.evidence.length > 0
      ? inferred.evidence.slice(0, 5)
      : logs.slice(-5).map((log) => asEvidence(log, locale));

    return {
      summary: summarize(inferred.causes, locale),
      probableCauses,
      evidence,
      recommendations,
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
    summary: summarize(probableCauses, locale),
    probableCauses,
    evidence,
    recommendations,
    severity
  };
};
