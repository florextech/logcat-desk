import type { Locale } from '@shared/types';
import type { AnalysisLog, AnalysisRule, LogAnalysisSeverity } from '@renderer/utils/intelligent-analysis/log-analysis-engine';

export interface RuleMatch {
  rule: AnalysisRule;
  log: AnalysisLog;
  evidence: string;
  severity: LogAnalysisSeverity;
}

interface LocalizedText {
  en: string;
  es: string;
}

interface RuleDefinition {
  match: (log: AnalysisLog) => boolean;
  cause: LocalizedText;
  recommendation: LocalizedText;
  severity?: LogAnalysisSeverity;
}

const localize = (text: LocalizedText, locale: Locale): string => (locale === 'es' ? text.es : text.en);

const logToSeverity = (log: AnalysisLog): LogAnalysisSeverity => {
  if (log.severity === 'error') {
    return 'high';
  }

  if (log.severity === 'warning') {
    return 'medium';
  }

  return 'low';
};

const asEvidence = (log: AnalysisLog, locale: Locale): string => {
  const timestamp = log.monthDay && log.time ? `${log.monthDay} ${log.time}` : log.receivedAt;
  const unknownTag = locale === 'es' ? 'desconocido' : 'unknown';
  return `${timestamp} | ${log.tag || unknownTag} | ${log.message || log.raw}`;
};

const inHaystack = (log: AnalysisLog): string => `${log.tag} ${log.message} ${log.raw}`.toLowerCase();

const includesAny = (log: AnalysisLog, patterns: RegExp[]): boolean => {
  const haystack = inHaystack(log);
  return patterns.some((pattern) => pattern.test(haystack));
};

const ruleDefinitions: RuleDefinition[] = [
  {
    match: (log) => includesAny(log, [/\bnullpointerexception\b/i]),
    cause: {
      en: 'A null reference is being used before required initialization.',
      es: 'Se esta usando una referencia nula antes de la inicializacion requerida.'
    },
    recommendation: {
      en: 'Initialize required objects and add null-safety checks before usage.',
      es: 'Inicializa los objetos requeridos y agrega validaciones null-safety antes del uso.'
    },
    severity: 'high'
  },
  {
    match: (log) => includesAny(log, [/\bfatal exception\b/i]),
    cause: {
      en: 'A fatal runtime exception is crashing the app process.',
      es: 'Una excepcion fatal de runtime esta cerrando el proceso de la app.'
    },
    recommendation: {
      en: 'Inspect the stack trace and fix the top failing frame first.',
      es: 'Revisa el stack trace y corrige primero el frame superior que falla.'
    },
    severity: 'critical'
  },
  {
    match: (log) => includesAny(log, [/\banr\b/i, /application not responding/i]),
    cause: {
      en: 'Main thread appears blocked, causing an ANR condition.',
      es: 'El hilo principal parece bloqueado, causando una condicion ANR.'
    },
    recommendation: {
      en: 'Move heavy work off the main thread and profile long operations.',
      es: 'Mueve trabajo pesado fuera del hilo principal y perfila operaciones largas.'
    },
    severity: 'critical'
  },
  {
    match: (log) => includesAny(log, [/\btimeout\b/i, /timed out/i]),
    cause: {
      en: 'An operation exceeded its expected timeout window.',
      es: 'Una operacion excedio su ventana de timeout esperada.'
    },
    recommendation: {
      en: 'Increase timeout only if needed and investigate slow upstream dependencies.',
      es: 'Aumenta el timeout solo si es necesario e investiga dependencias lentas.'
    },
    severity: 'medium'
  },
  {
    match: (log) => includesAny(log, [/permission denied/i, /\bsecurityexception\b/i]),
    cause: {
      en: 'The operation failed due to missing or denied permissions.',
      es: 'La operacion fallo por permisos faltantes o denegados.'
    },
    recommendation: {
      en: 'Verify manifest/runtime permissions and ensure required grants are present.',
      es: 'Verifica permisos en manifest/runtime y asegura los permisos requeridos.'
    },
    severity: 'high'
  },
  {
    match: (log) => includesAny(log, [/\bsigsegv\b/i]),
    cause: {
      en: 'Native layer segmentation fault detected.',
      es: 'Se detecto un fallo de segmentacion en la capa nativa.'
    },
    recommendation: {
      en: 'Inspect native stack traces and validate JNI/native memory usage.',
      es: 'Revisa stack traces nativos y valida el uso de memoria JNI/nativa.'
    },
    severity: 'critical'
  },
  {
    match: (log) => includesAny(log, [/\billegalstateexception\b/i]),
    cause: {
      en: 'Code is executing in an invalid lifecycle or state context.',
      es: 'El codigo se esta ejecutando en un contexto de ciclo de vida o estado invalido.'
    },
    recommendation: {
      en: 'Guard lifecycle transitions and validate preconditions before state-dependent calls.',
      es: 'Protege transiciones de ciclo de vida y valida precondiciones antes de llamadas dependientes de estado.'
    },
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
    cause: {
      en: 'Network communication is failing or unstable.',
      es: 'La comunicacion de red esta fallando o es inestable.'
    },
    recommendation: {
      en: 'Check endpoint reachability, DNS resolution, TLS setup, and retry/backoff strategy.',
      es: 'Valida conectividad del endpoint, resolucion DNS, configuracion TLS y estrategia de reintentos/backoff.'
    },
    severity: 'medium'
  }
];

export const applyAnalysisRules = (logs: AnalysisLog[], locale: Locale = 'en'): RuleMatch[] => {
  const matches: RuleMatch[] = [];

  for (const log of logs) {
    for (const rule of ruleDefinitions) {
      if (!rule.match(log)) {
        continue;
      }

      matches.push({
        rule: {
          match: rule.match,
          cause: localize(rule.cause, locale),
          recommendation: localize(rule.recommendation, locale),
          severity: rule.severity
        },
        log,
        evidence: asEvidence(log, locale),
        severity: rule.severity ?? logToSeverity(log)
      });
    }
  }

  return matches;
};
