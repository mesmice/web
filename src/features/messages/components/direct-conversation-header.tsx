import { ArrowLeft, Users } from 'lucide-react';
import type { ConversationSummary } from '../../../lib/types/conversations.js';
import { getConversationLabel, getOtherParticipants } from './dm-list-utils.js';

interface DirectConversationHeaderProps {
  conversation: ConversationSummary;
  currentUserId: string;
  onBack: () => void;
}

function initials(value: string): string {
  const words = value.trim().split(/\s+/).filter(Boolean);
  return (
    words.length > 1 ? `${words[0][0]}${words[1][0]}` : words[0]?.slice(0, 2) || '?'
  ).toUpperCase();
}

export function DirectConversationHeader({
  conversation,
  currentUserId,
  onBack
}: DirectConversationHeaderProps) {
  const participants = getOtherParticipants(conversation, currentUserId);
  const participant = conversation.type === 'DM' ? participants[0] : undefined;
  const label = getConversationLabel(conversation, currentUserId);

  return (
    <header className="flex min-h-[74px] items-center gap-3 border-b border-[color:var(--color-border-default)] px-3.5 sm:px-6">
      <button
        type="button"
        className="inline-grid h-9 w-9 shrink-0 place-items-center rounded-md text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-brand-soft)] hover:text-[color:var(--color-brand-primary)] md:hidden"
        onClick={onBack}
        aria-label="Voltar para conversas"
      >
        <ArrowLeft size={19} aria-hidden="true" />
      </button>
      <span className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-[color:var(--color-brand-soft)] font-bold text-[color:var(--color-brand-deep-purple)]">
        {participant?.avatarUrl ? (
          <img
            className="h-full w-full object-cover"
            src={participant.avatarUrl}
            alt={`Avatar de ${label}`}
          />
        ) : conversation.type === 'GROUP_DM' && participants.length === 0 ? (
          <Users size={19} aria-label={`Avatar de ${label}`} />
        ) : (
          <span aria-label={`Avatar de ${label}`}>{initials(label)}</span>
        )}
      </span>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold text-[color:var(--color-text-primary)]">
          {label}
        </h1>
        <p className="mt-0.5 truncate text-xs text-[color:var(--color-text-muted)]">
          {participant?.username
            ? `@${participant.username} · ${participant.presence}`
            : `${conversation.participants.length} participantes`}
        </p>
      </div>
    </header>
  );
}
