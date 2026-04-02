import { type JSX, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { FilterState } from '@shared/types';
import { useI18n } from '@renderer/i18n/provider';

interface CommandBarProps {
  canStart: boolean;
  canClearLogs: boolean;
  filters: FilterState;
  isPaused: boolean;
  isStreaming: boolean;
  onClearLogs: () => void;
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
  canClearLogs,
  filters,
  isPaused,
  isStreaming,
  onClearLogs,
  onPauseResume,
  onSetFilters,
  onStart,
  onStop
}: CommandBarProps): JSX.Element => {
  const { copy } = useI18n();
  const [isLevelOpen, setIsLevelOpen] = useState(false);
  const levelRef = useRef<HTMLDivElement | null>(null);
  const levelButtonRef = useRef<HTMLButtonElement | null>(null);
  const levelMenuRef = useRef<HTMLDivElement | null>(null);
  const [menuRect, setMenuRect] = useState<{ top: number; left: number; width: number } | null>(
    null
  );

  const syncMenuRect = (): void => {
    const rect = levelButtonRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    setMenuRect({
      top: rect.bottom + 10,
      left: rect.left,
      width: rect.width
    });
  };

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent): void => {
      const target = event.target as Node;
      const insideButton = levelRef.current?.contains(target);
      const insideMenu = levelMenuRef.current?.contains(target);

      if (!insideButton && !insideMenu) {
        setIsLevelOpen(false);
      }
    };

    globalThis.addEventListener('mousedown', handlePointerDown);
    return () => globalThis.removeEventListener('mousedown', handlePointerDown);
  }, []);

  useEffect(() => {
    if (!isLevelOpen) {
      return;
    }

    syncMenuRect();

    const handleWindowChange = (): void => {
      syncMenuRect();
    };

    window.addEventListener('resize', handleWindowChange);
    window.addEventListener('scroll', handleWindowChange, true);

    return () => {
      window.removeEventListener('resize', handleWindowChange);
      window.removeEventListener('scroll', handleWindowChange, true);
    };
  }, [isLevelOpen]);

  const levelLabels: Record<FilterState['minLevel'], string> = copy.filters.levels;

  return (
    <div className="flx-card relative z-20 mx-6 mt-4 overflow-visible p-0">
      <div className="px-4 py-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--brand-500)]">
            {copy.filters.title}
          </p>
          <p className="text-xs text-[var(--muted)]">{copy.filters.helper}</p>
        </div>

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

          <div className="relative" ref={levelRef}>
            <button
              ref={levelButtonRef}
              className={`${inputClassName} flex w-full items-center justify-between ${
                isLevelOpen ? 'border-[rgb(189_241_70/0.42)] bg-[rgb(189_241_70/0.08)]' : ''
              }`}
              onClick={() => {
                syncMenuRect();
                setIsLevelOpen((current) => !current);
              }}
              type="button"
            >
              <span>{levelLabels[filters.minLevel]}</span>
              <span className={`text-[var(--muted)] transition ${isLevelOpen ? 'rotate-180' : ''}`}>⌄</span>
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--border)] bg-[rgb(17_21_19/0.48)] px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            className="flx-btn flx-btn-primary disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canStart || isStreaming || isPaused}
            onClick={onStart}
          >
            {copy.toolbar.start}
          </button>

          <button className={actionClassName} disabled={!isStreaming && !isPaused} onClick={onStop}>
            {copy.toolbar.stop}
          </button>

          <button className={actionClassName} disabled={!isStreaming && !isPaused} onClick={onPauseResume}>
            {isPaused ? copy.toolbar.resume : copy.toolbar.pause}
          </button>

          <button className={actionClassName} disabled={!canClearLogs} onClick={onClearLogs}>
            {copy.toolbar.clearLogs}
          </button>

        </div>
      </div>

      {isLevelOpen && menuRect
        ? createPortal(
            <div
              ref={levelMenuRef}
              className="fixed z-[120] overflow-hidden rounded-2xl border border-[rgb(38_48_40/0.92)] bg-[rgb(12_15_13/0.98)] p-1 shadow-[0_22px_60px_rgba(0,0,0,0.38)] backdrop-blur-xl"
              style={{
                top: menuRect.top,
                left: menuRect.left,
                width: menuRect.width
              }}
            >
              {(Object.keys(levelLabels) as FilterState['minLevel'][]).map((level) => {
                const active = filters.minLevel === level;
                return (
                  <button
                    key={level}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${
                      active
                        ? 'bg-[rgb(189_241_70/0.14)] font-semibold text-[var(--brand-700)]'
                        : 'text-[var(--foreground)] hover:bg-[rgb(255_255_255/0.04)]'
                    }`}
                    onClick={() => {
                      onSetFilters({ minLevel: level });
                      setIsLevelOpen(false);
                    }}
                    type="button"
                  >
                    <span>{levelLabels[level]}</span>
                    {active ? <span className="text-[var(--brand-700)]">✓</span> : null}
                  </button>
                );
              })}
            </div>,
            document.body
          )
        : null}
    </div>
  );
};
