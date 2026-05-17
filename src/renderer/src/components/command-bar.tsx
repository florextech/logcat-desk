import { type JSX } from 'react';
import type { FilterState } from '@shared/types';
import { FloatingSelect } from '@renderer/components/floating-select';
import { useI18n } from '@renderer/i18n/provider';

interface CommandBarProps {
  canAnalyze: boolean;
  canStart: boolean;
  canClearLogs: boolean;
  filters: FilterState;
  isAnalyzePending?: boolean;
  isPausePending?: boolean;
  isPaused: boolean;
  isStopPending?: boolean;
  isStreaming: boolean;
  onAnalyze: () => void;
  onClearLogs: () => void;
  onPauseResume: () => void;
  onSetFilters: (filters: Partial<FilterState>) => void;
  onStart: () => void;
  onStop: () => void;
  presets: { id: string; name: string }[];
  onSavePreset: () => void;
  onApplyPreset: (presetId: string) => void;
  onDeletePreset: (presetId: string) => void;
}

const inputClassName =
  'flx-focus rounded-2xl border border-(--border) bg-[rgb(11_13_12/0.84)] px-4 py-3 text-sm text-(--foreground) outline-none transition focus:border-[rgb(189_241_70/0.42)]';

const actionClassName =
  'flx-btn flx-btn-secondary disabled:cursor-not-allowed disabled:opacity-50';

export const CommandBar = ({
  canAnalyze,
  canStart,
  canClearLogs,
  filters,
  isAnalyzePending = false,
  isPausePending = false,
  isPaused,
  isStopPending = false,
  isStreaming,
  onAnalyze,
  onClearLogs,
  onPauseResume,
  onSetFilters,
  onStart,
  onStop,
  presets,
  onSavePreset,
  onApplyPreset,
  onDeletePreset
}: CommandBarProps): JSX.Element => {
  const { copy } = useI18n();
  const levelLabels: Record<FilterState['minLevel'], string> = copy.filters.levels;
  const levelOptions = (Object.keys(levelLabels) as FilterState['minLevel'][]).map((level) => ({
    value: level,
    label: levelLabels[level]
  }));

  return (
    <div className="flx-card relative z-20 mx-6 mt-4 overflow-visible p-0">
      <div className="px-4 py-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-(--brand-500)">
            {copy.filters.title}
          </p>
          <div className="flex items-center gap-2">
            <p className="text-xs text-(--muted)">{copy.filters.helper}</p>
            <button
              className="rounded-xl border border-(--border) bg-[rgb(17_21_19/0.7)] px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-(--brand-700)"
              onClick={onSavePreset}
              type="button"
            >
              Save preset
            </button>
          </div>
        </div>

        {presets.length > 0 ? (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {presets.map((preset) => (
              <div key={preset.id} className="inline-flex items-center gap-1 rounded-xl border border-(--border) bg-[rgb(17_21_19/0.62)] px-2 py-1">
                <button
                  className="text-xs text-(--foreground)"
                  onClick={() => onApplyPreset(preset.id)}
                  type="button"
                >
                  {preset.name}
                </button>
                <button
                  aria-label={`Delete ${preset.name}`}
                  className="text-[10px] text-(--muted) hover:text-red-300"
                  onClick={() => onDeletePreset(preset.id)}
                  type="button"
                >
                  x
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <div className="grid grid-cols-[1.35fr_0.95fr_0.95fr_0.95fr_0.78fr] gap-3">
          <input
            className={inputClassName}
            placeholder={copy.filters.textPlaceholder}
            value={filters.text}
            onChange={(event) => onSetFilters({ text: event.target.value })}
          />

          <input
            className={inputClassName}
            placeholder={copy.filters.tagPlaceholder}
            value={filters.tag}
            onChange={(event) => onSetFilters({ tag: event.target.value })}
          />

          <input
            className={inputClassName}
            placeholder={copy.filters.packagePlaceholder}
            value={filters.packageName}
            onChange={(event) => onSetFilters({ packageName: event.target.value })}
          />

          <input
            className={inputClassName}
            placeholder={copy.filters.searchPlaceholder}
            value={filters.search}
            onChange={(event) => onSetFilters({ search: event.target.value })}
          />

          <FloatingSelect
            ariaLabel={copy.filters.helper}
            buttonClassName={inputClassName}
            options={levelOptions}
            value={filters.minLevel}
            onChange={(level) => onSetFilters({ minLevel: level })}
          />
        </div>
      </div>

      <div className="border-t border-(--border) bg-[rgb(17_21_19/0.48)] px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            className="flx-btn flx-btn-primary disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canStart || isStreaming || isPaused || isStopPending || isPausePending}
            onClick={onStart}
          >
            {copy.toolbar.start}
          </button>

          <button
            className={actionClassName}
            disabled={isStopPending || isPausePending || (!isStreaming && !isPaused)}
            onClick={onStop}
          >
            {copy.toolbar.stop}
          </button>

          <button
            className={actionClassName}
            disabled={isPausePending || isStopPending || (!isStreaming && !isPaused)}
            onClick={onPauseResume}
          >
            {isPaused ? copy.toolbar.resume : copy.toolbar.pause}
          </button>

          <button className={actionClassName} disabled={!canClearLogs} onClick={onClearLogs}>
            {copy.toolbar.clearLogs}
          </button>

          <button
            className={actionClassName}
            disabled={!canAnalyze || isAnalyzePending || isStopPending || isPausePending}
            onClick={onAnalyze}
          >
            {copy.toolbar.analyze}
          </button>
        </div>
      </div>
    </div>
  );
};
