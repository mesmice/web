import { RefreshCw, WifiOff } from 'lucide-react';
import type { ConversationSummary } from '../../../lib/types/conversations.js';
import type { ConnectionStatus } from '../../../stores/ui-store.js';
import { DmListEmptyState } from './dm-list-empty-state.js';
import { DmListItem } from './dm-list-item.js';
import { DmListSkeleton } from './dm-list-skeleton.js';

interface DmListProps {
  conversations: ConversationSummary[];
  currentUserId: string;
  activeConversationId?: string;
  connectionStatus: ConnectionStatus;
  loading: boolean;
  fetching: boolean;
  error: boolean;
  onRetry: () => void;
  onSelect: (conversation: ConversationSummary) => void;
}

export function DmList({
  conversations,
  currentUserId,
  activeConversationId,
  connectionStatus,
  loading,
  fetching,
  error,
  onRetry,
  onSelect
}: DmListProps) {
  const offline = connectionStatus === 'disconnected' || connectionStatus === 'unavailable';

  return (
    <aside
      className="flex min-h-0 w-full shrink-0 flex-col border-r border-[color:var(--color-border-default)] bg-[color:var(--color-surface-secondary)] md:w-[320px]"
      aria-label="Conversas diretas"
    >
      <header className="flex min-h-[74px] items-center justify-between border-b border-[color:var(--color-border-default)] px-4 py-3">
        <div>
          <h1 className="text-base font-bold text-[color:var(--color-brand-deep-purple)]">
            Mensagens
          </h1>
          <p className="text-xs text-[color:var(--color-text-muted)]">Conversas diretas</p>
        </div>
        {fetching && !loading ? (
          <span
            className="inline-flex items-center gap-1 text-xs text-[color:var(--color-text-muted)]"
            role="status"
          >
            <RefreshCw size={13} className="animate-spin" aria-hidden="true" /> Atualizando
          </span>
        ) : null}
      </header>

      {offline ? (
        <p
          className="flex items-center gap-2 border-b border-[color:var(--color-border-default)] bg-[color:var(--color-danger-soft)] px-4 py-2 text-xs text-[color:var(--color-danger)]"
          role="status"
        >
          <WifiOff size={14} aria-hidden="true" /> Offline. Exibindo dados disponíveis.
        </p>
      ) : connectionStatus === 'reconnecting' ? (
        <p
          className="border-b border-[color:var(--color-border-default)] px-4 py-2 text-xs text-[color:var(--color-text-muted)]"
          role="status"
        >
          Reconectando em tempo real…
        </p>
      ) : null}

      <div className="min-h-0 flex flex-1 flex-col overflow-y-auto">
        {loading ? (
          <DmListSkeleton />
        ) : error && conversations.length === 0 ? (
          <div
            className="flex flex-1 flex-col items-center justify-center px-5 py-10 text-center"
            role="alert"
          >
            <p className="font-semibold text-[color:var(--color-text-primary)]">
              Não foi possível carregar as conversas.
            </p>
            <button
              type="button"
              className="mt-4 rounded-md bg-[color:var(--color-brand-primary)] px-3 py-2 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-border-focus)] focus-visible:ring-offset-2"
              onClick={onRetry}
            >
              Tentar novamente
            </button>
          </div>
        ) : conversations.length === 0 ? (
          <DmListEmptyState />
        ) : (
          <>
            {error ? (
              <div
                className="mx-3 mt-3 flex items-center justify-between gap-2 rounded-md bg-[color:var(--color-danger-soft)] px-3 py-2 text-xs text-[color:var(--color-danger)]"
                role="alert"
              >
                <span>Falha ao atualizar.</span>
                <button type="button" className="font-bold underline" onClick={onRetry}>
                  Tentar novamente
                </button>
              </div>
            ) : null}
            <ul className="space-y-1 p-3" aria-label="Lista de conversas diretas">
              {conversations.map((conversation) => (
                <DmListItem
                  key={conversation.id}
                  conversation={conversation}
                  currentUserId={currentUserId}
                  active={conversation.id === activeConversationId}
                  onSelect={onSelect}
                />
              ))}
            </ul>
          </>
        )}
      </div>
    </aside>
  );
}
