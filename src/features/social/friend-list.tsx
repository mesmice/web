import { MessageSquareText, Sparkles, UserRound, Users } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';

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
  onRetry?: () => void;
  onProfileClick?: (friend: FriendListItem) => void;
  onMessageClick?: (friend: FriendListItem) => void;
}

interface FriendApiShape {
  id?: string | number | null;
  displayName?: string | null;
  name?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  status?: FriendStatus | string | null;
  bio?: string | null;
  mutualFriends?: number | null;
  isFollowing?: boolean | null;
  lastActiveLabel?: string | null;
  accentColor?: string | null;
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

export function mapFriendFromApi(rawFriend: FriendApiShape): FriendListItem {
  const displayName = rawFriend.displayName ?? rawFriend.name ?? 'Amigo';

  return {
    id: String(rawFriend.id ?? displayName),
    displayName,
    username: rawFriend.username ?? null,
    avatarUrl: rawFriend.avatarUrl ?? null,
    status: safeStatus(rawFriend.status),
    bio: rawFriend.bio ?? null,
    mutualFriends: rawFriend.mutualFriends ?? null,
    isFollowing: rawFriend.isFollowing ?? false,
    lastActiveLabel: rawFriend.lastActiveLabel ?? null,
    accentColor: rawFriend.accentColor ?? null
  };
}

function ActionButton({
  type = 'button',
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={[
        'inline-flex items-center justify-center gap-2 border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-secondary)] px-4 py-2 text-sm font-semibold text-[color:var(--color-text-primary)] transition-all duration-200',
        'rounded-[var(--radius-md)] min-h-[var(--control-height-md)] hover:border-[color:var(--color-brand-primary)] hover:bg-[color:var(--color-action-secondary)] hover:text-[color:var(--color-action-secondary-text)]',
        className ?? ''
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  );
}

function FriendAvatar({ friend }: { friend: FriendListItem }) {
  const gradientClass = getAvatarClasses(friend.accentColor);

  return friend.avatarUrl ? (
    <img
      src={friend.avatarUrl}
      alt={friend.displayName}
      className="h-12 w-12 rounded-full object-cover ring-2 ring-[#101722] shadow-sm"
    />
  ) : (
    <div
      className={[
        'flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold text-white shadow-sm ring-2 ring-[color:var(--color-surface-primary)]',
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
          className="animate-pulse rounded-2xl border border-[#2d3748] bg-[#171d2a] p-4"
        >
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-[#2d3748]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded-full bg-[#2d3748]" />
              <div className="h-3 w-24 rounded-full bg-[#2d3748]" />
            </div>
            <div className="h-6 w-20 rounded-full bg-[#2d3748]" />
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
  onRetry,
  onProfileClick,
  onMessageClick
}: FriendListProps) {
  const visibleItems = typeof maxItems === 'number' ? items.slice(0, maxItems) : items;

  return (
    <section
      aria-label={title}
      className={[
        'w-full rounded-[var(--radius-lg)] border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-primary)] p-4 shadow-[0_12px_28px_rgba(105,61,233,0.08)]',
        className
      ].join(' ')}
    >
      <header className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--color-action-secondary)] text-[color:var(--color-brand-primary)] ring-1 ring-[color:var(--color-border-default)]">
            <Users className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
              Social
            </p>
            <h2 className="text-xl font-semibold text-[color:var(--color-text-primary)]">
              {title}
            </h2>
          </div>
        </div>

        {items.length > 0 ? (
          <span className="rounded-full border border-[color:var(--color-brand-lilac)] bg-[color:var(--color-brand-soft)] px-2.5 py-1 text-xs font-semibold text-[color:var(--color-brand-primary)]">
            {items.length}
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
              className="mt-3 rounded-[var(--radius-md)] bg-[color:var(--color-danger)] px-4 py-2 font-medium text-white transition hover:bg-[color:var(--color-danger-hover)]"
            >
              Tentar novamente
            </button>
          ) : null}
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="rounded-[var(--radius-md)] border border-dashed border-[color:var(--color-border-default)] bg-[color:var(--color-surface-secondary)] p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand-primary)]">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </div>
          <h3 className="text-base font-semibold text-[color:var(--color-text-primary)]">
            {emptyTitle}
          </h3>
          <p className="mt-2 text-sm text-[color:var(--color-text-secondary)]">
            {emptyDescription}
          </p>
        </div>
      ) : (
        <ul className="space-y-3" aria-label={`${title} list`}>
          {visibleItems.map((friend) => {
            const status = safeStatus(friend.status);
            const statusMeta = STATUS_META[status];

            return (
              <li
                key={friend.id}
                className="rounded-[var(--radius-md)] border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-secondary)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[color:var(--color-brand-primary)] hover:shadow-[0_8px_24px_rgba(105,61,233,0.08)]"
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => onProfileClick?.(friend)}
                    className="shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-focus-ring)]"
                    aria-label={`Ver perfil de ${friend.displayName}`}
                  >
                    <FriendAvatar friend={friend} />
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onProfileClick?.(friend)}
                        className="text-left text-base font-semibold text-[color:var(--color-text-primary)] transition hover:text-[color:var(--color-brand-primary)]"
                      >
                        {friend.displayName}
                      </button>

                      {friend.isFollowing ? (
                        <span className="rounded-full border border-[color:var(--color-brand-primary)]/20 bg-[color:var(--color-brand-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[color:var(--color-brand-primary)]">
                          Seguindo
                        </span>
                      ) : null}
                    </div>

                    {friend.username ? (
                      <p className="mt-1 text-sm text-[color:var(--color-text-muted)]">
                        @{friend.username}
                      </p>
                    ) : null}

                    {friend.bio ? (
                      <p className="mt-2 text-sm leading-6 text-[color:var(--color-text-secondary)]">
                        {friend.bio}
                      </p>
                    ) : null}
                  </div>

                  <div className="hidden min-w-[112px] text-right sm:block">
                    <span
                      className={[
                        'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold',
                        statusMeta.badgeClassName
                      ].join(' ')}
                    >
                      {statusMeta.label}
                    </span>

                    {friend.mutualFriends && friend.mutualFriends > 0 ? (
                      <p className="mt-2 flex items-center justify-end gap-1 text-xs text-[color:var(--color-text-muted)]">
                        <Users className="h-3.5 w-3.5" aria-hidden="true" />
                        {friend.mutualFriends} em comum
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 border-t border-[color:var(--color-border-default)] pt-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-[color:var(--color-text-muted)]">
                    {friend.lastActiveLabel ??
                      (status === 'online' ? 'Disponível agora' : 'Última atividade recente')}
                  </p>

                  <div className="flex items-center gap-2">
                    {onMessageClick ? (
                      <ActionButton
                        onClick={() => onMessageClick(friend)}
                        aria-label={`Enviar mensagem para ${friend.displayName}`}
                      >
                        <MessageSquareText className="h-4 w-4" aria-hidden="true" />
                        Mensagem
                      </ActionButton>
                    ) : null}

                    {onProfileClick ? (
                      <ActionButton
                        onClick={() => onProfileClick(friend)}
                        className="bg-[color:var(--color-action-secondary)] text-[color:var(--color-action-secondary-text)] hover:bg-[color:var(--color-action-secondary-hover)]"
                        aria-label={`Abrir perfil de ${friend.displayName}`}
                      >
                        <UserRound className="h-4 w-4" aria-hidden="true" />
                        Perfil
                      </ActionButton>
                    ) : null}
                  </div>
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
