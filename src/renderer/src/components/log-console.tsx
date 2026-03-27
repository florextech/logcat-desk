import { type JSX, useEffect, useRef } from 'react';
import type { LogEntry } from '@shared/types';
import { getLevelTone, highlightText } from '@renderer/utils/log-format';

interface LogConsoleProps {
  autoScroll: boolean;
  logs: LogEntry[];
  searchQuery: string;
  onCopyLine: (line: string) => Promise<void>;
}

export const LogConsole = ({
  autoScroll,
  logs,
  searchQuery,
  onCopyLine
}: LogConsoleProps): JSX.Element => {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!autoScroll || !scrollRef.current) {
      return;
    }

    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [autoScroll, logs]);

  return (
    <div className="flx-card flx-grid-glow flex h-full min-h-0 max-h-[calc(100vh-270px)] flex-col overflow-hidden bg-[rgb(11_13_12/0.92)]">
      <div className="grid grid-cols-[8.5rem_4rem_16rem_1fr_4rem] gap-3 border-b border-[var(--border)] bg-[rgb(17_21_19/0.9)] px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
        <span>Time</span>
        <span>Lvl</span>
        <span>Tag / pid</span>
        <span>Message</span>
        <span>Copy</span>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden font-mono">
        {logs.map((log) => {
          const tone = getLevelTone(log.level, log.emphasis);

          return (
            <div
              key={log.id}
              className={`group grid grid-cols-[8.5rem_4rem_16rem_1fr_4rem] gap-3 border-b border-[rgb(38_48_40/0.55)] px-4 py-2 text-[12px] ${tone.row}`}
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
                {highlightText(log.message || log.raw, searchQuery)}
              </div>
              <button
                className="rounded-lg border border-[var(--border)] bg-[rgb(17_21_19/0.74)] px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)] opacity-0 transition group-hover:opacity-100 hover:border-[rgb(189_241_70/0.3)] hover:text-[var(--foreground)]"
                onClick={() => void onCopyLine(log.raw)}
              >
                Copy
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
