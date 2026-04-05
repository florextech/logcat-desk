import { type JSX, type SyntheticEvent, useState } from 'react';
import { ModalShell } from '@renderer/components/modal-shell';
import { useI18n } from '@renderer/i18n/provider';
import type { AnalysisChatTurn } from '@shared/types';

interface AnalysisChatModalProps {
  isSending?: boolean;
  messages: AnalysisChatTurn[];
  onClose: () => void;
  onSend: (question: string) => void;
}

const bubbleBase = 'max-w-[90%] rounded-2xl px-3 py-2 text-sm';

export const AnalysisChatModal = ({
  isSending = false,
  messages,
  onClose,
  onSend
}: AnalysisChatModalProps): JSX.Element => {
  const { copy } = useI18n();
  const [draft, setDraft] = useState('');

  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const question = draft.trim();
    if (!question || isSending) {
      return;
    }

    onSend(question);
    setDraft('');
  };

  return (
    <ModalShell maxWidthClass="max-w-3xl" onClose={onClose} title={copy.modals.analysisChat.title}>
      <div className="flex h-[60vh] flex-col">
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {messages.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">{copy.modals.analysisChat.empty}</p>
          ) : (
            messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`${bubbleBase} ${
                    message.role === 'user'
                      ? 'border border-[rgb(189_241_70/0.28)] bg-[rgb(189_241_70/0.1)] text-[var(--foreground)]'
                      : 'border border-[rgb(38_48_40/0.85)] bg-[rgb(13_16_14/0.7)] text-[var(--foreground)]'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))
          )}
          {isSending ? (
            <div className="flex justify-start">
              <div className={`${bubbleBase} border border-[rgb(38_48_40/0.85)] bg-[rgb(13_16_14/0.7)] text-[var(--muted)]`}>
                {copy.modals.analysisChat.thinking}
              </div>
            </div>
          ) : null}
        </div>

        <form className="mt-4 flex gap-2" onSubmit={submit}>
          <input
            className="flx-focus w-full rounded-xl border border-[var(--border)] bg-[rgb(11_13_12/0.84)] px-3 py-2 text-sm text-[var(--foreground)] outline-none"
            placeholder={copy.modals.analysisChat.inputPlaceholder}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <button
            className="flx-btn flx-btn-primary disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!draft.trim() || isSending}
            type="submit"
          >
            {copy.modals.analysisChat.send}
          </button>
        </form>
      </div>
    </ModalShell>
  );
};
