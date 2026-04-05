import type { JSX } from 'react';
import type { AIEnhancementMeta, LogAnalysisResult } from '@renderer/utils/intelligent-analysis/log-analysis-engine';
import { useI18n } from '@renderer/i18n/provider';
import { ModalShell } from '@renderer/components/modal-shell';

interface AnalysisModalProps {
  aiMeta?: AIEnhancementMeta | null;
  result: LogAnalysisResult | null;
  onClose: () => void;
}

const severityTone: Record<LogAnalysisResult['severity'], string> = {
  low: 'text-[var(--brand-700)] border-[rgb(189_241_70/0.3)]',
  medium: 'text-amber-200 border-amber-400/40',
  high: 'text-orange-300 border-orange-400/40',
  critical: 'text-red-300 border-red-400/40'
};

const Section = ({ title, items }: { title: string; items: string[] }): JSX.Element => (
  <div>
    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--brand-500)]">{title}</p>
    {items.length === 0 ? (
      <p className="mt-2 text-sm text-[var(--muted)]">-</p>
    ) : (
      <ul className="mt-2 space-y-2 text-sm text-[var(--foreground)]">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="rounded-xl border border-[rgb(38_48_40/0.82)] bg-[rgb(13_16_14/0.62)] px-3 py-2">
            {item}
          </li>
        ))}
      </ul>
    )}
  </div>
);

export const AnalysisModal = ({ aiMeta, result, onClose }: AnalysisModalProps): JSX.Element => {
  const { copy } = useI18n();
  const providerLabel = aiMeta?.provider ? copy.modals.settings.aiProviders[aiMeta.provider] : null;
  const aiStatusText = !aiMeta
    ? copy.modals.analysis.aiStatusRuleOnly
    : aiMeta.used
      ? copy.modals.analysis.aiStatusUsed(providerLabel ?? 'AI')
      : copy.modals.analysis.aiStatusFallback(copy.modals.analysis.aiStatusReasons[aiMeta.reason]);
  const aiToneClass = aiMeta?.used
    ? 'border-[rgb(189_241_70/0.35)] bg-[rgb(189_241_70/0.08)] text-[var(--brand-700)]'
    : 'border-amber-500/30 bg-amber-500/10 text-amber-200';

  return (
    <ModalShell maxWidthClass="max-w-3xl" onClose={onClose} title={copy.modals.analysis.title}>
      {result ? (
        <div className="space-y-5">
          <div className="rounded-2xl border border-[var(--border)] bg-[rgb(11_13_12/0.82)] px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[var(--foreground)]">{copy.modals.analysis.summary}</p>
              <span
                className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                  severityTone[result.severity]
                }`}
              >
                {copy.modals.analysis.severity}: {copy.modals.analysis.severityLevels[result.severity]}
              </span>
            </div>
            <p className="mt-2 text-sm leading-7 text-[var(--foreground)]">{result.summary}</p>
            <div className={`mt-3 rounded-xl border px-3 py-2 text-xs ${aiToneClass}`}>
              <p>
                {copy.modals.analysis.aiStatus}: {aiStatusText}
              </p>
              {aiMeta?.detail ? (
                <p className="mt-1 text-[11px] text-[var(--muted)]">{aiMeta.detail}</p>
              ) : null}
            </div>
          </div>

          <Section items={result.probableCauses} title={copy.modals.analysis.probableCauses} />
          <Section items={result.evidence} title={copy.modals.analysis.evidence} />
          <Section items={result.recommendations} title={copy.modals.analysis.recommendations} />
        </div>
      ) : (
        <p className="text-sm text-[var(--muted)]">{copy.modals.analysis.noData}</p>
      )}
    </ModalShell>
  );
};
