import { MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import type { MessageResponse, ThreadResponse } from '../../../lib/api/endpoints.js';

interface MessageItemProps {
  message: MessageResponse;
  messages: MessageResponse[];
  currentUserId?: string;
  onReply: (message: MessageResponse) => void;
  onCreateThread: (message: MessageResponse) => void;
  onSaveMessage?: (message: MessageResponse) => void;
  thread?: ThreadResponse;
  onOpenThread?: (thread: ThreadResponse) => void;
  className?: string;
}

export function MessageItem({
  message,
  messages,
  currentUserId,
  onReply,
  onCreateThread,
  onSaveMessage,
  thread,
  onOpenThread,
  className
}: MessageItemProps) {
  const [actionsOpen, setActionsOpen] = useState(false);
  const isMine = message.authorId === currentUserId;
  const authorLabel = isMine ? 'Você' : `Usuário ${message.authorId.slice(0, 6)}`;
  const reply = message.replyToId
    ? messages.find((item) => item.id === message.replyToId)
    : undefined;

  return (
    <li
      data-message-id={message.id}
      className={['group flex gap-2.5', className].filter(Boolean).join(' ')}
    >
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[color:var(--color-brand-soft)] text-xs font-extrabold text-[color:var(--color-brand-primary)]">
        {authorLabel.slice(0, 1)}
      </div>
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <strong className="text-sm text-[color:var(--color-text-primary)]">{authorLabel}</strong>
          <time
            className="text-[.7rem] text-[color:var(--color-text-muted)]"
            dateTime={message.createdAt}
          >
            {new Date(message.createdAt).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </time>
        </div>
        {reply ? (
          <div className="mt-1 border-l-2 border-[color:var(--color-brand-lilac)] pl-2 text-xs text-[color:var(--color-text-muted)]">
            Respondendo: {reply.content}
          </div>
        ) : null}
        <p className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-normal text-[color:var(--color-text-secondary)]">
          {message.content}
        </p>
        {thread && onOpenThread ? (
          <button
            type="button"
            onClick={() => onOpenThread(thread)}
            className="mt-2 inline-flex items-center gap-1 rounded-md bg-[color:var(--color-brand-soft)] px-2 py-1 text-xs font-semibold text-[color:var(--color-brand-primary)]"
          >
            <span aria-hidden="true">💬</span> Abrir tópico
          </button>
        ) : null}
        <div className="relative mt-1 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
          <button
            type="button"
            aria-label="Ações da mensagem"
            aria-expanded={actionsOpen}
            onClick={() => setActionsOpen((open) => !open)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-brand-soft)] hover:text-[color:var(--color-brand-primary)]"
          >
            <MoreHorizontal size={16} aria-hidden="true" />
          </button>
          {actionsOpen ? (
            <div className="absolute left-0 top-8 z-10 grid min-w-40 gap-1 rounded-md border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-primary)] p-1 shadow-lg">
              <button
                type="button"
                className="rounded px-2 py-1.5 text-left text-xs text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-brand-soft)]"
                onClick={() => {
                  setActionsOpen(false);
                  onReply(message);
                }}
              >
                Responder
              </button>
              <button
                type="button"
                className="rounded px-2 py-1.5 text-left text-xs text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-brand-soft)]"
                onClick={() => {
                  setActionsOpen(false);
                  onCreateThread(message);
                }}
              >
                Criar tópico
              </button>
              {onSaveMessage ? (
                <button
                  type="button"
                  className="rounded px-2 py-1.5 text-left text-xs text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-brand-soft)]"
                  onClick={() => {
                    setActionsOpen(false);
                    onSaveMessage(message);
                  }}
                >
                  Guardar mensagem
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}
