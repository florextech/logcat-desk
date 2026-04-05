import { type JSX, useEffect, useRef, useState } from 'react';
import type { LogEntry } from '@shared/types';
import { useI18n } from '@renderer/i18n/provider';
import type { EnrichedLog } from '@renderer/utils/log-analysis/types';
import { getLevelTone, getSeverityTone, highlightText } from '@renderer/utils/log-format';

interface LogConsoleProps {
  autoScroll: boolean;
  logs: LogEntry[];
  searchQuery: string;
  enableHighlight?: boolean;
  selectedLogId?: string | null;
  onSelectLog?: (logId: string) => void;
  onCopyLine: (line: string) => Promise<void>;
}

export const LogConsole = ({
  autoScroll,
  logs,
  searchQuery,
  enableHighlight = true,
  selectedLogId = null,
  onSelectLog,
  onCopyLine
}: LogConsoleProps): JSX.Element => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isAtBottomRef = useRef(true);
  const [isAtBottom, setIsAtBottom] = useState(true);
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
  }, [autoScroll, logs]);

  useEffect(() => {
    if (!scrollRef.current) {
      return;
    }

    syncBottomState(isScrolledToBottom(scrollRef.current));
  }, [logs.length]);

  return (
    <div className="flx-card flx-grid-glow relative flex h-full min-h-0 max-h-[calc(100vh-270px)] flex-col overflow-hidden bg-[rgb(11_13_12/0.92)]">
      <div className="grid grid-cols-[8.5rem_4rem_16rem_1fr_4rem] gap-3 border-b border-[var(--border)] bg-[rgb(17_21_19/0.9)] px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
        <span>{copy.console.time}</span>
        <span>{copy.console.level}</span>
        <span>{copy.console.tagPid}</span>
        <span>{copy.console.message}</span>
        <span>{copy.console.copy}</span>
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden font-mono"
        data-testid="log-console-scroll"
        onScroll={() => {
          if (!scrollRef.current) {
            return;
          }

          syncBottomState(isScrolledToBottom(scrollRef.current));
        }}
      >
        {logs.map((log) => {
          const maybeEnriched = log as Partial<EnrichedLog>;
          const tone =
            enableHighlight && maybeEnriched.highlight && maybeEnriched.severity
              ? getSeverityTone(maybeEnriched.severity)
              : getLevelTone(log.level, log.emphasis);
          const isSelected = selectedLogId === log.id;

          return (
            <div
              key={log.id}
              className={`group grid grid-cols-[8.5rem_4rem_16rem_1fr_4rem] gap-3 border-b px-4 py-2 text-[12px] ${tone.row} ${
                isSelected
                  ? 'border-[rgb(189_241_70/0.6)] shadow-[inset_0_0_0_1px_rgba(189,241,70,0.2)]'
                  : 'border-[rgb(38_48_40/0.55)]'
              }`}
              onClick={() => onSelectLog?.(log.id)}
            >
              <span className="text-[var(--muted)]">
                {log.monthDay && log.time ? `${log.monthDay} ${log.time}` : '--'}
              </span>
              <span className={`font-semibold ${tone.level}`}>{log.level}</span>
              <div className="truncate">
                <span className="text-[var(--foreground)]">{log.tag}</span>
                {log.pid ? <span className="ml-2 text-[rgb(118_183_61)]">#{log.pid}</span> : null}
              </div>
              <div className="break-words text-[var(--foreground)]">
                {enableHighlight && maybeEnriched.highlight && maybeEnriched.category ? (
                  <span className="mr-2 rounded-full border border-[rgb(255_255_255/0.1)] bg-[rgb(255_255_255/0.04)] px-2 py-[1px] text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
                    {maybeEnriched.category}
                  </span>
                ) : null}
                {highlightText(log.message || log.raw, searchQuery)}
              </div>
              <button
                className="rounded-lg border border-[var(--border)] bg-[rgb(17_21_19/0.74)] px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)] opacity-0 transition group-hover:opacity-100 hover:border-[rgb(189_241_70/0.3)] hover:text-[var(--foreground)]"
                onClick={(event) => {
                  event.stopPropagation();
                  void onCopyLine(log.raw);
                }}
              >
                {copy.console.copy}
              </button>
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
