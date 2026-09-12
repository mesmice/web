import type { MessageResponse } from '../../../lib/api/endpoints.js';

interface MessageItemProps {
  message: MessageResponse;
  messages: MessageResponse[];
  currentUserId?: string;
  onReply: (message: MessageResponse) => void;
}

export function MessageItem({ message, messages, currentUserId, onReply }: MessageItemProps) {
  const isMine = message.authorId === currentUserId;
  const authorLabel = isMine ? 'Você' : `Usuário ${message.authorId.slice(0, 6)}`;
  const reply = message.replyToId
    ? messages.find((item) => item.id === message.replyToId)
    : undefined;

  return (
    <li className="group flex gap-2.5">
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
        <button
          type="button"
          className="mt-1 border-0 bg-transparent p-0 text-xs text-[color:var(--color-text-muted)] opacity-0 transition group-hover:opacity-100 focus:opacity-100"
          onClick={() => onReply(message)}
        >
          Responder
        </button>
      </div>
    </li>
  );
}
