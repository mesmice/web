import { MessageCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../../stores/auth-store.js';
import { useUiStore } from '../../../stores/ui-store.js';
import { DmList } from '../components/dm-list.js';
import { DirectConversationHeader } from '../components/direct-conversation-header.js';
import { DirectConversationHistory } from '../components/direct-conversation-history.js';
import { getOtherParticipants } from '../components/dm-list-utils.js';
import { useConversations } from '../queries/use-conversations.js';
import { useSyncActiveConversationRead } from '../queries/use-sync-active-conversation-read.js';

export function DmListPage() {
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId: string }>();
  const currentUserId = useAuthStore((state) => state.user?.id) ?? '';
  const connectionStatus = useUiStore((state) => state.gatewayStatus);
  const conversationsQuery = useConversations();
  const conversations = conversationsQuery.data?.items ?? [];
  const activeConversation = conversations.find((item) => item.id === conversationId);
  useSyncActiveConversationRead(activeConversation, conversationsQuery.dataUpdatedAt);
  const mentionUsers = activeConversation
    ? getOtherParticipants(activeConversation, currentUserId).map((participant) => ({
        id: participant.id,
        username: participant.username,
        displayName: participant.displayName,
        avatarUrl: participant.avatarUrl
      }))
    : [];

  return (
    <div className="flex h-[calc(100dvh-65px)] min-h-[480px] min-w-0 overflow-hidden border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-primary)] md:rounded-xl">
      <div className={`${conversationId ? 'hidden' : 'flex'} min-h-0 w-full md:flex md:w-auto`}>
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
      </div>
      <main
        className={`${conversationId ? 'flex' : 'hidden'} min-w-0 flex-1 flex-col bg-[color:var(--color-surface-primary)] md:flex`}
      >
        {activeConversation ? (
          <>
            <DirectConversationHeader
              conversation={activeConversation}
              currentUserId={currentUserId}
              onBack={() => navigate('/app/dms')}
            />
            <DirectConversationHistory
              channelId={activeConversation.id}
              currentUserId={currentUserId}
              mentionUsers={mentionUsers}
            />
          </>
        ) : conversationId && conversationsQuery.isLoading ? (
          <div
            className="flex flex-1 items-center justify-center text-sm text-[color:var(--color-text-muted)]"
            role="status"
          >
            Carregando conversa...
          </div>
        ) : conversationId && conversationsQuery.isError ? (
          <div
            className="grid flex-1 place-content-center justify-items-center gap-3 px-6 text-center"
            role="alert"
          >
            <p className="text-sm text-[color:var(--color-danger)]">
              Não foi possível localizar a conversa.
            </p>
            <button
              type="button"
              className="rounded-md bg-[color:var(--color-brand-primary)] px-3 py-2 text-sm font-semibold text-white"
              onClick={() => void conversationsQuery.refetch()}
            >
              Tentar novamente
            </button>
          </div>
        ) : conversationId ? (
          <div className="grid flex-1 place-content-center justify-items-center gap-2 px-6 text-center">
            <MessageCircle
              size={30}
              className="text-[color:var(--color-text-muted)]"
              aria-hidden="true"
            />
            <h1 className="text-base font-semibold">Conversa não encontrada</h1>
            <button
              type="button"
              className="text-sm font-semibold text-[color:var(--color-brand-primary)] underline"
              onClick={() => navigate('/app/dms')}
            >
              Voltar para conversas
            </button>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <span className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand-primary)]">
              <MessageCircle size={26} aria-hidden="true" />
            </span>
            <h2 className="font-semibold text-[color:var(--color-text-primary)]">
              Selecione uma conversa
            </h2>
            <p className="mt-1 max-w-sm text-sm text-[color:var(--color-text-muted)]">
              Escolha uma mensagem direta na lista para continuar.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
