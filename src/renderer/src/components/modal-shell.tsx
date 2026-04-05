import { type JSX, type ReactNode } from 'react';
import { useI18n } from '@renderer/i18n/provider';

interface ModalShellProps {
  children: ReactNode;
  maxWidthClass?: string;
  onClose: () => void;
  title: string;
}

export const ModalShell = ({
  children,
  maxWidthClass = 'max-w-2xl',
  onClose,
  title
}: ModalShellProps): JSX.Element => {
  const { copy } = useI18n();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(3,6,4,0.58)] px-4 py-8 backdrop-blur-md">
      <div
        className={`w-full ${maxWidthClass} overflow-hidden rounded-[28px] border border-[rgb(38_48_40/0.9)] bg-[linear-gradient(180deg,_rgba(19,24,20,0.98),_rgba(11,13,12,0.985))] shadow-[0_30px_110px_rgba(0,0,0,0.55)]`}
      >
        <div className="bg-[radial-gradient(circle_at_top,_rgba(189,241,70,0.08),_transparent_34%)]">
          <div className="flex items-center justify-between border-b border-[rgb(38_48_40/0.82)] px-6 py-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-(--brand-500)">
                {copy.common.panel}
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-(--foreground)">{title}</h2>
            </div>
            <button
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgb(38_48_40/0.82)] bg-[rgb(15_18_16/0.78)] text-sm text-(--muted) transition hover:border-[rgb(189_241_70/0.22)] hover:text-(--foreground)"
              onClick={onClose}
            >
              x
            </button>
          </div>
        </div>
        <div className="max-h-[78vh] overflow-auto p-6">{children}</div>
      </div>
    </div>
  );
};
