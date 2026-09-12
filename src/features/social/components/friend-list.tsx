import { MessageSquareText, MoreHorizontal, Sparkles, Users } from 'lucide-react';

export type FriendStatus = 'online' | 'away' | 'busy' | 'offline';

export interface FriendListItem {
  id: string;
  displayName: string;
  username?: string | null;
  avatarUrl?: string | null;
  status?: FriendStatus;
  bio?: string | null;
  mutualFriends?: number | null;
  isFollowing?: boolean;
  lastActiveLabel?: string | null;
  accentColor?: string | null;
}

interface FriendListProps {
  title?: string;
  items?: FriendListItem[];
  isLoading?: boolean;
  error?: string | null;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
  maxItems?: number;
  showOnlyActive?: boolean;
  onRetry?: () => void;
  onProfileClick?: (friend: FriendListItem) => void;
  onMessageClick?: (friend: FriendListItem) => void;
}

const STATUS_META: Record<FriendStatus, { label: string; badgeClassName: string }> = {
  online: {
    label: 'Online',
    badgeClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700'
  },
  away: {
    label: 'Ausente',
    badgeClassName: 'border-amber-200 bg-amber-50 text-amber-700'
  },
  busy: {
    label: 'Ocupado',
    badgeClassName: 'border-violet-200 bg-violet-50 text-violet-700'
  },
  offline: {
    label: 'Offline',
    badgeClassName: 'border-slate-200 bg-slate-100 text-slate-600'
  }
};

const FALLBACK_COLORS = [
  'from-violet-500 to-indigo-500',
  'from-fuchsia-500 to-pink-500',
  'from-cyan-500 to-sky-500',
  'from-emerald-500 to-teal-500',
  'from-orange-500 to-amber-500'
];

function safeStatus(status?: FriendStatus | string | null): FriendStatus {
  if (status === 'online' || status === 'away' || status === 'busy' || status === 'offline') {
    return status;
  }

  return 'offline';
}

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('')
      .slice(0, 2) || 'M'
  );
}

function getAvatarClasses(color?: string | null) {
  if (color) {
    return `bg-gradient-to-br ${color}`;
  }

  const index = Math.abs(Math.round((color?.length ?? 0) % FALLBACK_COLORS.length));
  return `bg-gradient-to-br ${FALLBACK_COLORS[index]}`;
}

function FriendAvatar({ friend }: { friend: FriendListItem }) {
  const gradientClass = getAvatarClasses(friend.accentColor);

  return friend.avatarUrl ? (
    <img
      src={friend.avatarUrl}
      alt={friend.displayName}
      className="h-12 w-12 rounded-full object-cover ring-2 ring-[color:var(--color-surface-primary)]"
    />
  ) : (
    <div
      className={[
        'flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold text-white ring-2 ring-[color:var(--color-surface-primary)]',
        gradientClass
      ].join(' ')}
      aria-label={`Avatar de ${friend.displayName}`}
    >
      {getInitials(friend.displayName)}
    </div>
  );
}

function FriendListSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-[var(--radius-md)] border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-secondary)] p-4"
        >
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-[color:var(--color-surface-disabled)]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded-full bg-[color:var(--color-surface-disabled)]" />
              <div className="h-3 w-24 rounded-full bg-[color:var(--color-surface-disabled)]" />
            </div>
            <div className="h-6 w-20 rounded-full bg-[color:var(--color-surface-disabled)]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FriendList({
  title = 'Amigos',
  items = [],
  isLoading = false,
  error = null,
  emptyTitle = 'Nenhum amigo por aqui',
  emptyDescription = 'Quando você tiver contatos, eles aparecerão aqui.',
  className = '',
  maxItems,
  showOnlyActive = false,
  onRetry,
  onProfileClick,
  onMessageClick
}: FriendListProps) {
  const filteredItems = showOnlyActive
    ? items.filter((friend) => friend.status === 'online' || friend.status === 'busy')
    : items;

  const visibleItems =
    typeof maxItems === 'number' ? filteredItems.slice(0, maxItems) : filteredItems;

  return (
    <section
      aria-label={title}
      className={[
        'w-full rounded-[var(--radius-lg)] bg-[color:var(--color-surface-primary)] p-4',
        className
      ].join(' ')}
    >
      <header className="mb-4 flex items-center justify-between gap-3 border-b border-[color:var(--color-border-default)] pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--color-brand-primary)] text-[color:var(--color-text-on-brand)] ring-1 ring-[color:var(--color-brand-primary)]">
            <Users className="h-4 w-4" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-semibold text-[color:var(--color-text-primary)]">{title}</h2>
        </div>

        {visibleItems.length > 0 ? (
          <span className="rounded-full border border-[color:var(--color-brand-lilac)] bg-[color:var(--color-brand-soft)] px-2.5 py-1 text-xs font-semibold text-[color:var(--color-brand-primary)]">
            {visibleItems.length}
          </span>
        ) : null}
      </header>

      {isLoading ? (
        <FriendListSkeleton />
      ) : error ? (
        <div className="rounded-[var(--radius-md)] border border-[color:var(--color-danger)]/20 bg-[color:var(--color-danger-soft)] p-4 text-sm text-[color:var(--color-danger)]">
          <p className="font-medium text-[color:var(--color-text-primary)]">
            Não foi possível carregar os amigos.
          </p>
          <p className="mt-1 text-[color:var(--color-danger)]">{error}</p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 cursor-pointer rounded-[var(--radius-md)] bg-[color:var(--color-danger)] px-4 py-2 font-medium text-white transition hover:bg-[color:var(--color-danger-hover)]"
            >
              Tentar novamente
            </button>
          ) : null}
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="rounded-[var(--radius-md)] border border-dashed border-[color:var(--color-border-default)] bg-[color:var(--color-surface-secondary)] p-6 text-center">
          <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--color-brand-primary)] text-[color:var(--color-text-on-brand)]">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-[color:var(--color-brand-lilac)]" />
          </div>
          <h3 className="text-base font-semibold text-[color:var(--color-text-primary)]">
            {emptyTitle}
          </h3>
          <p className="mt-2 text-sm text-[color:var(--color-text-secondary)]">
            {emptyDescription}
          </p>
        </div>
      ) : (
        <ul className="space-y-2 pt-2" aria-label={`${title} list`}>
          {visibleItems.map((friend) => {
            const status = safeStatus(friend.status);
            const statusMeta = STATUS_META[status];

            return (
              <li
                key={friend.id}
                className="flex items-center gap-3 rounded-[var(--radius-md)] bg-[color:var(--color-surface-secondary)] px-3 py-2.5 transition-colors duration-200 hover:bg-[color:var(--color-surface-elevated)]"
              >
                <button
                  type="button"
                  onClick={() => onProfileClick?.(friend)}
                  className="shrink-0 cursor-pointer rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-focus-ring)]"
                  aria-label={`Ver perfil de ${friend.displayName}`}
                >
                  <FriendAvatar friend={friend} />
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onProfileClick?.(friend)}
                      className="cursor-pointer truncate text-left text-[15px] font-medium text-[color:var(--color-text-primary)] transition hover:text-[color:var(--color-brand-primary)]"
                    >
                      {friend.displayName}
                    </button>

                    {friend.username ? (
                      <span className="text-[11px] text-[color:var(--color-text-muted)]">
                        @{friend.username}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-[11px] text-[color:var(--color-text-muted)]">
                    <span
                      className={[
                        'inline-flex h-2 w-2 rounded-full',
                        status === 'online'
                          ? 'bg-emerald-400'
                          : status === 'busy'
                            ? 'bg-violet-400'
                            : 'bg-slate-400'
                      ].join(' ')}
                      aria-hidden="true"
                    />
                    <span>{statusMeta.label}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {onMessageClick ? (
                    <button
                      type="button"
                      onClick={() => onMessageClick(friend)}
                      className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[color:var(--color-border-default)] bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand-primary)] transition hover:border-[color:var(--color-brand-primary)] hover:bg-[color:var(--color-brand-primary)] hover:text-white"
                      aria-label={`Enviar mensagem para ${friend.displayName}`}
                    >
                      <MessageSquareText className="h-4 w-4" aria-hidden="true" />
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => onProfileClick?.(friend)}
                    className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-secondary)] text-[color:var(--color-text-primary)] transition hover:border-[color:var(--color-brand-primary)] hover:bg-[color:var(--color-action-secondary)] hover:text-[color:var(--color-action-secondary-text)]"
                    aria-label={`Abrir perfil de ${friend.displayName}`}
                  >
                    <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default FriendList;
