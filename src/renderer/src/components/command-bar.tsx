import type { JSX } from 'react';
import type { FilterState } from '@shared/types';

interface CommandBarProps {
  canStart: boolean;
  filters: FilterState;
  isPaused: boolean;
  isStreaming: boolean;
  onOpenActions: () => void;
  onPauseResume: () => void;
  onSetFilters: (filters: Partial<FilterState>) => void;
  onStart: () => void;
  onStop: () => void;
}

const inputClassName =
  'flx-focus rounded-2xl border border-[var(--border)] bg-[rgb(11_13_12/0.84)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[rgb(189_241_70/0.42)]';

const actionClassName =
  'flx-btn flx-btn-secondary disabled:cursor-not-allowed disabled:opacity-50';

export const CommandBar = ({
  canStart,
  filters,
  isPaused,
  isStreaming,
  onOpenActions,
  onPauseResume,
  onSetFilters,
  onStart,
  onStop
}: CommandBarProps): JSX.Element => (
  <div className="flx-card mx-6 mt-4 overflow-hidden p-0">
    <div className="px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--brand-500)]">
          Filters
        </p>
        <p className="text-xs text-[var(--muted)]">Texto, tag, package, busqueda y nivel</p>
      </div>

      <div className="grid grid-cols-[1.35fr_0.95fr_0.95fr_0.95fr_0.78fr] gap-3">
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
    </div>

    <div className="border-t border-[var(--border)] bg-[rgb(17_21_19/0.48)] px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
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

        <div className="ml-auto flex items-center gap-3">
          <button className={actionClassName} onClick={onOpenActions}>
            More
          </button>
        </div>
      </div>
    </div>
  </div>
);
