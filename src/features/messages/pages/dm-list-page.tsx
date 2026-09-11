import { MessageCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../../stores/auth-store.js';
import { useUiStore } from '../../../stores/ui-store.js';
import { DmList } from '../components/dm-list.js';
import { getConversationLabel } from '../components/dm-list-utils.js';
import { useConversations } from '../queries/use-conversations.js';

export function DmListPage() {
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId: string }>();
  const currentUserId = useAuthStore((state) => state.user?.id) ?? '';
  const connectionStatus = useUiStore((state) => state.gatewayStatus);
  const conversationsQuery = useConversations();
  const conversations = conversationsQuery.data?.items ?? [];
  const activeConversation = conversations.find((item) => item.id === conversationId);

  return (
    <div className="flex h-[calc(100dvh-65px)] min-h-[480px] min-w-0 overflow-hidden border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-primary)] md:rounded-xl">
      <DmList
        conversations={conversations}
        currentUserId={currentUserId}
        activeConversationId={conversationId}
        connectionStatus={connectionStatus}
        loading={conversationsQuery.isLoading}
        fetching={conversationsQuery.isFetching}
        error={conversationsQuery.isError}
        onRetry={() => void conversationsQuery.refetch()}
        onSelect={(conversation) => navigate(`/app/dms/${conversation.id}`)}
      />
      <main className="hidden min-w-0 flex-1 flex-col items-center justify-center px-6 text-center md:flex">
        <span className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand-primary)]">
          <MessageCircle size={26} aria-hidden="true" />
        </span>
        {activeConversation ? (
          <>
            <h2 className="font-semibold text-[color:var(--color-text-primary)]">
              {getConversationLabel(activeConversation, currentUserId)}
            </h2>
            <p className="mt-1 max-w-sm text-sm text-[color:var(--color-text-muted)]">
              Conversa selecionada. O conteúdo será implementado na próxima etapa.
            </p>
          </>
        ) : (
          <>
            <h2 className="font-semibold text-[color:var(--color-text-primary)]">
              Selecione uma conversa
            </h2>
            <p className="mt-1 max-w-sm text-sm text-[color:var(--color-text-muted)]">
              Escolha uma mensagem direta na lista para continuar.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
