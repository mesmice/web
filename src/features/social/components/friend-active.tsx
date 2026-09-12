import { MessageSquareText, Sparkles, Video, Wifi } from 'lucide-react';
import type { FriendListItem } from './friend-list.js';

interface FriendActiveListProps {
  items: FriendListItem[];
  title?: string;
  className?: string;
  maxItems?: number;
}

function getStatusText(friend: FriendListItem) {
  if (friend.status === 'online') return 'Disponível agora';
  if (friend.status === 'busy') return 'Em reunião';
  if (friend.status === 'away') return 'Ausente há pouco';
  return 'Offline';
}

function FriendAvatar({ friend }: { friend: FriendListItem }) {
  if (friend.avatarUrl) {
    return <img src={friend.avatarUrl} alt={friend.displayName} className="h-10 w-10 rounded-full object-cover" />;
  }

  const initials = friend.displayName
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-xs font-semibold text-white shadow-sm">
      {initials}
    </div>
  );
}

export function FriendActiveList({
  items,
  title = 'Ativo agora',
  className = '',
  maxItems
}: FriendActiveListProps) {
  const visibleItems = typeof maxItems === 'number' ? items.slice(0, maxItems) : items;

  if (visibleItems.length === 0) {
    return (
      <aside
        className={[
          'rounded-[var(--radius-lg)] border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-primary)] p-4',
          className
        ].join(' ')}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[color:var(--color-text-primary)]">{title}</h3>
        </div>

        <div className="rounded-[var(--radius-md)] border border-dashed border-[color:var(--color-border-default)] bg-[color:var(--color-surface-secondary)] p-4 text-center text-sm text-[color:var(--color-text-muted)]">
          <Sparkles className="mx-auto mb-2 h-4 w-4 text-[color:var(--color-brand-primary)]" />
          Nenhum amigo ativo no momento.
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={[
        'rounded-[var(--radius-lg)] border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-primary)] p-4',
        className
      ].join(' ')}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-[color:var(--color-text-primary)]">{title}</h3>
        <span className="rounded-full border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-secondary)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-secondary)]">
          {visibleItems.length}
        </span>
      </div>

      <div className="space-y-2">
        {visibleItems.map((friend) => (
          <div
            key={friend.id}
            className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-secondary)] px-3 py-2.5 transition hover:border-[color:var(--color-border-strong)] hover:bg-[color:var(--color-surface-elevated)]"
          >
            <div className="relative shrink-0">
              <FriendAvatar friend={friend} />
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[color:var(--color-surface-primary)] bg-emerald-400" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[color:var(--color-text-primary)]">
                {friend.displayName}
              </p>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-[color:var(--color-text-muted)]">
                <Wifi className="h-3 w-3 text-emerald-400" aria-hidden="true" />
                <span className="truncate">{getStatusText(friend)}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label={`Abrir chat com ${friend.displayName}`}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--color-border-default)] bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand-primary)] transition hover:border-[color:var(--color-brand-primary)] hover:bg-[color:var(--color-brand-primary)] hover:text-white"
              >
                <MessageSquareText className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label={`Iniciar chamada com ${friend.displayName}`}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-secondary)] text-[color:var(--color-text-secondary)] transition hover:border-[color:var(--color-brand-primary)] hover:bg-[color:var(--color-action-secondary)] hover:text-[color:var(--color-action-secondary-text)]"
              >
                <Video className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

export default FriendActiveList;
