import type { JSX } from 'react';
import type { SessionStatus } from '@shared/types';

interface StatusBadgeProps {
  status: SessionStatus;
  label: string;
}

const toneByStatus: Record<SessionStatus, { dot: string; text: string }> = {
  idle: {
    dot: 'bg-[rgb(120_131_122)]',
    text: 'text-[var(--muted)]'
  },
  starting: {
    dot: 'bg-sky-300',
    text: 'text-sky-200'
  },
  streaming: {
    dot: 'bg-[var(--brand-600)] shadow-[0_0_12px_rgba(189,241,70,0.7)] animate-pulse',
    text: 'text-[var(--brand-700)]'
  },
  paused: {
    dot: 'bg-amber-300',
    text: 'text-amber-300'
  },
  stopped: {
    dot: 'bg-[rgb(120_131_122)]',
    text: 'text-[var(--muted)]'
  },
  error: {
    dot: 'bg-red-400 shadow-[0_0_12px_rgba(239,68,68,0.5)]',
    text: 'text-red-300'
  },
  disconnected: {
    dot: 'bg-red-400 shadow-[0_0_12px_rgba(239,68,68,0.5)]',
    text: 'text-red-300'
  }
};

export const StatusBadge = ({ status, label }: StatusBadgeProps): JSX.Element => (
  <div className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold ${toneByStatus[status].text}`}>
    <span className={`h-2.5 w-2.5 rounded-full ${toneByStatus[status].dot}`} />
    {label}
  </div>
);
