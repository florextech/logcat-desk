import { describe, expect, it } from 'vitest';
import { createLogFingerprint, normalizeLogMessage } from '@renderer/utils/log-analysis/log-normalizer';

describe('log normalizer', () => {
  it('neutralizes volatile values while keeping the semantic message', () => {
    const normalized = normalizeLogMessage(
      '2026-04-01T17:10:10.512Z RequestId=abc12345 user 9812 failed in 32ms at 10:20:30'
    );

    expect(normalized).toContain('user <v> failed in <v> at <v>');
    expect(normalized).not.toContain('abc12345');
    expect(normalized).not.toContain('9812');
  });

  it('returns deterministic fingerprints for equivalent normalized messages', () => {
    const first = createLogFingerprint(normalizeLogMessage('Error for requestId=aaa111 took 1500ms'));
    const second = createLogFingerprint(normalizeLogMessage('Error for requestId=bbb222 took 9342ms'));

    expect(first).toBe(second);
    expect(first).toMatch(/^fnv1a-[0-9a-f]{8}$/);
  });

  it('produces different fingerprints for different normalized messages', () => {
    const first = createLogFingerprint(normalizeLogMessage('Network timeout while fetching profile'));
    const second = createLogFingerprint(normalizeLogMessage('Database connection refused'));

    expect(first).not.toBe(second);
  });
});
