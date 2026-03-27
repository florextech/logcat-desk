import type { JSX } from 'react';
import type { FilterState } from '@shared/types';

interface CommandBarProps {
  autoScroll: boolean;
  canStart: boolean;
  filters: FilterState;
  isExporting: boolean;
  isPaused: boolean;
  isStreaming: boolean;
  onClearBuffer: () => void;
  onClearView: () => void;
  onCopyVisible: () => void;
  onExportAll: () => void;
  onExportVisible: () => void;
  onPauseResume: () => void;
  onSetAutoScroll: (value: boolean) => void;
  onSetFilters: (filters: Partial<FilterState>) => void;
  onStart: () => void;
  onStop: () => void;
}

const inputClassName =
  'flx-focus rounded-2xl border border-[var(--border)] bg-[rgb(11_13_12/0.84)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[rgb(189_241_70/0.42)]';

const actionClassName =
  'flx-btn flx-btn-secondary disabled:cursor-not-allowed disabled:opacity-50';

export const CommandBar = ({
  autoScroll,
  canStart,
  filters,
  isExporting,
  isPaused,
  isStreaming,
  onClearBuffer,
  onClearView,
  onCopyVisible,
  onExportAll,
  onExportVisible,
  onPauseResume,
  onSetAutoScroll,
  onSetFilters,
  onStart,
  onStop
}: CommandBarProps): JSX.Element => (
  <div className="flx-card mx-6 mt-6 p-4">
    <div className="mb-4 flex items-center justify-between gap-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--brand-500)]">
          Console controls
        </p>
        <h3 className="mt-2 text-xl font-semibold tracking-tight text-[var(--foreground)]">Controles</h3>
      </div>

      <label className="flx-btn flx-btn-secondary rounded-full px-4 py-2 text-sm text-[var(--muted)]">
        <input
          checked={autoScroll}
          className="h-4 w-4 rounded border-[var(--border)] bg-[rgb(11_13_12/0.9)] accent-[var(--brand-600)]"
          type="checkbox"
          onChange={(event) => onSetAutoScroll(event.target.checked)}
        />
        Auto-scroll
      </label>
    </div>

    <div className="grid grid-cols-[1.15fr_0.85fr_0.85fr_0.85fr_0.72fr] gap-3">
      <input
        className={inputClassName}
        placeholder="Texto libre o stack trace"
        value={filters.text}
        onChange={(event) => onSetFilters({ text: event.target.value })}
      />

      <input
        className={inputClassName}
        placeholder="Tag"
        value={filters.tag}
        onChange={(event) => onSetFilters({ tag: event.target.value })}
      />

      <input
        className={inputClassName}
        placeholder="Package name"
        value={filters.packageName}
        onChange={(event) => onSetFilters({ packageName: event.target.value })}
      />

      <input
        className={inputClassName}
        placeholder="Buscar y resaltar"
        value={filters.search}
        onChange={(event) => onSetFilters({ search: event.target.value })}
      />

      <select
        className={inputClassName}
        value={filters.minLevel}
        onChange={(event) =>
          onSetFilters({
            minLevel: event.target.value as FilterState['minLevel']
          })
        }
      >
        <option value="ALL">All levels</option>
        <option value="V">Verbose</option>
        <option value="D">Debug</option>
        <option value="I">Info</option>
        <option value="W">Warn</option>
        <option value="E">Error</option>
        <option value="F">Fatal</option>
      </select>
    </div>

    <div className="mt-4 flex flex-wrap items-center gap-3">
      <button
        className="flx-btn flx-btn-primary disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!canStart || isStreaming || isPaused}
        onClick={onStart}
      >
        Start Live Tail
      </button>

      <button className={actionClassName} disabled={!isStreaming && !isPaused} onClick={onStop}>
        Stop
      </button>

      <button className={actionClassName} disabled={!isStreaming && !isPaused} onClick={onPauseResume}>
        {isPaused ? 'Resume' : 'Pause'}
      </button>

      <button className={actionClassName} onClick={onClearView}>
        Clear View
      </button>

      <button className={actionClassName} onClick={onClearBuffer}>
        Clear Buffer
      </button>

      <button className={actionClassName} disabled={isExporting} onClick={onExportVisible}>
        Export .txt
      </button>

      <button className={actionClassName} disabled={isExporting} onClick={onExportAll}>
        Export .log
      </button>

      <button className={actionClassName} onClick={onCopyVisible}>
        Copy Visible
      </button>
    </div>
  </div>
);
