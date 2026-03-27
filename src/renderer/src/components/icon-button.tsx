import type { JSX, ReactNode } from 'react';

interface IconButtonProps {
  active?: boolean;
  label: string;
  onClick: () => void;
  icon: ReactNode;
}

export const IconButton = ({
  active = false,
  label,
  onClick,
  icon
}: IconButtonProps): JSX.Element => (
  <button
    className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition ${
      active
        ? 'bg-[rgb(189_241_70/0.10)] text-[var(--brand-700)]'
        : 'text-[var(--foreground)] hover:bg-[rgb(255_255_255/0.04)]'
    }`}
    onClick={onClick}
  >
    <span className="flex h-4 w-4 items-center justify-center">{icon}</span>
    <span>{label}</span>
    {active ? <span className="h-2 w-2 rounded-full bg-[var(--brand-600)]" /> : null}
  </button>
);
