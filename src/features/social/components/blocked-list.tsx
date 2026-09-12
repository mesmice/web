import { Ban, RefreshCw, Search, ShieldCheck, UnlockKeyhole } from 'lucide-react';

export interface BlockedListItem {
  id: string;
  displayName: string;
  username?: string | null;
  avatarUrl?: string | null;
  accentColor?: string | null;
  isBlocked?: boolean;
}

interface BlockedListProps {
  items?: BlockedListItem[];
  isLoading?: boolean;
  error?: string | null;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
  onRetry?: () => void;
  onToggleBlock?: (person: BlockedListItem) => void;
  onViewProfile?: (person: BlockedListItem) => void;
}

const FALLBACK_COLORS = [
  'from-violet-500 to-indigo-500',
  'from-fuchsia-500 to-pink-500',
  'from-cyan-500 to-sky-500',
  'from-emerald-500 to-teal-500',
  'from-orange-500 to-amber-500'
];

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

function getAvatarClass(color: string | null | undefined, name: string) {
  if (color) return `bg-gradient-to-br ${color}`;
  const index = Math.abs(name.length % FALLBACK_COLORS.length);
  return `bg-gradient-to-br ${FALLBACK_COLORS[index]}`;
}

function PersonAvatar({ person }: { person: BlockedListItem }) {
  if (person.avatarUrl) {
    return (
      <img
        src={person.avatarUrl}
        alt={person.displayName}
        className="h-11 w-11 rounded-full object-cover ring-2 ring-[color:var(--color-surface-primary)]"
      />
    );
  }

  return (
    <div
      className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br text-sm font-semibold text-white ring-2 ring-[color:var(--color-surface-primary)] ${getAvatarClass(person.accentColor, person.displayName)}`}
      aria-label={`Avatar de ${person.displayName}`}
    >
      {getInitials(person.displayName)}
    </div>
  );
}

function BlockedListSkeleton() {
  return (
    <div className="space-y-2" aria-busy="true" aria-live="polite">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-[var(--radius-md)] bg-[color:var(--color-surface-secondary)] px-3 py-2.5"
        >
          <div className="h-11 w-11 animate-pulse rounded-full bg-[color:var(--color-surface-disabled)]" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-32 animate-pulse rounded-full bg-[color:var(--color-surface-disabled)]" />
            <div className="h-3 w-20 animate-pulse rounded-full bg-[color:var(--color-surface-disabled)]" />
          </div>
          <div className="h-9 w-28 animate-pulse rounded-[var(--radius-md)] bg-[color:var(--color-surface-disabled)]" />
        </div>
      ))}
    </div>
  );
}

export function BlockedList({
  items = [],
  isLoading = false,
  error = null,
  emptyTitle = 'Ninguém está bloqueado',
  emptyDescription = 'Pessoas que você bloquear aparecerão aqui.',
  className = '',
  onRetry,
  onToggleBlock,
  onViewProfile
}: BlockedListProps) {
  return (
    <section
      aria-label="Pessoas bloqueadas"
      className={[
        'w-full rounded-[var(--radius-lg)] bg-[color:var(--color-surface-primary)] p-4',
        className
      ].join(' ')}
    >
      <header className="mb-4 flex items-center justify-between gap-3 border-b border-[color:var(--color-border-default)] pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--color-brand-primary)] text-[color:var(--color-text-on-brand)] ring-1 ring-[color:var(--color-brand-primary)]">
            <Ban className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[color:var(--color-text-primary)]">
              Bloqueados
            </h1>
            <p className="text-xs text-[color:var(--color-text-muted)]">
              Controle quem pode interagir com você
            </p>
          </div>
        </div>
        {items.length > 0 ? (
          <span className="rounded-full border border-[color:var(--color-brand-lilac)] bg-[color:var(--color-brand-soft)] px-2.5 py-1 text-xs font-semibold text-[color:var(--color-brand-primary)]">
            {items.length}
          </span>
        ) : null}
      </header>

      <div className="mb-4 flex items-center gap-2 rounded-[var(--radius-md)] border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-secondary)] px-3 py-2.5 text-sm text-[color:var(--color-text-secondary)]">
        <Search className="h-4 w-4 text-[color:var(--color-text-muted)]" aria-hidden="true" />
        <input
          aria-label="Buscar pessoas"
          placeholder="Buscar pessoas"
          className="w-full bg-transparent text-sm text-[color:var(--color-text-primary)] placeholder:text-[color:var(--color-text-muted)] focus:outline-none"
        />
      </div>

      {isLoading ? (
        <BlockedListSkeleton />
      ) : error ? (
        <div className="rounded-[var(--radius-md)] border border-[color:var(--color-danger)]/20 bg-[color:var(--color-danger-soft)] p-4 text-sm">
          <p className="font-medium text-[color:var(--color-text-primary)]">
            Não foi possível carregar a lista.
          </p>
          <p className="mt-1 text-[color:var(--color-danger)]">{error}</p>
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
      ) : items.length === 0 ? (
        <div className="rounded-[var(--radius-md)] border border-dashed border-[color:var(--color-border-default)] bg-[color:var(--color-surface-secondary)] p-8 text-center">
          <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--color-brand-primary)] text-[color:var(--color-text-on-brand)]">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-[color:var(--color-brand-lilac)]" />
          </div>
          <h2 className="text-base font-semibold text-[color:var(--color-text-primary)]">
            {emptyTitle}
          </h2>
          <p className="mt-2 text-sm text-[color:var(--color-text-secondary)]">
            {emptyDescription}
          </p>
        </div>
      ) : (
        <ul
          className="divide-y divide-[color:var(--color-border-default)]"
          aria-label="Lista de bloqueios"
        >
          {items.map((person) => {
            const isBlocked = person.isBlocked ?? true;

            return (
              <li key={person.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <button
                  type="button"
                  onClick={() => onViewProfile?.(person)}
                  className="shrink-0 cursor-pointer rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-focus-ring)]"
                  aria-label={`Ver perfil de ${person.displayName}`}
                >
                  <PersonAvatar person={person} />
                </button>
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => onViewProfile?.(person)}
                    className="cursor-pointer truncate text-left text-sm font-semibold text-[color:var(--color-text-primary)] hover:text-[color:var(--color-brand-primary)]"
                  >
                    {person.displayName}
                  </button>
                  {person.username ? (
                    <p className="truncate text-xs text-[color:var(--color-text-muted)]">
                      @{person.username}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => onToggleBlock?.(person)}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-[var(--radius-md)] border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-secondary)] px-3 py-2 text-xs font-semibold text-[color:var(--color-text-secondary)] transition hover:border-[color:var(--color-brand-primary)] hover:bg-[color:var(--color-action-secondary)] hover:text-[color:var(--color-brand-primary)]"
                  aria-label={`${isBlocked ? 'Desbloquear' : 'Bloquear'} ${person.displayName}`}
                >
                  {isBlocked ? (
                    <UnlockKeyhole className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Ban className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span className="hidden sm:inline">{isBlocked ? 'Desbloquear' : 'Bloquear'}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default BlockedList;
