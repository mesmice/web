import { CornerUpLeft, Send, X } from 'lucide-react';
import { useState } from 'react';
import { MentionTextarea } from './mention-textarea.js';
import type { MentionableUser } from './mention-utils.js';
import type { MessageResponse } from '../../../lib/api/endpoints.js';

interface MessageComposerProps {
  users?: MentionableUser[];
  replyTo?: MessageResponse | null;
  isSending?: boolean;
  onCancelReply: () => void;
  onSend: (content: string, replyToId?: string) => Promise<void>;
}

export function MessageComposer({
  users = [],
  replyTo,
  isSending = false,
  onCancelReply,
  onSend
}: MessageComposerProps) {
  const [content, setContent] = useState('');

  async function handleSubmit() {
    const trimmedContent = content.trim();
    if (!trimmedContent || isSending) return;

    await onSend(trimmedContent, replyTo?.id);
    setContent('');
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit();
      }}
      className="border-t border-[color:var(--color-border-default)] bg-[color:var(--color-surface-primary)] p-3"
    >
      {replyTo ? (
        <div className="mb-2 flex items-center gap-2 rounded-[var(--radius-sm)] border-l-2 border-[color:var(--color-brand-primary)] bg-[color:var(--color-surface-secondary)] px-3 py-2 text-xs">
          <CornerUpLeft
            className="h-3.5 w-3.5 text-[color:var(--color-brand-primary)]"
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1 truncate text-[color:var(--color-text-secondary)]">
            Respondendo: {replyTo.content}
          </span>
          <button
            type="button"
            onClick={onCancelReply}
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-disabled)] hover:text-[color:var(--color-text-primary)]"
            aria-label="Cancelar resposta"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      <div className="flex items-end gap-2">
        <MentionTextarea
          value={content}
          users={users}
          onChange={setContent}
          placeholder="Escreva uma mensagem..."
          ariaLabel="Nova mensagem"
          rows={2}
          disabled={isSending}
          className="min-h-12 flex-1 resize-none"
        />
        <button
          type="submit"
          disabled={isSending || !content.trim()}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-brand-primary)] text-white transition hover:bg-[color:var(--color-brand-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Enviar mensagem"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}
