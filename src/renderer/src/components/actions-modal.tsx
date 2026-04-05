import { type JSX, useState } from 'react';
import { useI18n } from '@renderer/i18n/provider';
import { ModalShell } from '@renderer/components/modal-shell';

interface ActionsModalProps {
  canAnalyze: boolean;
  isCheckingUpdates: boolean;
  isAnalyzing: boolean;
  isExporting: boolean;
  onAnalyzeLogs: () => void;
  onCheckForUpdates: () => void;
  onClearBuffer: () => void;
  onClearView: () => void;
  onClose: () => void;
  onCopyVisible: () => void;
  onExportAll: () => void;
  onExportVisible: () => void;
}

interface ActionRowProps {
  hint: string;
  label: string;
  onClick: () => void;
  runLabel: string;
  disabled?: boolean;
  accent?: string;
}

const ActionRow = ({
  hint,
  label,
  onClick,
  runLabel,
  disabled = false,
  accent = 'text-(--brand-700)'
}: ActionRowProps): JSX.Element => (
  <button
    className="group flex items-center justify-between rounded-2xl border border-[rgb(38_48_40/0.82)] bg-[rgb(13_16_14/0.72)] px-4 py-4 text-left transition hover:border-[rgb(189_241_70/0.24)] hover:bg-[rgb(16_20_17/0.86)] disabled:cursor-not-allowed disabled:opacity-45"
    disabled={disabled}
    onClick={onClick}
  >
    <div>
      <p className={`text-sm font-semibold ${disabled ? 'text-(--muted)' : 'text-(--foreground)'}`}>
        {label}
      </p>
      <p className="mt-1 text-sm text-(--muted)">{hint}</p>
    </div>
    <span
      className={`rounded-full border border-[rgb(38_48_40/0.82)] bg-[rgb(17_21_19/0.84)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${accent}`}
    >
      {runLabel}
    </span>
  </button>
);

export const ActionsModal = ({
  canAnalyze,
  isCheckingUpdates,
  isAnalyzing,
  isExporting,
  onAnalyzeLogs,
  onCheckForUpdates,
  onClearBuffer,
  onClearView,
  onClose,
  onCopyVisible,
  onExportAll,
  onExportVisible
}: ActionsModalProps): JSX.Element => {
  const { copy } = useI18n();
  type ActionTab = 'cleanup' | 'maintenance' | 'export';
  const [activeTab, setActiveTab] = useState<ActionTab>('cleanup');
  const tabClass = (isActive: boolean): string =>
    `inline-flex h-9 items-center justify-center rounded-xl px-3 text-[11px] font-semibold uppercase tracking-[0.14em] transition ${
      isActive
        ? 'border border-[rgb(189_241_70/0.34)] bg-[rgb(189_241_70/0.12)] text-(--brand-700)'
        : 'text-(--muted) hover:bg-[rgb(17_21_19/0.82)] hover:text-(--foreground)'
    }`;

  return (
    <ModalShell maxWidthClass="max-w-xl" onClose={onClose} title={copy.modals.actions.title}>
      <div className="space-y-5">
        <p className="text-sm leading-7 text-(--muted)">
          {copy.modals.actions.intro}
        </p>

        <div className="rounded-2xl border border-(--border) bg-[rgb(11_13_12/0.82)] p-1">
          <div className="grid grid-cols-3 gap-1">
            <button
              className={tabClass(activeTab === 'cleanup')}
              type="button"
              onClick={() => setActiveTab('cleanup')}
            >
              {copy.modals.actions.cleanup}
            </button>
            <button
              className={tabClass(activeTab === 'maintenance')}
              type="button"
              onClick={() => setActiveTab('maintenance')}
            >
              {copy.modals.actions.maintenance}
            </button>
            <button
              className={tabClass(activeTab === 'export')}
              type="button"
              onClick={() => setActiveTab('export')}
            >
              {copy.modals.actions.export}
            </button>
          </div>
        </div>

        {activeTab === 'cleanup' ? (
          <div className="grid gap-3">
            <ActionRow
              hint={copy.modals.actions.clearViewHint}
              label={copy.modals.actions.clearViewLabel}
              onClick={onClearView}
              runLabel={copy.common.run}
            />
            <ActionRow
              accent="text-amber-300"
              hint={copy.modals.actions.clearBufferHint}
              label={copy.modals.actions.clearBufferLabel}
              onClick={onClearBuffer}
              runLabel={copy.common.run}
            />
          </div>
        ) : null}

        {activeTab === 'maintenance' ? (
          <div className="grid gap-3">
            <ActionRow
              disabled={!canAnalyze || isAnalyzing}
              hint={copy.modals.actions.analyzeLogsHint}
              label={copy.modals.actions.analyzeLogsLabel}
              onClick={onAnalyzeLogs}
              runLabel={copy.common.run}
            />
            <ActionRow
              disabled={isCheckingUpdates}
              hint={copy.modals.actions.checkUpdatesHint}
              label={copy.modals.actions.checkUpdatesLabel}
              onClick={onCheckForUpdates}
              runLabel={copy.common.run}
            />
          </div>
        ) : null}

        {activeTab === 'export' ? (
          <div className="grid gap-3">
            <ActionRow
              disabled={isExporting}
              hint={copy.modals.actions.exportVisibleHint}
              label={copy.modals.actions.exportVisibleLabel}
              onClick={onExportVisible}
              runLabel={copy.common.run}
            />
            <ActionRow
              disabled={isExporting}
              hint={copy.modals.actions.exportFullHint}
              label={copy.modals.actions.exportFullLabel}
              onClick={onExportAll}
              runLabel={copy.common.run}
            />
            <ActionRow
              hint={copy.modals.actions.copyVisibleHint}
              label={copy.modals.actions.copyVisibleLabel}
              onClick={onCopyVisible}
              runLabel={copy.common.run}
            />
          </div>
        ) : null}
      </div>
    </ModalShell>
  );
};
