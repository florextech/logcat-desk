import type { JSX } from 'react';
import type { AIEnhancementMeta, LogAnalysisResult } from '@renderer/utils/intelligent-analysis/log-analysis-engine';
import { useI18n } from '@renderer/i18n/provider';
import { ModalShell } from '@renderer/components/modal-shell';

interface AnalysisModalProps {
  aiMeta?: AIEnhancementMeta | null;
  canEnhanceWithAI: boolean;
  canOpenAIChat: boolean;
  isEnhancingWithAI?: boolean;
  result: LogAnalysisResult | null;
  onEnhanceWithAI: () => void;
  onOpenAIChat: () => void;
  onClose: () => void;
}

const severityTone: Record<LogAnalysisResult['severity'], string> = {
  low: 'text-(--brand-700) border-[rgb(189_241_70/0.3)]',
  medium: 'text-amber-200 border-amber-400/40',
  high: 'text-orange-300 border-orange-400/40',
  critical: 'text-red-300 border-red-400/40'
};

const Section = ({ title, items }: { title: string; items: string[] }): JSX.Element => (
  <div>
    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-(--brand-500)">{title}</p>
    {items.length === 0 ? (
      <p className="mt-2 text-sm text-(--muted)">-</p>
    ) : (
      <ul className="mt-2 space-y-2 text-sm text-(--foreground)">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="rounded-xl border border-[rgb(38_48_40/0.82)] bg-[rgb(13_16_14/0.62)] px-3 py-2">
            {item}
          </li>
        ))}
      </ul>
    )}
  </div>
);

export const AnalysisModal = ({
  aiMeta,
  canEnhanceWithAI,
  canOpenAIChat,
  isEnhancingWithAI = false,
  result,
  onEnhanceWithAI,
  onOpenAIChat,
  onClose
}: AnalysisModalProps): JSX.Element => {
  const { copy } = useI18n();
  const showAIStatus = Boolean(aiMeta && aiMeta.reason !== 'success');
  const aiStatusText = aiMeta
    ? copy.modals.analysis.aiStatusFallback(copy.modals.analysis.aiStatusReasons[aiMeta.reason])
    : copy.modals.analysis.aiStatusRuleOnly;

  return (
    <ModalShell maxWidthClass="max-w-3xl" onClose={onClose} title={copy.modals.analysis.title}>
      {result ? (
        <div className="space-y-5">
          <div className="rounded-2xl border border-(--border) bg-[rgb(11_13_12/0.82)] px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-(--foreground)">{copy.modals.analysis.summary}</p>
              <span
                className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                  severityTone[result.severity]
                }`}
              >
                {copy.modals.analysis.severity}: {copy.modals.analysis.severityLevels[result.severity]}
              </span>
            </div>
            <p className="mt-2 text-sm leading-7 text-(--foreground)">{result.summary}</p>
            {showAIStatus ? (
              <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                <p>
                  {copy.modals.analysis.aiStatus}: {aiStatusText}
                </p>
                {aiMeta?.detail ? (
                  <p className="mt-1 text-[11px] text-(--muted)">{aiMeta.detail}</p>
                ) : null}
              </div>
            ) : null}
            {canEnhanceWithAI || canOpenAIChat ? (
              <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                {canEnhanceWithAI ? (
                  <button
                    className="flx-btn flx-btn-primary inline-flex h-9 items-center gap-2 px-3 text-[13px] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isEnhancingWithAI}
                    type="button"
                    onClick={onEnhanceWithAI}
                  >
                    <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
                      <path
                        d="M12 3l2.1 5.2L19 10l-4.9 1.8L12 17l-2.1-5.2L5 10l4.9-1.8L12 3z"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                      />
                    </svg>
                    {isEnhancingWithAI ? copy.modals.analysis.enhancingWithAI : copy.modals.analysis.enhanceWithAI}
                  </button>
                ) : null}
                {canOpenAIChat ? (
                  <button
                    className="flx-btn flx-btn-secondary inline-flex h-9 items-center gap-2 border-[rgb(189_241_70/0.24)] bg-[rgb(17_21_19/0.82)] px-3 text-[13px]"
                    type="button"
                    onClick={onOpenAIChat}
                  >
                    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 24 24" width="16">
                      <path
                        d="M7 18l-3 3V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7z"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                      />
                    </svg>
                    {copy.modals.analysis.openAIChat}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          <Section items={result.probableCauses} title={copy.modals.analysis.probableCauses} />
          <Section items={result.evidence} title={copy.modals.analysis.evidence} />
          <Section items={result.recommendations} title={copy.modals.analysis.recommendations} />
        </div>
      ) : (
        <p className="text-sm text-(--muted)">{copy.modals.analysis.noData}</p>
      )}
    </ModalShell>
  );
};
