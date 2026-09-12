import { useEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, LoaderCircle, MessageCircle } from 'lucide-react';
import {
  getMessages,
  markChannelRead,
  sendMessage,
  type MessageResponse
} from '../../../lib/api/endpoints.js';
import { MessageComposer } from './message-composer.js';
import type { MentionableUser } from './mention-utils.js';

interface DirectConversationHistoryProps {
  channelId: string;
  currentUserId?: string;
  mentionUsers?: MentionableUser[];
  markAsRead?: boolean;
}

const EMPTY_MENTION_USERS: MentionableUser[] = [];

function MessageBubble({
  message,
  currentUserId,
  referencedMessage,
  onReply
}: {
  message: MessageResponse;
  currentUserId?: string;
  referencedMessage?: MessageResponse;
  onReply: (message: MessageResponse) => void;
}) {
  const isMine = message.authorId === currentUserId;

  return (
    <li className={['group flex gap-2', isMine ? 'justify-end' : 'justify-start'].join(' ')}>
      <div className="max-w-[82%]">
        {referencedMessage ? (
          <div className="mb-1 rounded-t-[var(--radius-sm)] border-l-2 border-[color:var(--color-brand-lilac)] bg-[color:var(--color-surface-secondary)] px-2 py-1 text-xs text-[color:var(--color-text-muted)]">
            {referencedMessage.content}
          </div>
        ) : null}
        <div
          className={[
            'rounded-2xl px-3 py-2 text-sm',
            isMine
              ? 'rounded-br-sm bg-[color:var(--color-brand-primary)] text-white'
              : 'rounded-bl-sm bg-[color:var(--color-surface-secondary)] text-[color:var(--color-text-primary)]'
          ].join(' ')}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
          <div className="mt-1 flex items-center justify-end gap-2 text-[10px] opacity-70">
            <time dateTime={message.createdAt}>
              {new Date(message.createdAt).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </time>
            {message.editedAt ? <span>editada</span> : null}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onReply(message)}
          className="mt-1 hidden text-xs text-[color:var(--color-text-muted)] group-hover:block focus-visible:block hover:text-[color:var(--color-brand-primary)]"
        >
          Responder
        </button>
      </div>
    </li>
  );
}

export function DirectConversationHistory({
  channelId,
  currentUserId,
  mentionUsers = EMPTY_MENTION_USERS,
  markAsRead = false
}: DirectConversationHistoryProps) {
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [replyTo, setReplyTo] = useState<MessageResponse | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const messagesQuery = useInfiniteQuery({
    queryKey: ['messages', channelId],
    queryFn: ({ pageParam }) => getMessages(channelId, { cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.nextCursor ?? undefined
  });
  const sendMutation = useMutation({
    mutationFn: ({ content, replyToId }: { content: string; replyToId?: string }) =>
      sendMessage(channelId, { content, replyToId, nonce: crypto.randomUUID() }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['messages', channelId] });
      setReplyTo(null);
    }
  });
  const messages = useMemo(
    () => messagesQuery.data?.pages.flatMap((page) => page.items).reverse() ?? [],
    [messagesQuery.data]
  );
  const messagesById = useMemo(
    () => new Map(messages.map((message) => [message.id, message])),
    [messages]
  );

  useEffect(() => {
    if (!messages.length || hasScrolledToBottom) return;
    const element = scrollRef.current;
    if (!element) return;
    element.scrollTop = element.scrollHeight;
    setHasScrolledToBottom(true);
  }, [hasScrolledToBottom, messages.length]);

  useEffect(() => {
    if (!markAsRead) return;
    const newestMessage = messages.at(-1);
    if (newestMessage) void markChannelRead(channelId, newestMessage.id);
  }, [channelId, markAsRead, messages]);

  async function loadOlderMessages() {
    const element = scrollRef.current;
    if (!element || !messagesQuery.hasNextPage || messagesQuery.isFetchingNextPage) return;
    const previousHeight = element.scrollHeight;
    await messagesQuery.fetchNextPage();
    requestAnimationFrame(() => {
      element.scrollTop += element.scrollHeight - previousHeight;
    });
  }

  function handleScroll() {
    const element = scrollRef.current;
    if (!element) return;
    setShowScrollButton(element.scrollHeight - element.scrollTop - element.clientHeight > 160);
    if (element.scrollTop < 80) void loadOlderMessages();
  }

  return (
    <>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="relative min-h-0 flex-1 overflow-y-auto px-[clamp(18px,4vw,54px)] py-6"
      >
        {messagesQuery.isLoading ? (
          <div
            className="flex h-full min-h-40 items-center justify-center text-sm text-[color:var(--color-text-muted)]"
            role="status"
            aria-label="Carregando mensagens"
          >
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            Carregando mensagens...
          </div>
        ) : messagesQuery.isError ? (
          <div
            className="grid h-full min-h-40 place-content-center justify-items-center gap-3 text-center"
            role="alert"
          >
            <p className="text-sm text-[color:var(--color-danger)]">
              Não foi possível carregar as mensagens.
            </p>
            <button
              type="button"
              className="rounded-md bg-[color:var(--color-brand-primary)] px-3 py-2 text-sm font-semibold text-white"
              onClick={() => void messagesQuery.refetch()}
            >
              Tentar novamente
            </button>
          </div>
        ) : messages.length > 0 ? (
          <>
            {messagesQuery.isFetchingNextPage ? (
              <div
                className="mb-3 flex justify-center text-xs text-[color:var(--color-text-muted)]"
                role="status"
              >
                <LoaderCircle className="mr-1 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                Carregando mensagens antigas...
              </div>
            ) : null}
            <ul
              className="mx-auto grid max-w-[900px] list-none gap-3 p-0"
              aria-label="Mensagens da conversa"
            >
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  currentUserId={currentUserId}
                  referencedMessage={
                    message.replyToId ? messagesById.get(message.replyToId) : undefined
                  }
                  onReply={setReplyTo}
                />
              ))}
            </ul>
          </>
        ) : (
          <div className="grid h-full place-content-center justify-items-center gap-2 text-center text-[color:var(--color-text-muted)]">
            <MessageCircle size={30} aria-hidden="true" />
            <h2 className="text-base text-[color:var(--color-text-primary)]">Comece a conversa</h2>
            <p className="text-sm">Este é o início do histórico.</p>
          </div>
        )}
        {showScrollButton ? (
          <button
            type="button"
            onClick={() =>
              scrollRef.current?.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth'
              })
            }
            className="sticky bottom-2 left-full inline-flex h-9 w-9 translate-x-[-2.25rem] items-center justify-center rounded-full border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-primary)] text-[color:var(--color-brand-primary)] shadow-md"
            aria-label="Ir para a mensagem mais recente"
          >
            <ArrowDown className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>
      <MessageComposer
        users={mentionUsers}
        replyTo={replyTo}
        isSending={sendMutation.isPending}
        onCancelReply={() => setReplyTo(null)}
        onSend={async (content, replyToId) => {
          await sendMutation.mutateAsync({ content, replyToId });
          setHasScrolledToBottom(false);
        }}
      />
    </>
  );
}
