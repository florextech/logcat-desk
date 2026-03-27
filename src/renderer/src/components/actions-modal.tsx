import type { JSX } from 'react';
import { ModalShell } from '@renderer/components/modal-shell';

interface ActionsModalProps {
  isExporting: boolean;
  onClearBuffer: () => void;
  onClearView: () => void;
  onClose: () => void;
  onCopyVisible: () => void;
  onExportAll: () => void;
  onExportVisible: () => void;
}

export const ActionsModal = ({
  isExporting,
  onClearBuffer,
  onClearView,
  onClose,
  onCopyVisible,
  onExportAll,
  onExportVisible
}: ActionsModalProps): JSX.Element => {
  const ActionRow = ({
    hint,
    label,
    onClick,
    disabled = false,
    accent = 'text-[var(--brand-700)]'
  }: {
    hint: string;
    label: string;
    onClick: () => void;
    disabled?: boolean;
    accent?: string;
  }): JSX.Element => (
    <button
      className="group flex items-center justify-between rounded-2xl border border-[rgb(38_48_40/0.82)] bg-[rgb(13_16_14/0.72)] px-4 py-4 text-left transition hover:border-[rgb(189_241_70/0.24)] hover:bg-[rgb(16_20_17/0.86)] disabled:cursor-not-allowed disabled:opacity-45"
      disabled={disabled}
      onClick={onClick}
    >
      <div>
        <p className={`text-sm font-semibold ${disabled ? 'text-[var(--muted)]' : 'text-[var(--foreground)]'}`}>
          {label}
        </p>
        <p className="mt-1 text-sm text-[var(--muted)]">{hint}</p>
      </div>
      <span
        className={`rounded-full border border-[rgb(38_48_40/0.82)] bg-[rgb(17_21_19/0.84)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${accent}`}
      >
        Run
      </span>
    </button>
  );

  return (
    <ModalShell maxWidthClass="max-w-xl" onClose={onClose} title="Acciones">
      <div className="space-y-5">
        <p className="text-sm leading-7 text-[var(--muted)]">
          Acciones secundarias para limpiar, exportar o copiar la salida actual sin recargar la interfaz principal.
        </p>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--brand-500)]">
            Cleanup
          </p>
          <div className="mt-3 grid gap-3">
            <ActionRow hint="Vaciar solo la consola visible." label="Clear View" onClick={onClearView} />
            <ActionRow
              accent="text-amber-300"
              hint="Limpiar el buffer real del dispositivo."
              label="Clear Buffer"
              onClick={onClearBuffer}
            />
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--brand-500)]">
            Export
          </p>
          <div className="mt-3 grid gap-3">
            <ActionRow
              disabled={isExporting}
              hint="Guardar lo que tienes visible ahora mismo."
              label="Export visible .txt"
              onClick={onExportVisible}
            />
            <ActionRow
              disabled={isExporting}
              hint="Guardar la sesion completa capturada."
              label="Export full .log"
              onClick={onExportAll}
            />
            <ActionRow hint="Copiar los logs visibles al portapapeles." label="Copy visible" onClick={onCopyVisible} />
          </div>
        </div>
      </div>
    </ModalShell>
  );
};
