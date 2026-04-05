const VOLATILE_PATTERNS: RegExp[] = [
  /\b\d{4}-\d{2}-\d{2}[t\s]\d{2}:\d{2}:\d{2}(?:[.,]\d+)?\b/gi,
  /\b\d{4}-\d{2}-\d{2}[t\s]\d{2}:\d{2}:\d{2}(?:[.,]\d+)?(?:z|[+-]\d{2}:?\d{2})/gi,
  /\b\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(?:\.\d+)?\b/g,
  /\b\d{2}:\d{2}:\d{2}(?:\.\d+)?\b/g,
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
  /\b0x[0-9a-f]+\b/gi,
  /\b(?:request|req|trace|span|session|correlation|transaction)[-_\s]*(?:id)?\s*[:=#-]?\s*[a-z0-9-]{6,}\b/gi,
  /\b\d+(?:\.\d+)?(?:ms|s|sec|secs|seconds|m|min|mins|minutes|h|hr|hrs|kb|mb|gb|%)\b/gi,
  /\b\d{5,}\b/g,
  /\b\d+\b/g
];

export const normalizeLogMessage = (value: string): string => {
  let normalized = value.toLowerCase();

  for (const pattern of VOLATILE_PATTERNS) {
    normalized = normalized.replaceAll(pattern, '<v>');
  }

  return normalized.replaceAll(/\s+/g, ' ').trim();
};

export const createLogFingerprint = (normalizedMessage: string): string => {
  let hash = 0x811c9dc5;

  for (const symbol of normalizedMessage) {
    hash ^= symbol.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193);
  }

  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`;
};
