import type { JSX } from 'react';
import type { SessionStatus } from '@shared/types';

interface StatusBadgeProps {
  status: SessionStatus;
  label: string;
}

const toneByStatus: Record<SessionStatus, string> = {
  idle: 'border-[var(--border)] bg-[rgb(17_21_19/0.82)] text-[var(--muted)]',
  starting: 'border-sky-300/20 bg-sky-400/10 text-sky-200',
  streaming: 'border-[rgb(189_241_70/0.28)] bg-[rgb(189_241_70/0.12)] text-[var(--brand-700)]',
  paused: 'border-amber-400/20 bg-amber-500/10 text-amber-300',
  stopped: 'border-[var(--border)] bg-[rgb(17_21_19/0.82)] text-[var(--muted)]',
  error: 'border-red-400/20 bg-red-500/10 text-red-300',
  disconnected: 'border-red-400/20 bg-red-500/10 text-red-300'
};

export const StatusBadge = ({ status, label }: StatusBadgeProps): JSX.Element => (
  <div className={`rounded-full border px-4 py-2 text-sm font-semibold ${toneByStatus[status]}`}>
    {label}
  </div>
);
