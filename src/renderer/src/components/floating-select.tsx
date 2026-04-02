import { type JSX, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface FloatingSelectOption<T extends string> {
  value: T;
  label: string;
}

interface FloatingSelectProps<T extends string> {
  ariaLabel?: string;
  disabled?: boolean;
  options: FloatingSelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  buttonClassName?: string;
}

const ChevronIcon = ({ open }: { open: boolean }): JSX.Element => (
  <svg
    aria-hidden="true"
    className={`h-4 w-4 shrink-0 text-[var(--muted)] transition-transform ${open ? 'rotate-180' : ''}`}
    fill="none"
    viewBox="0 0 24 24"
  >
    <path
      d="M7 10l5 5 5-5"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  </svg>
);

const defaultButtonClassName =
  'flx-focus flex w-full items-center justify-between rounded-2xl border border-[var(--border)] bg-[rgb(11_13_12/0.84)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[rgb(189_241_70/0.42)] disabled:cursor-not-allowed disabled:opacity-50';

const layoutButtonClassName = 'flex w-full items-center justify-between gap-3 text-left';

export const FloatingSelect = <T extends string>({
  ariaLabel,
  disabled = false,
  options,
  value,
  onChange,
  buttonClassName = defaultButtonClassName
}: FloatingSelectProps<T>): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuRect, setMenuRect] = useState<{ top: number; left: number; width: number } | null>(null);

  const selected = options.find((option) => option.value === value) ?? options[0];

  const syncMenuRect = (): void => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    setMenuRect({
      top: rect.bottom + 10,
      left: rect.left,
      width: rect.width
    });
  };

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent): void => {
      const target = event.target as Node;
      const insideButton = triggerRef.current?.contains(target);
      const insideMenu = menuRef.current?.contains(target);

      if (!insideButton && !insideMenu) {
        setIsOpen(false);
      }
    };

    globalThis.addEventListener('mousedown', handlePointerDown);
    return () => globalThis.removeEventListener('mousedown', handlePointerDown);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    syncMenuRect();

    const handleWindowChange = (): void => {
      syncMenuRect();
    };

    window.addEventListener('resize', handleWindowChange);
    window.addEventListener('scroll', handleWindowChange, true);

    return () => {
      window.removeEventListener('resize', handleWindowChange);
      window.removeEventListener('scroll', handleWindowChange, true);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={triggerRef}>
      <button
        aria-label={ariaLabel}
        className={`${layoutButtonClassName} ${buttonClassName} ${
          isOpen ? 'border-[rgb(189_241_70/0.42)] bg-[rgb(189_241_70/0.08)]' : ''
        }`}
        disabled={disabled}
        ref={buttonRef}
        type="button"
        onClick={() => {
          syncMenuRect();
          setIsOpen((current) => !current);
        }}
      >
        <span className="min-w-0 truncate">{selected?.label ?? '-'}</span>
        <ChevronIcon open={isOpen} />
      </button>

      {isOpen && menuRect
        ? createPortal(
            <div
              className="fixed z-[120] overflow-hidden rounded-2xl border border-[rgb(38_48_40/0.92)] bg-[rgb(12_15_13/0.98)] p-1 shadow-[0_22px_60px_rgba(0,0,0,0.38)] backdrop-blur-xl"
              ref={menuRef}
              style={{
                top: menuRect.top,
                left: menuRect.left,
                width: menuRect.width
              }}
            >
              {options.map((option) => {
                const active = option.value === value;

                return (
                  <button
                    key={option.value}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${
                      active
                        ? 'bg-[rgb(189_241_70/0.14)] font-semibold text-[var(--brand-700)]'
                        : 'text-[var(--foreground)] hover:bg-[rgb(255_255_255/0.04)]'
                    }`}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                  >
                    <span>{option.label}</span>
                    {active ? <span className="text-[var(--brand-700)]">✓</span> : null}
                  </button>
                );
              })}
            </div>,
            document.body
          )
        : null}
    </div>
  );
};
