import { useEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, LoaderCircle, MessageCircle, X } from 'lucide-react';
import {
  getMessages,
  markChannelRead,
  sendMessage,
  type MessageResponse
} from '../../../lib/api/endpoints.js';
import { createDirectMessage, getConversations } from '../api/conversation-endpoints.js';
import type { DirectMessageChannel } from '../../../lib/types/conversations.js';
import type { FriendListItem } from '../../social/components/friend-list.js';
import { MessageComposer } from './message-composer.js';
import type { MentionableUser } from './mention-utils.js';

interface ConversationPanelProps {
  friend: FriendListItem;
  currentUserId?: string;
  onClose: () => void;
}

async function findOrCreateDirectMessage(recipientId: string): Promise<DirectMessageChannel> {
  const conversations = await getConversations();
  const existing = conversations.items.find(
    (channel) => channel.type === 'DM' && channel.participantIds.includes(recipientId)
  );
  if (existing?.type === 'DM') return existing;
  const response = await createDirectMessage(recipientId);
  return response.channel;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Não foi possível carregar a conversa.';
}

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
          className="mt-1 hidden text-xs text-[color:var(--color-text-muted)] group-hover:block hover:text-[color:var(--color-brand-primary)]"
        >
          Responder
        </button>
      </div>
    </li>
  );
}

export function ConversationPanel({ friend, currentUserId, onClose }: ConversationPanelProps) {
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [replyTo, setReplyTo] = useState<MessageResponse | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  const channelQuery = useQuery({
    queryKey: ['direct-message-channel', friend.id],
    queryFn: () => findOrCreateDirectMessage(friend.id)
  });
  const channelId = channelQuery.data?.id;
  const messagesQuery = useInfiniteQuery({
    queryKey: ['messages', channelId],
    queryFn: ({ pageParam }) => getMessages(channelId!, { cursor: pageParam }),
    enabled: Boolean(channelId),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.nextCursor ?? undefined
  });
  const sendMutation = useMutation({
    mutationFn: ({ content, replyToId }: { content: string; replyToId?: string }) =>
      sendMessage(channelId!, { content, replyToId, nonce: crypto.randomUUID() }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['messages', channelId] });
      setReplyTo(null);
    }
  });

  const messages = useMemo(
    () => messagesQuery.data?.pages.flatMap((page) => page.items).reverse() ?? [],
    [messagesQuery.data]
  );
  const mentionUsers: MentionableUser[] = [
    {
      id: friend.id,
      username: friend.username ?? friend.displayName.toLowerCase().replace(/\s+/g, '.'),
      displayName: friend.displayName,
      avatarUrl: friend.avatarUrl
    }
  ];

  useEffect(() => {
    if (!messages.length || hasScrolledToBottom) return;
    const element = scrollRef.current;
    if (!element) return;
    element.scrollTop = element.scrollHeight;
    setHasScrolledToBottom(true);
  }, [hasScrolledToBottom, messages.length]);

  useEffect(() => {
    const newestMessage = messages.at(-1);
    if (channelId && newestMessage) void markChannelRead(channelId, newestMessage.id);
  }, [channelId, messages]);

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

  function scrollToLatest() {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }

  return (
    <section className="flex h-[min(720px,calc(100vh-5rem))] w-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-primary)] shadow-lg">
      <header className="flex items-center gap-3 border-b border-[color:var(--color-border-default)] px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand-primary)]">
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold text-[color:var(--color-text-primary)]">
            {friend.displayName}
          </h2>
          <p className="truncate text-xs text-[color:var(--color-text-muted)]">
            @{friend.username ?? 'usuário'}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-secondary)] hover:text-[color:var(--color-text-primary)]"
          aria-label="Fechar conversa"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </header>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="relative min-h-0 flex-1 overflow-y-auto px-4 py-4"
      >
        {messagesQuery.isLoading || channelQuery.isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-[color:var(--color-text-muted)]">
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            Carregando conversa...
          </div>
        ) : channelQuery.isError || messagesQuery.isError ? (
          <p className="rounded-[var(--radius-md)] bg-[color:var(--color-danger-soft)] p-4 text-sm text-[color:var(--color-danger)]">
            {getErrorMessage(channelQuery.error ?? messagesQuery.error)}
          </p>
        ) : (
          <>
            {messagesQuery.isFetchingNextPage ? (
              <div className="mb-3 flex justify-center text-xs text-[color:var(--color-text-muted)]">
                <LoaderCircle className="mr-1 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                Carregando mensagens antigas...
              </div>
            ) : null}
            <ul className="space-y-3" aria-label="Mensagens da conversa">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  currentUserId={currentUserId}
                  referencedMessage={messages.find((item) => item.id === message.replyToId)}
                  onReply={setReplyTo}
                />
              ))}
            </ul>
            {messages.length === 0 ? (
              <p className="py-12 text-center text-sm text-[color:var(--color-text-muted)]">
                Comece a conversa.
              </p>
            ) : null}
          </>
        )}
        {showScrollButton ? (
          <button
            type="button"
            onClick={scrollToLatest}
            className="sticky bottom-2 left-full inline-flex h-9 w-9 translate-x-[-2.25rem] items-center justify-center rounded-full border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-primary)] text-[color:var(--color-brand-primary)] shadow-md"
            aria-label="Ir para a mensagem mais recente"
          >
            <ArrowDown className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {channelId ? (
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
      ) : null}
    </section>
  );
}
