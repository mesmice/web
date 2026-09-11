import { Users } from 'lucide-react';
import type { UserSummary } from '../../../lib/types/api.js';
import type { ConversationSummary } from '../../../lib/types/conversations.js';
import { getConversationLabel, getOtherParticipants } from './dm-list-utils.js';

interface DmListItemProps {
  conversation: ConversationSummary;
  currentUserId: string;
  active: boolean;
  onSelect: (conversation: ConversationSummary) => void;
}

function initials(value: string): string {
  const words = value.trim().split(/\s+/).filter(Boolean);
  return (
    words.length > 1 ? `${words[0][0]}${words[1][0]}` : words[0]?.slice(0, 2) || '?'
  ).toUpperCase();
}

function DirectAvatar({ participant }: { participant?: UserSummary }) {
  const label = participant?.displayName || 'Conversa direta';

  return (
    <span className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-[color:var(--color-brand-soft)] font-bold text-[color:var(--color-brand-deep-purple)]">
      {participant?.avatarUrl ? (
        <img
          className="h-full w-full object-cover"
          src={participant.avatarUrl}
          alt={`Avatar de ${label}`}
        />
      ) : (
        <span aria-label={`Avatar de ${label}`}>{initials(label)}</span>
      )}
      {participant?.presence ? (
        <span
          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[color:var(--color-surface-secondary)] ${
            participant.presence === 'online'
              ? 'bg-[color:var(--color-success)]'
              : participant.presence === 'idle'
                ? 'bg-[color:var(--color-warning)]'
                : participant.presence === 'dnd'
                  ? 'bg-[color:var(--color-danger)]'
                  : 'bg-[color:var(--color-text-disabled)]'
          }`}
          aria-label={`Presença: ${participant.presence}`}
        />
      ) : null}
    </span>
  );
}

function GroupAvatar({ participants, label }: { participants: UserSummary[]; label: string }) {
  const visibleParticipants = participants.slice(0, 2);

  if (visibleParticipants.length === 0) {
    return (
      <span
        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand-deep-purple)]"
        aria-label={`Avatar de ${label}`}
      >
        <Users size={20} aria-hidden="true" />
      </span>
    );
  }

  return (
    <span
      className="grid h-11 w-11 shrink-0 grid-cols-2 overflow-hidden rounded-xl"
      aria-label={`Avatar de ${label}`}
    >
      {visibleParticipants.map((participant) => (
        <span
          key={participant.id}
          className="grid place-items-center overflow-hidden bg-[color:var(--color-brand-soft)] text-[.65rem] font-bold text-[color:var(--color-brand-deep-purple)]"
        >
          {participant.avatarUrl ? (
            <img className="h-full w-full object-cover" src={participant.avatarUrl} alt="" />
          ) : (
            initials(participant.displayName)
          )}
        </span>
      ))}
    </span>
  );
}

export function DmListItem({ conversation, currentUserId, active, onSelect }: DmListItemProps) {
  const otherParticipants = getOtherParticipants(conversation, currentUserId);
  const label = getConversationLabel(conversation, currentUserId);
  const directParticipant = conversation.type === 'DM' ? otherParticipants[0] : undefined;

  return (
    <li>
      <button
        data-conversation-id={conversation.id}
        type="button"
        className={`flex w-full items-center gap-3 rounded-lg border-0 px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-border-focus)] focus-visible:ring-offset-2 ${
          active
            ? 'bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand-deep-purple)]'
            : 'bg-transparent text-[color:var(--color-text-primary)] hover:bg-[color:var(--color-surface-elevated)]'
        }`}
        onClick={() => onSelect(conversation)}
        aria-current={active ? 'page' : undefined}
        aria-label={`${label}${conversation.unreadCount > 0 ? `, ${conversation.unreadCount} não lidas` : ''}`}
      >
        {conversation.type === 'DM' ? (
          <DirectAvatar participant={directParticipant} />
        ) : (
          <GroupAvatar participants={otherParticipants} label={label} />
        )}
        <span className="min-w-0 flex-1">
          <strong className="block truncate text-sm">{label}</strong>
          {directParticipant?.username ? (
            <span className="mt-0.5 block truncate text-xs text-[color:var(--color-text-muted)]">
              @{directParticipant.username}
            </span>
          ) : conversation.type === 'GROUP_DM' ? (
            <span className="mt-0.5 block truncate text-xs text-[color:var(--color-text-muted)]">
              {conversation.participants.length} participantes
            </span>
          ) : null}
        </span>
        {conversation.unreadCount > 0 ? (
          <span
            className="grid min-w-5 place-items-center rounded-full bg-[color:var(--color-brand-primary)] px-1.5 py-0.5 text-[.7rem] font-bold text-white"
            aria-label={`${conversation.unreadCount} mensagens não lidas`}
          >
            {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
          </span>
        ) : null}
      </button>
    </li>
  );
}
