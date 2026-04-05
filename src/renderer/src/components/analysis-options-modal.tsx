import type { JSX } from 'react';
import { ModalShell } from '@renderer/components/modal-shell';
import { useI18n } from '@renderer/i18n/provider';

interface AnalysisOptionsModalProps {
  analyzeLimit: number;
  isAnalyzing: boolean;
  totalVisible: number;
  onClose: () => void;
  onLimitChange: (next: number) => void;
  onRun: () => void;
}

export const AnalysisOptionsModal = ({
  analyzeLimit,
  isAnalyzing,
  totalVisible,
  onClose,
  onLimitChange,
  onRun
}: AnalysisOptionsModalProps): JSX.Element => {
  const { copy } = useI18n();
  const safeLimit = Number.isFinite(analyzeLimit) ? Math.max(1, Math.floor(analyzeLimit)) : 1;
  const disabledRun = isAnalyzing || totalVisible === 0 || safeLimit < 1;

  return (
    <ModalShell maxWidthClass="max-w-xl" onClose={onClose} title={copy.modals.analysisOptions.title}>
      <div className="space-y-5">
        <p className="text-sm text-[var(--muted)]">{copy.modals.analysisOptions.intro(totalVisible)}</p>

        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">{copy.modals.analysisOptions.lastVisibleScopeLabel}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">{copy.modals.analysisOptions.lastVisibleScopeHint}</p>
          <input
            className="flx-focus mt-3 w-full rounded-xl border border-[var(--border)] bg-[rgb(11_13_12/0.84)] px-3 py-2 text-sm text-[var(--foreground)] outline-none"
            max={totalVisible}
            min={1}
            type="number"
            value={safeLimit}
            onChange={(event) => onLimitChange(Number(event.target.value) || 1)}
          />
        </div>

        <div className="flex justify-end gap-3">
          <button className="flx-btn flx-btn-secondary" type="button" onClick={onClose}>
            {copy.common.close}
          </button>
          <button className="flx-btn flx-btn-primary" disabled={disabledRun} type="button" onClick={onRun}>
            {copy.common.run}
          </button>
        </div>
      </div>
    </ModalShell>
  );
};
