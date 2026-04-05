import { type JSX, useState } from 'react';
import type { AdbStatus, AIConfig, AnalysisConfig, Locale, LogAnalysisConfig } from '@shared/types';
import { FloatingSelect } from '@renderer/components/floating-select';
import { useI18n } from '@renderer/i18n/provider';
import { ModalShell } from '@renderer/components/modal-shell';

interface SettingsModalProps {
  adbPath: string;
  adbStatus: AdbStatus;
  autoScroll: boolean;
  logAnalysis: LogAnalysisConfig;
  analysis: AnalysisConfig;
  isSubmittingAdbPath: boolean;
  locale: Locale;
  onAdbPathChange: (value: string) => void;
  onClose: () => void;
  onSaveAdbPath: () => void;
  onSetLocale: (locale: Locale) => void;
  onSetAutoScroll: (value: boolean) => void;
  onSetLogAnalysis: (partial: Partial<LogAnalysisConfig>) => void;
  onSetAnalysisConfig: (partial: Partial<AnalysisConfig>) => void;
  onSetAnalysisAI: (partial: Partial<AIConfig>) => void;
}

export const SettingsModal = ({
  adbPath,
  adbStatus,
  autoScroll,
  logAnalysis,
  analysis,
  isSubmittingAdbPath,
  locale,
  onAdbPathChange,
  onClose,
  onSaveAdbPath,
  onSetLocale,
  onSetAutoScroll,
  onSetLogAnalysis,
  onSetAnalysisConfig,
  onSetAnalysisAI
}: SettingsModalProps): JSX.Element => {
  const { copy } = useI18n();
  type SettingsTab = 'adb' | 'general' | 'analysis';
  const [activeTab, setActiveTab] = useState<SettingsTab>('adb');
  const aiConfig = analysis.ai;
  const aiFieldsDisabled = !analysis.enableAnalysis || !analysis.enableAIEnhancement;
  const aiProviderOptions = Object.entries(copy.modals.settings.aiProviders).map(([provider, label]) => ({
    value: provider as AIConfig['provider'],
    label
  }));
  const tabClass = (isActive: boolean): string =>
    `inline-flex h-9 items-center justify-center rounded-xl border px-3 text-[11px] font-semibold uppercase tracking-[0.14em] transition ${
      isActive
        ? 'border-[rgb(189_241_70/0.34)] bg-[rgb(189_241_70/0.12)] text-[var(--brand-700)]'
        : 'border-transparent text-[var(--muted)] hover:border-[rgb(38_48_40/0.85)] hover:bg-[rgb(17_21_19/0.82)] hover:text-[var(--foreground)]'
    }`;

  return (
    <ModalShell onClose={onClose} title={copy.modals.settings.title}>
      <div className="space-y-5">
        <div className="rounded-2xl border border-[var(--border)] bg-[rgb(11_13_12/0.82)] p-1">
          <div className="grid grid-cols-3 gap-1">
            <button
              className={tabClass(activeTab === 'adb')}
              type="button"
              onClick={() => setActiveTab('adb')}
            >
              {copy.modals.settings.adb}
            </button>
            <button
              className={tabClass(activeTab === 'general')}
              type="button"
              onClick={() => setActiveTab('general')}
            >
              {copy.modals.settings.generalTab}
            </button>
            <button
              className={tabClass(activeTab === 'analysis')}
              type="button"
              onClick={() => setActiveTab('analysis')}
            >
              {copy.modals.settings.analysisTab}
            </button>
          </div>
        </div>

        {activeTab === 'adb' ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-[var(--border)] bg-[rgb(11_13_12/0.82)] px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--brand-500)]">
                {copy.modals.settings.adb}
              </p>
              <div className="mt-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {adbStatus.available ? copy.modals.settings.adbReady : copy.modals.settings.adbMissing}
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {copy.modals.settings.adbHint(adbStatus.resolvedPath)}
                  </p>
                </div>
                <div
                  className={`h-3 w-3 rounded-full ${
                    adbStatus.available
                      ? 'bg-[var(--brand-600)] shadow-[0_0_20px_rgba(189,241,70,0.75)]'
                      : 'bg-red-400 shadow-[0_0_20px_rgba(239,68,68,0.8)]'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                {copy.modals.settings.customAdbPath}
              </label>
              <input
                className="flx-focus mt-2 w-full rounded-2xl border border-[var(--border)] bg-[rgb(11_13_12/0.88)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[rgb(189_241_70/0.42)]"
                placeholder={copy.modals.settings.customAdbPathPlaceholder}
                value={adbPath}
                onChange={(event) => onAdbPathChange(event.target.value)}
              />
              <button
                className="flx-btn flx-btn-secondary mt-3 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSubmittingAdbPath}
                onClick={onSaveAdbPath}
              >
                {isSubmittingAdbPath ? copy.common.saving : copy.modals.settings.saveAdbPath}
              </button>
            </div>
          </div>
        ) : null}

        {activeTab === 'general' ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-[var(--border)] bg-[rgb(11_13_12/0.82)] px-4 py-4">
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">{copy.modals.settings.languageTitle}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{copy.modals.settings.languageHint}</p>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <button
                  className={`flx-btn ${locale === 'es' ? 'flx-btn-primary' : 'flx-btn-secondary'}`}
                  onClick={() => onSetLocale('es')}
                >
                  {copy.common.spanish}
                </button>
                <button
                  className={`flx-btn ${locale === 'en' ? 'flx-btn-primary' : 'flx-btn-secondary'}`}
                  onClick={() => onSetLocale('en')}
                >
                  {copy.common.english}
                </button>
              </div>
            </div>

            <label className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[rgb(11_13_12/0.82)] px-4 py-4">
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">{copy.modals.settings.autoScrollTitle}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{copy.modals.settings.autoScrollHint}</p>
              </div>
              <input
                checked={autoScroll}
                className="h-5 w-5 rounded border-[var(--border)] bg-[rgb(11_13_12/0.9)] accent-[var(--brand-600)]"
                type="checkbox"
                onChange={(event) => onSetAutoScroll(event.target.checked)}
              />
            </label>

            <label className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[rgb(11_13_12/0.82)] px-4 py-4">
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">{copy.modals.settings.enableHighlightTitle}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{copy.modals.settings.enableHighlightHint}</p>
              </div>
              <input
                checked={logAnalysis.enableHighlight}
                className="h-5 w-5 rounded border-[var(--border)] bg-[rgb(11_13_12/0.9)] accent-[var(--brand-600)]"
                type="checkbox"
                onChange={(event) => onSetLogAnalysis({ enableHighlight: event.target.checked })}
              />
            </label>

            <label className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[rgb(11_13_12/0.82)] px-4 py-4">
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">{copy.modals.settings.enableGroupingTitle}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{copy.modals.settings.enableGroupingHint}</p>
              </div>
              <input
                checked={logAnalysis.enableGrouping}
                className="h-5 w-5 rounded border-[var(--border)] bg-[rgb(11_13_12/0.9)] accent-[var(--brand-600)]"
                type="checkbox"
                onChange={(event) => onSetLogAnalysis({ enableGrouping: event.target.checked })}
              />
            </label>
          </div>
        ) : null}

        {activeTab === 'analysis' ? (
          <div className="space-y-5">
            <label className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[rgb(11_13_12/0.82)] px-4 py-4">
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">{copy.modals.settings.enableAnalysisTitle}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{copy.modals.settings.enableAnalysisHint}</p>
              </div>
              <input
                checked={analysis.enableAnalysis}
                className="h-5 w-5 rounded border-[var(--border)] bg-[rgb(11_13_12/0.9)] accent-[var(--brand-600)]"
                type="checkbox"
                onChange={(event) => onSetAnalysisConfig({ enableAnalysis: event.target.checked })}
              />
            </label>

            <label className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[rgb(11_13_12/0.82)] px-4 py-4">
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {copy.modals.settings.enableAIEnhancementTitle}
                </p>
                <p className="mt-1 text-sm text-[var(--muted)]">{copy.modals.settings.enableAIEnhancementHint}</p>
              </div>
              <input
                checked={analysis.enableAIEnhancement}
                className="h-5 w-5 rounded border-[var(--border)] bg-[rgb(11_13_12/0.9)] accent-[var(--brand-600)]"
                disabled={!analysis.enableAnalysis}
                type="checkbox"
                onChange={(event) => onSetAnalysisConfig({ enableAIEnhancement: event.target.checked })}
              />
            </label>

            <div className="rounded-2xl border border-[var(--border)] bg-[rgb(11_13_12/0.82)] px-4 py-4">
              <div className="grid gap-3">
                <label className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                  {copy.modals.settings.aiProviderLabel}
                </label>
                <FloatingSelect
                  ariaLabel={copy.modals.settings.aiProviderLabel}
                  buttonClassName="flx-focus flex w-full items-center justify-between rounded-2xl border border-[var(--border)] bg-[rgb(11_13_12/0.88)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[rgb(189_241_70/0.42)] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={aiFieldsDisabled}
                  options={aiProviderOptions}
                  value={aiConfig?.provider ?? 'openai'}
                  onChange={(event) =>
                    onSetAnalysisAI({
                      provider: event
                    })
                  }
                />

                <label className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                  {copy.modals.settings.aiApiKeyLabel}
                </label>
                <input
                  className="flx-focus rounded-2xl border border-[var(--border)] bg-[rgb(11_13_12/0.88)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[rgb(189_241_70/0.42)] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={aiFieldsDisabled}
                  placeholder={copy.modals.settings.aiApiKeyPlaceholder}
                  type="password"
                  value={aiConfig?.apiKey ?? ''}
                  onChange={(event) => onSetAnalysisAI({ apiKey: event.target.value })}
                />

                <label className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                  {copy.modals.settings.aiModelLabel}
                </label>
                <input
                  className="flx-focus rounded-2xl border border-[var(--border)] bg-[rgb(11_13_12/0.88)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[rgb(189_241_70/0.42)] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={aiFieldsDisabled}
                  placeholder={copy.modals.settings.aiModelPlaceholder}
                  value={aiConfig?.model ?? ''}
                  onChange={(event) => onSetAnalysisAI({ model: event.target.value })}
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </ModalShell>
  );
};
