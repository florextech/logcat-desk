import type { JSX } from 'react';
import type { AdbStatus, Locale } from '@shared/types';
import { useI18n } from '@renderer/i18n/provider';
import { ModalShell } from '@renderer/components/modal-shell';

interface SettingsModalProps {
  adbPath: string;
  adbStatus: AdbStatus;
  autoScroll: boolean;
  isSubmittingAdbPath: boolean;
  locale: Locale;
  onAdbPathChange: (value: string) => void;
  onClose: () => void;
  onSaveAdbPath: () => void;
  onSetLocale: (locale: Locale) => void;
  onSetAutoScroll: (value: boolean) => void;
}

export const SettingsModal = ({
  adbPath,
  adbStatus,
  autoScroll,
  isSubmittingAdbPath,
  locale,
  onAdbPathChange,
  onClose,
  onSaveAdbPath,
  onSetLocale,
  onSetAutoScroll
}: SettingsModalProps): JSX.Element => {
  const { copy } = useI18n();

  return (
    <ModalShell onClose={onClose} title={copy.modals.settings.title}>
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
      </div>
    </ModalShell>
  );
};
