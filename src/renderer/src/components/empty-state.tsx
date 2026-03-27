import type { JSX } from 'react';

interface EmptyStateProps {
  hasDevice: boolean;
  isStreaming: boolean;
  title: string;
  description: string;
}

export const EmptyState = ({
  hasDevice,
  isStreaming,
  title,
  description
}: EmptyStateProps): JSX.Element => (
  <div className="flx-card flex h-full items-center justify-center border-dashed bg-[rgb(11_13_12/0.86)] p-10 text-center">
    <div className="max-w-lg">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[rgb(189_241_70/0.18)] bg-[rgb(189_241_70/0.08)] text-2xl text-[var(--brand-700)]">
        {isStreaming ? '::' : hasDevice ? '//' : '??'}
      </div>
      <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--brand-500)]">
        Log output
      </p>
      <h3 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--foreground)]">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{description}</p>
    </div>
  </div>
);
