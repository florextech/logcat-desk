import { type JSX, useEffect, useRef, useState } from 'react';
import { useI18n } from '@renderer/i18n/provider';
import type { EnrichedLog, LogGroup } from '@renderer/utils/log-analysis/types';
import { getLevelTone, getSeverityTone, highlightText } from '@renderer/utils/log-format';

interface GroupedLogConsoleProps {
  autoScroll: boolean;
  groups: LogGroup[];
  searchQuery: string;
  enableHighlight: boolean;
  selectedLogId?: string | null;
  onSelectLog?: (logId: string) => void;
  onAnalyzeLog?: (log: EnrichedLog) => void;
  onCopyLine: (line: string) => Promise<void>;
}

const actionButtonClass =
  'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[rgb(17_21_19/0.74)] text-[var(--muted)] transition hover:border-[rgb(189_241_70/0.3)] hover:text-[var(--foreground)]';

const CopyIcon = (): JSX.Element => (
  <svg aria-hidden="true" fill="none" height="14" viewBox="0 0 24 24" width="14">
    <rect height="12" rx="2" stroke="currentColor" strokeWidth="1.8" width="10" x="9" y="8" />
    <path d="M6 16H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const ExpandIcon = ({ expanded }: { expanded: boolean }): JSX.Element => (
  <svg aria-hidden="true" fill="none" height="14" viewBox="0 0 24 24" width="14">
    <path
      d={expanded ? 'M7 10l5 5 5-5' : 'M10 7l5 5-5 5'}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  </svg>
);

const AIIcon = (): JSX.Element => (
  <svg aria-hidden="true" fill="none" height="14" viewBox="0 0 24 24" width="14">
    <path
      d="M12 3.2l1.4 3.6L17 8.2l-3.6 1.4L12 13.2l-1.4-3.6L7 8.2l3.6-1.4L12 3.2zM6 13.5l.9 2.3 2.3.9-2.3.9L6 20l-.9-2.3-2.3-.9 2.3-.9L6 13.5zM18 13.5l.9 2.3 2.3.9-2.3.9L18 20l-.9-2.3-2.3-.9 2.3-.9.9-2.3z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
    />
  </svg>
);

const formatLogMoment = (receivedAt: number): string => {
  const date = new Date(receivedAt);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const formatRange = (firstSeen: number, lastSeen: number): string => {
  const start = formatLogMoment(firstSeen);
  const end = formatLogMoment(lastSeen);
  return start === end ? start : `${start} -> ${end}`;
};

export const GroupedLogConsole = ({
  autoScroll,
  groups,
  searchQuery,
  enableHighlight,
  selectedLogId = null,
  onSelectLog,
  onAnalyzeLog,
  onCopyLine
}: GroupedLogConsoleProps): JSX.Element => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isAtBottomRef = useRef(true);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const { copy } = useI18n();

  const syncBottomState = (next: boolean): void => {
    if (isAtBottomRef.current === next) {
      return;
    }

    isAtBottomRef.current = next;
    setIsAtBottom(next);
  };

  const isScrolledToBottom = (container: HTMLDivElement): boolean =>
    container.scrollHeight - container.scrollTop - container.clientHeight <= 24;

  const scrollToBottom = (behavior: ScrollBehavior = 'auto'): void => {
    if (!scrollRef.current) {
      return;
    }

    if (typeof scrollRef.current.scrollTo === 'function') {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior });
    } else {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }

    isAtBottomRef.current = true;
    setIsAtBottom(true);
  };

  useEffect(() => {
    if (!autoScroll || !scrollRef.current || !isAtBottomRef.current) {
      return;
    }

    scrollToBottom();
  }, [autoScroll, groups]);

  useEffect(() => {
    if (!scrollRef.current) {
      return;
    }

    syncBottomState(isScrolledToBottom(scrollRef.current));
  }, [groups.length]);

  useEffect(() => {
    const validFingerprints = new Set(groups.map((group) => group.fingerprint));

    setExpanded((current) => {
      const next: Record<string, boolean> = {};
      for (const [fingerprint, isOpen] of Object.entries(current)) {
        if (isOpen && validFingerprints.has(fingerprint)) {
          next[fingerprint] = true;
        }
      }

      return next;
    });
  }, [groups]);

  return (
    <div className="flx-card flx-grid-glow relative flex h-full min-h-0 max-h-[calc(100vh-270px)] flex-col overflow-hidden bg-[rgb(11_13_12/0.92)]">
      <div className="grid grid-cols-[12rem_4rem_15rem_minmax(0,1fr)_4.5rem_7rem] gap-3 border-b border-[var(--border)] bg-[rgb(17_21_19/0.9)] px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
        <span>{copy.console.time}</span>
        <span>{copy.console.level}</span>
        <span>{copy.console.tagPid}</span>
        <span>{copy.console.message}</span>
        <span>{copy.console.copy}</span>
        <span>{copy.console.details}</span>
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden font-mono"
        data-testid="grouped-log-console-scroll"
        onScroll={() => {
          if (!scrollRef.current) {
            return;
          }

          syncBottomState(isScrolledToBottom(scrollRef.current));
        }}
      >
        {groups.map((group) => {
          const representative = group.logs[0];
          const isExpanded = Boolean(expanded[group.fingerprint]);
          const tone =
            enableHighlight && representative.highlight
              ? getSeverityTone(representative.severity)
              : getLevelTone(representative.level, representative.emphasis);
          const isRepresentativeSelected = selectedLogId === representative.id;

          return (
            <div key={group.fingerprint} className="border-b border-[rgb(38_48_40/0.55)]">
              <div
                className={`group grid grid-cols-[12rem_4rem_15rem_minmax(0,1fr)_4.5rem_7rem] gap-3 px-4 py-2 text-[12px] ${tone.row} ${
                  isRepresentativeSelected
                    ? 'shadow-[inset_0_0_0_1px_rgba(189,241,70,0.2)]'
                    : ''
                }`}
                onClick={() => onSelectLog?.(representative.id)}
              >
                <span className="text-[var(--muted)]">{formatRange(group.firstSeen, group.lastSeen)}</span>
                <span className={`font-semibold ${tone.level}`}>{representative.level}</span>
                <div className="min-w-0 truncate">
                  <span className="text-[var(--foreground)]">{representative.tag}</span>
                  <span className="ml-2 text-[rgb(118_183_61)]">x{group.count}</span>
                </div>
                <div className="min-w-0 break-all text-[var(--foreground)]">
                  {enableHighlight && representative.highlight && representative.category ? (
                    <span className="mr-2 rounded-full border border-[rgb(255_255_255/0.1)] bg-[rgb(255_255_255/0.04)] px-2 py-[1px] text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
                      {representative.category}
                    </span>
                  ) : null}
                  {highlightText(group.message, searchQuery)}
                </div>
                <button
                  aria-label={copy.console.copy}
                  className={`${actionButtonClass} justify-self-end opacity-0 group-hover:opacity-100`}
                  onClick={(event) => {
                    event.stopPropagation();
                    void onCopyLine(representative.raw);
                  }}
                  title={copy.console.copy}
                  type="button"
                >
                  <CopyIcon />
                </button>
                <div className="flex justify-end gap-2">
                  <button
                    aria-label={copy.toolbar.analyze}
                    className={actionButtonClass}
                    onClick={(event) => {
                      event.stopPropagation();
                      onAnalyzeLog?.(representative);
                    }}
                    title={copy.toolbar.analyze}
                    type="button"
                  >
                    <AIIcon />
                  </button>
                  <button
                    aria-label={isExpanded ? copy.console.collapse : copy.console.expand}
                    className={actionButtonClass}
                    onClick={(event) => {
                      event.stopPropagation();
                      setExpanded((current) => ({
                        ...current,
                        [group.fingerprint]: !current[group.fingerprint]
                      }));
                    }}
                    title={isExpanded ? copy.console.collapse : copy.console.expand}
                    type="button"
                  >
                    <ExpandIcon expanded={isExpanded} />
                  </button>
                </div>
              </div>

              {isExpanded ? (
                <div className="bg-[rgb(10_12_11/0.5)]">
                  {group.logs.map((entry) => {
                    const childTone =
                      enableHighlight && entry.highlight
                        ? getSeverityTone(entry.severity)
                        : getLevelTone(entry.level, entry.emphasis);
                    const isChildSelected = selectedLogId === entry.id;

                    return (
                      <div
                        key={entry.id}
                        className={`group grid grid-cols-[12rem_4rem_15rem_minmax(0,1fr)_4.5rem_7rem] gap-3 border-t border-[rgb(38_48_40/0.35)] px-4 py-2 pl-8 text-[12px] ${childTone.row} ${
                          isChildSelected
                            ? 'shadow-[inset_0_0_0_1px_rgba(189,241,70,0.2)]'
                            : ''
                        }`}
                        onClick={() => onSelectLog?.(entry.id)}
                      >
                        <span className="text-[var(--muted)]">
                          {entry.monthDay && entry.time ? `${entry.monthDay} ${entry.time}` : '--'}
                        </span>
                        <span className={`font-semibold ${childTone.level}`}>{entry.level}</span>
                        <div className="min-w-0 truncate">
                          <span className="text-[var(--foreground)]">{entry.tag}</span>
                          {entry.pid ? <span className="ml-2 text-[rgb(118_183_61)]">#{entry.pid}</span> : null}
                        </div>
                        <div className="min-w-0 break-all text-[var(--foreground)]">
                          {highlightText(entry.message || entry.raw, searchQuery)}
                        </div>
                        <button
                          aria-label={copy.console.copy}
                          className={`${actionButtonClass} justify-self-end opacity-0 group-hover:opacity-100`}
                          onClick={(event) => {
                            event.stopPropagation();
                            void onCopyLine(entry.raw);
                          }}
                          title={copy.console.copy}
                          type="button"
                        >
                          <CopyIcon />
                        </button>
                        <div className="flex justify-end gap-2">
                          <button
                            aria-label={copy.toolbar.analyze}
                            className={actionButtonClass}
                            onClick={(event) => {
                              event.stopPropagation();
                              onAnalyzeLog?.(entry);
                            }}
                            title={copy.toolbar.analyze}
                            type="button"
                          >
                            <AIIcon />
                          </button>
                          <div className="h-8 w-8" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {isAtBottom ? null : (
        <div className="pointer-events-none absolute bottom-4 right-4">
          <button
            className="pointer-events-auto rounded-full border border-[rgb(189_241_70/0.35)] bg-[rgb(12_15_13/0.95)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-500)] shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition hover:border-[rgb(189_241_70/0.55)] hover:text-[var(--brand-700)]"
            onClick={() => scrollToBottom('smooth')}
            type="button"
          >
            {copy.console.jumpToLatest}
          </button>
        </div>
      )}
    </div>
  );
};
