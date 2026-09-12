import { useEffect, useRef } from 'react';
import { ArrowLeft, LoaderCircle, MessageCircle } from 'lucide-react';
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
  const listHeadingRef = useRef<HTMLHeadingElement>(null);
  const conversationHeadingRef = useRef<HTMLHeadingElement>(null);
  const previousConversationIdRef = useRef<string | undefined>(undefined);
  const focusedViewRef = useRef<string | undefined>(undefined);
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

  useEffect(() => {
    const previousConversationId = previousConversationIdRef.current;
    previousConversationIdRef.current = conversationId;

    if (conversationId) {
      const view = `${conversationId}:${activeConversation ? 'active' : 'unavailable'}`;
      if (focusedViewRef.current === view) return;
      focusedViewRef.current = view;
      conversationHeadingRef.current?.focus();
      return;
    }

    if (!previousConversationId) return;
    focusedViewRef.current = undefined;
    const origin = Array.from(
      document.querySelectorAll<HTMLButtonElement>('[data-conversation-id]')
    ).find((item) => item.dataset.conversationId === previousConversationId);
    (origin ?? listHeadingRef.current)?.focus();
  }, [
    activeConversation,
    conversationId,
    conversationsQuery.isError,
    conversationsQuery.isLoading
  ]);

  function returnToList() {
    navigate('/app/dms');
  }

  const unavailableConversation = conversationId && !activeConversation;

  return (
    <div className="flex h-[calc(100dvh-7.25rem)] min-h-0 min-w-0 overflow-hidden border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-primary)] md:h-[calc(100dvh-7.5rem)] md:rounded-xl">
      <div className={`${conversationId ? 'hidden' : 'flex'} min-h-0 w-full md:flex md:w-auto`}>
        <DmList
          ref={listHeadingRef}
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
      <section
        aria-label="Conversa selecionada"
        className={`${conversationId ? 'flex' : 'hidden'} min-w-0 flex-1 flex-col bg-[color:var(--color-surface-primary)] md:flex`}
      >
        {activeConversation ? (
          <>
            <DirectConversationHeader
              conversation={activeConversation}
              currentUserId={currentUserId}
              onBack={returnToList}
              headingRef={conversationHeadingRef}
            />
            <DirectConversationHistory
              channelId={activeConversation.id}
              currentUserId={currentUserId}
              mentionUsers={mentionUsers}
            />
          </>
        ) : unavailableConversation ? (
          <>
            <header className="flex min-h-[74px] items-center gap-3 border-b border-[color:var(--color-border-default)] px-3.5 sm:px-6">
              <button
                type="button"
                className="inline-grid h-9 w-9 shrink-0 place-items-center rounded-md text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-brand-soft)] hover:text-[color:var(--color-brand-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-border-focus)]"
                onClick={returnToList}
                aria-label="Voltar às mensagens"
              >
                <ArrowLeft size={19} aria-hidden="true" />
              </button>
              <h1
                ref={conversationHeadingRef}
                tabIndex={-1}
                className="rounded-sm text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-border-focus)]"
              >
                {conversationsQuery.isLoading ? 'Carregando conversa' : 'Conversa indisponível'}
              </h1>
            </header>
            <div
              className="grid min-h-0 flex-1 place-content-center justify-items-center gap-3 overflow-y-auto px-6 py-8 text-center"
              role={conversationsQuery.isError ? 'alert' : undefined}
            >
              {conversationsQuery.isLoading ? (
                <>
                  <LoaderCircle
                    size={30}
                    className="animate-spin text-[color:var(--color-brand-primary)]"
                    aria-hidden="true"
                  />
                  <p className="text-sm text-[color:var(--color-text-muted)]" role="status">
                    Carregando conversa...
                  </p>
                </>
              ) : (
                <>
                  <MessageCircle
                    size={30}
                    className="text-[color:var(--color-text-muted)]"
                    aria-hidden="true"
                  />
                  <p className="max-w-sm text-sm text-[color:var(--color-text-muted)]">
                    {conversationsQuery.isError
                      ? 'Não foi possível atualizar a lista para localizar esta conversa.'
                      : 'Esta conversa não está disponível na lista carregada no momento.'}
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <button
                      type="button"
                      className="rounded-md bg-[color:var(--color-brand-primary)] px-3 py-2 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-border-focus)] focus-visible:ring-offset-2"
                      onClick={() => void conversationsQuery.refetch()}
                    >
                      Atualizar
                    </button>
                    <button
                      type="button"
                      className="rounded-md px-3 py-2 text-sm font-semibold text-[color:var(--color-brand-primary)] underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-border-focus)]"
                      onClick={returnToList}
                    >
                      Voltar às mensagens
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
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
      </section>
    </div>
  );
}
