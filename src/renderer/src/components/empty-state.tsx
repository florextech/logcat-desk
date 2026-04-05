import type { JSX } from 'react';
import { useI18n } from '@renderer/i18n/provider';

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
}: EmptyStateProps): JSX.Element => {
  const { copy } = useI18n();

  return (
  <div className="flx-card flex h-full min-h-[430px] items-start justify-center border-dashed bg-[rgb(11_13_12/0.86)] px-8 pb-10 pt-[11vh] text-center">
    <div className="max-w-xl rounded-[28px] border border-[rgb(38_48_40/0.7)] bg-[rgb(13_16_14/0.7)] px-10 py-12">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[rgb(189_241_70/0.18)] bg-[rgb(189_241_70/0.08)] text-2xl text-(--brand-700) shadow-[0_12px_30px_rgba(157,223,75,0.08)]">
        {isStreaming ? '::' : hasDevice ? '//' : '??'}
      </div>
      <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.32em] text-(--brand-500)">
        {copy.console.logOutput}
      </p>
      <h3 className="mt-3 text-[2.2rem] font-semibold tracking-tight text-(--foreground)">{title}</h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-(--muted)">{description}</p>
    </div>
  </div>
  );
};
