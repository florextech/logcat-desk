import { type JSX, useEffect, useRef, useState } from 'react';
import { useI18n } from '@renderer/i18n/provider';
import type { LogGroup } from '@renderer/utils/log-analysis/types';
import { getLevelTone, getSeverityTone, highlightText } from '@renderer/utils/log-format';

interface GroupedLogConsoleProps {
  autoScroll: boolean;
  groups: LogGroup[];
  searchQuery: string;
  enableHighlight: boolean;
  onCopyLine: (line: string) => Promise<void>;
}

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
      <div className="grid grid-cols-[12rem_4rem_15rem_1fr_5rem] gap-3 border-b border-[var(--border)] bg-[rgb(17_21_19/0.9)] px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
        <span>{copy.console.time}</span>
        <span>{copy.console.level}</span>
        <span>{copy.console.tagPid}</span>
        <span>{copy.console.message}</span>
        <span>{copy.console.copy}</span>
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

          return (
            <div key={group.fingerprint} className="border-b border-[rgb(38_48_40/0.55)]">
              <div className={`group grid grid-cols-[12rem_4rem_15rem_1fr_5rem] gap-3 px-4 py-2 text-[12px] ${tone.row}`}>
                <span className="text-[var(--muted)]">{formatRange(group.firstSeen, group.lastSeen)}</span>
                <span className={`font-semibold ${tone.level}`}>{representative.level}</span>
                <div className="truncate">
                  <span className="text-[var(--foreground)]">{representative.tag}</span>
                  <span className="ml-2 text-[rgb(118_183_61)]">x{group.count}</span>
                </div>
                <div className="break-words text-[var(--foreground)]">
                  {enableHighlight && representative.highlight && representative.category ? (
                    <span className="mr-2 rounded-full border border-[rgb(255_255_255/0.1)] bg-[rgb(255_255_255/0.04)] px-2 py-[1px] text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
                      {representative.category}
                    </span>
                  ) : null}
                  {highlightText(group.message, searchQuery)}
                </div>
                <button
                  className="rounded-lg border border-[var(--border)] bg-[rgb(17_21_19/0.74)] px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)] transition hover:border-[rgb(189_241_70/0.3)] hover:text-[var(--foreground)]"
                  onClick={() =>
                    setExpanded((current) => ({
                      ...current,
                      [group.fingerprint]: !current[group.fingerprint]
                    }))
                  }
                  type="button"
                >
                  {isExpanded ? '-' : '+'}
                </button>
              </div>

              {isExpanded ? (
                <div className="bg-[rgb(10_12_11/0.5)]">
                  {group.logs.map((entry) => {
                    const childTone =
                      enableHighlight && entry.highlight
                        ? getSeverityTone(entry.severity)
                        : getLevelTone(entry.level, entry.emphasis);

                    return (
                      <div
                        key={entry.id}
                        className={`group grid grid-cols-[12rem_4rem_15rem_1fr_5rem] gap-3 border-t border-[rgb(38_48_40/0.35)] px-4 py-2 pl-8 text-[12px] ${childTone.row}`}
                      >
                        <span className="text-[var(--muted)]">
                          {entry.monthDay && entry.time ? `${entry.monthDay} ${entry.time}` : '--'}
                        </span>
                        <span className={`font-semibold ${childTone.level}`}>{entry.level}</span>
                        <div className="truncate">
                          <span className="text-[var(--foreground)]">{entry.tag}</span>
                          {entry.pid ? <span className="ml-2 text-[rgb(118_183_61)]">#{entry.pid}</span> : null}
                        </div>
                        <div className="break-words text-[var(--foreground)]">
                          {highlightText(entry.message || entry.raw, searchQuery)}
                        </div>
                        <button
                          className="rounded-lg border border-[var(--border)] bg-[rgb(17_21_19/0.74)] px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)] opacity-0 transition group-hover:opacity-100 hover:border-[rgb(189_241_70/0.3)] hover:text-[var(--foreground)]"
                          onClick={() => void onCopyLine(entry.raw)}
                        >
                          {copy.console.copy}
                        </button>
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
