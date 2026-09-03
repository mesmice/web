import { Check, RefreshCw, Search, UserPlus, UsersRound, X } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';

export type FriendRequestStatus = 'pending' | 'accepted' | 'declined';

export interface FriendRequestItem {
  id: string;
  displayName: string;
  username?: string | null;
  avatarUrl?: string | null;
  status?: FriendRequestStatus;
  mutualFriends?: number | null;
  message?: string | null;
  requestedAtLabel?: string | null;
  accentColor?: string | null;
}

interface FriendRequestsProps {
  title?: string;
  items?: FriendRequestItem[];
  receivedItems?: FriendRequestItem[];
  sentItems?: FriendRequestItem[];
  isLoading?: boolean;
  error?: string | null;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
  onRetry?: () => void;
  onAccept?: (friend: FriendRequestItem) => void;
  onDecline?: (friend: FriendRequestItem) => void;
  onViewProfile?: (friend: FriendRequestItem) => void;
}

interface FriendRequestApiShape {
  id?: string | number | null;
  displayName?: string | null;
  name?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  status?: FriendRequestStatus | string | null;
  mutualFriends?: number | null;
  message?: string | null;
  requestedAtLabel?: string | null;
  accentColor?: string | null;
}

const FALLBACK_COLORS = [
  'from-violet-500 to-indigo-500',
  'from-fuchsia-500 to-pink-500',
  'from-cyan-500 to-sky-500',
  'from-emerald-500 to-teal-500',
  'from-orange-500 to-amber-500'
];

function safeStatus(value?: FriendRequestStatus | string | null): FriendRequestStatus {
  if (value === 'pending' || value === 'accepted' || value === 'declined') {
    return value;
  }

  return 'pending';
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
      .slice(0, 2) || 'U'
  );
}

function getAvatarClass(color?: string | null) {
  if (color) return `bg-gradient-to-br ${color}`;
  const index = Math.abs(Math.round((color?.length ?? 0) % FALLBACK_COLORS.length));
  return `bg-gradient-to-br ${FALLBACK_COLORS[index]}`;
}

export function mapFriendRequestFromApi(raw: FriendRequestApiShape): FriendRequestItem {
  const displayName = raw.displayName ?? raw.name ?? 'Nova solicitação';

  return {
    id: String(raw.id ?? displayName),
    displayName,
    username: raw.username ?? null,
    avatarUrl: raw.avatarUrl ?? null,
    status: safeStatus(raw.status),
    mutualFriends: raw.mutualFriends ?? null,
    message: raw.message ?? null,
    requestedAtLabel: raw.requestedAtLabel ?? null,
    accentColor: raw.accentColor ?? null
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
        'inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-[var(--radius-md)] border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-secondary)] text-[color:var(--color-text-secondary)] transition-all duration-200 hover:text-white',
        className ?? ''
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  );
}

function FriendRequestAvatar({ friend }: { friend: FriendRequestItem }) {
  if (friend.avatarUrl) {
    return (
      <img
        src={friend.avatarUrl}
        alt={friend.displayName}
        className="h-12 w-12 rounded-full object-cover ring-2 ring-[color:var(--color-surface-primary)]"
      />
    );
  }

  return (
    <div
      className={[
        'flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white ring-2 ring-[color:var(--color-surface-primary)]',
        getAvatarClass(friend.accentColor)
      ].join(' ')}
      aria-label={`Avatar de ${friend.displayName}`}
    >
      {getInitials(friend.displayName)}
    </div>
  );
}

export function FriendRequests({
  title = 'Solicitações',
  items = [],
  receivedItems = [],
  sentItems = [],
  isLoading = false,
  error = null,
  emptyTitle = 'Nenhuma solicitação',
  emptyDescription = 'Quando alguém te pedir para conectar, aparecerá aqui.',
  className = '',
  onRetry,
  onAccept,
  onDecline,
  onViewProfile
}: FriendRequestsProps) {
  const resolvedReceivedItems = receivedItems.length > 0 ? receivedItems : items;
  const totalCount = resolvedReceivedItems.length + sentItems.length;

  return (
    <section
      aria-label={title}
      className={[
        'w-full rounded-[var(--radius-lg)] border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-primary)] p-4',
        className
      ].join(' ')}
    >
      <header className="mb-4 flex items-center justify-between gap-3 border-b border-[color:var(--color-border-default)] pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--color-brand-primary)] text-[color:var(--color-text-on-brand)] ring-1 ring-[color:var(--color-brand-primary)]">
            <UserPlus className="h-4 w-4" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-semibold text-[color:var(--color-text-primary)]">{title}</h2>
        </div>

        {totalCount > 0 ? (
          <span className="rounded-full border border-[color:var(--color-brand-lilac)] bg-[color:var(--color-brand-soft)] px-2.5 py-1 text-xs font-semibold text-[color:var(--color-brand-primary)]">
            {totalCount}
          </span>
        ) : null}
      </header>

      <div className="mb-4 flex items-center gap-2 rounded-[var(--radius-md)] border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-secondary)] px-3 py-2.5 text-sm text-[color:var(--color-text-secondary)]">
        <Search className="h-4 w-4 text-[color:var(--color-text-muted)]" aria-hidden="true" />
        <input
          aria-label="Buscar solicitações"
          placeholder="Buscar"
          className="w-full bg-transparent text-sm text-[color:var(--color-text-primary)] placeholder:text-[color:var(--color-text-muted)] focus:outline-none"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3" aria-busy="true" aria-live="polite">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="animate-pulse rounded-[var(--radius-md)] border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-secondary)] p-3"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-[color:var(--color-surface-disabled)]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-28 rounded-full bg-[color:var(--color-surface-disabled)]" />
                  <div className="h-3 w-20 rounded-full bg-[color:var(--color-surface-disabled)]" />
                </div>
                <div className="h-9 w-9 rounded-[var(--radius-md)] bg-[color:var(--color-surface-disabled)]" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-[var(--radius-md)] border border-[color:var(--color-danger)]/20 bg-[color:var(--color-danger-soft)] p-4 text-sm text-[color:var(--color-danger)]">
          <p className="font-medium text-[color:var(--color-text-primary)]">
            Não foi possível carregar as solicitações.
          </p>
          <p className="mt-1">{error}</p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-[var(--radius-md)] bg-[color:var(--color-danger)] px-3 py-2 font-medium text-white transition hover:bg-[color:var(--color-danger-hover)]"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Tentar novamente
            </button>
          ) : null}
        </div>
      ) : totalCount === 0 ? (
        <div className="rounded-[var(--radius-md)] border border-dashed border-[color:var(--color-border-default)] bg-[color:var(--color-surface-secondary)] p-8 text-center">
          <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--color-brand-primary)] text-[color:var(--color-text-on-brand)]">
            <UsersRound className="h-6 w-6" aria-hidden="true" />
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
        <div className="space-y-5 pt-2">
          <RequestGroup
            title="Recebidas"
            items={resolvedReceivedItems}
            onAccept={onAccept}
            onDecline={onDecline}
            onViewProfile={onViewProfile}
          />

          <RequestGroup
            title="Enviadas"
            items={sentItems}
            onAccept={onAccept}
            onDecline={onDecline}
            onViewProfile={onViewProfile}
          />
        </div>
      )}
    </section>
  );
}

function RequestGroup({
  title,
  items,
  onAccept,
  onDecline,
  onViewProfile
}: {
  title: string;
  items: FriendRequestItem[];
  onAccept?: (friend: FriendRequestItem) => void;
  onDecline?: (friend: FriendRequestItem) => void;
  onViewProfile?: (friend: FriendRequestItem) => void;
}) {
  if (items.length === 0) return null;

  const isReceivedGroup = title === 'Recebidas';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-text-muted)]">
          {title}
        </h3>
        <span className="text-[10px] text-[color:var(--color-text-muted)]">{items.length}</span>
      </div>

      <ul
        className="divide-y divide-[color:var(--color-border-default)]"
        aria-label={`${title} list`}
      >
        {items.map((friend) => (
          <li key={friend.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <button
              type="button"
              onClick={() => onViewProfile?.(friend)}
              className="shrink-0 cursor-pointer rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-focus-ring)]"
              aria-label={`Ver perfil de ${friend.displayName}`}
            >
              <FriendRequestAvatar friend={friend} />
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onViewProfile?.(friend)}
                  className="cursor-pointer truncate text-left text-base font-semibold text-[color:var(--color-text-primary)] hover:text-[color:var(--color-brand-primary)]"
                >
                  {friend.displayName}
                </button>

                {friend.mutualFriends && friend.mutualFriends > 0 ? (
                  <span className="rounded-full border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-secondary)] px-2 py-0.5 text-[10px] font-medium text-[color:var(--color-text-secondary)]">
                    {friend.mutualFriends} em comum
                  </span>
                ) : null}
              </div>

              {friend.message ? (
                <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
                  {friend.message}
                </p>
              ) : null}

              {friend.username ? (
                <p className="text-xs text-[color:var(--color-text-muted)]">@{friend.username}</p>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              {!isReceivedGroup ? (
                <ActionButton
                  onClick={() => onAccept?.(friend)}
                  className="hover:border-emerald-400 hover:bg-emerald-500"
                  aria-label={`Aceitar solicitação de ${friend.displayName}`}
                >
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                </ActionButton>
              ) : null}

              <ActionButton
                onClick={() => onDecline?.(friend)}
                className="hover:border-red-400 hover:bg-red-500"
                aria-label={`Recusar solicitação de ${friend.displayName}`}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </ActionButton>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default FriendRequests;
