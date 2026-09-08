import { useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Hash, LoaderCircle, MessageCircle } from 'lucide-react';
import {
  getMessages,
  markChannelRead,
  sendMessage,
  type MessageResponse,
  type TextChannelResponse
} from '../../../lib/api/endpoints.js';
import { gateway } from '../../../lib/ws/socket.js';
import { useAuthStore } from '../../../stores/auth-store.js';
import { MessageComposer } from '../../messages/components/message-composer.js';
import type { MentionableUser } from '../../messages/components/mention-utils.js';
import { ErrorState } from './error-state.js';
import { MessageItem } from './message-item.js';

interface RealtimeChatProps {
  channel?: TextChannelResponse;
  onMobileMenu: () => void;
}

export function RealtimeChat({ channel, onMobileMenu }: RealtimeChatProps) {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const [replyTo, setReplyTo] = useState<MessageResponse | null>(null);
  const query = useInfiniteQuery({
    queryKey: ['messages', channel?.id],
    queryFn: ({ pageParam }) => getMessages(channel!.id, { cursor: pageParam }),
    enabled: Boolean(channel),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.meta.nextCursor ?? undefined
  });
  const sendMutation = useMutation({
    mutationFn: ({ content, replyToId }: { content: string; replyToId?: string }) =>
      sendMessage(channel!.id, { content, replyToId, nonce: crypto.randomUUID() }),
    onSuccess: () => setReplyTo(null)
  });
  const messages = useMemo(
    () => query.data?.pages.flatMap((page) => page.items).reverse() ?? [],
    [query.data]
  );

  useEffect(() => {
    if (!channel) return;
    return gateway.onMessage((event) => {
      if (
        event.type !== 'message.created' ||
        event.payload.containerType !== 'channel' ||
        event.payload.containerId !== channel.id
      )
        return;
      const incoming: MessageResponse = {
        ...event.payload,
        containerType: 'channel',
        replyToId: null,
        reactions: [],
        pinnedAt: null,
        editedAt: null
      };
      queryClient.setQueryData<{
        pages: Array<{ items: MessageResponse[]; meta: { nextCursor: string | null } }>;
        pageParams: unknown[];
      }>(['messages', channel.id], (current) =>
        current
          ? {
              ...current,
              pages: current.pages.map((page, index) =>
                index === 0 && !page.items.some((item) => item.id === incoming.id)
                  ? { ...page, items: [incoming, ...page.items] }
                  : page
              )
            }
          : current
      );
    });
  }, [channel, queryClient]);

  useEffect(() => {
    const latest = messages.at(-1);
    if (channel && latest) void markChannelRead(channel.id, latest.id);
  }, [channel, messages]);

  if (!channel)
    return (
      <main className="flex min-w-0 flex-1 flex-col items-center justify-center gap-2.5 bg-[color:var(--color-surface-primary)] p-6 text-center text-[color:var(--color-text-muted)]">
        <MessageCircle size={42} />
        <h1 className="text-base text-[color:var(--color-text-primary)]">Escolha um canal</h1>
        <p className="text-sm">Selecione um canal de texto para começar a conversar.</p>
      </main>
    );

  return (
    <main className="flex min-w-0 flex-1 flex-col bg-[color:var(--color-surface-primary)]">
      <header className="flex min-h-[74px] items-center gap-2.5 border-b border-[color:var(--color-border-default)] px-3.5 sm:px-6">
        <button
          type="button"
          className="inline-grid h-[30px] w-[30px] place-items-center rounded-md border-0 bg-transparent text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-brand-soft)] hover:text-[color:var(--color-brand-primary)] md:hidden"
          onClick={onMobileMenu}
          aria-label="Abrir canais"
        >
          <MessageCircle size={18} />
        </button>
        <Hash size={20} aria-hidden="true" />
        <div>
          <h1 className="text-base text-[color:var(--color-text-primary)]">{channel.name}</h1>
          <p className="mt-0.5 text-xs text-[color:var(--color-text-muted)]">
            {channel.description ?? 'Conversa em tempo real'}
          </p>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-[clamp(18px,4vw,54px)] py-6">
        {query.isLoading ? (
          <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-[color:var(--color-text-muted)]">
            <LoaderCircle className="animate-spin" /> Carregando mensagens
          </div>
        ) : query.isError ? (
          <ErrorState message="Não foi possível carregar as mensagens." />
        ) : messages.length ? (
          <ul className="mx-auto grid max-w-[900px] list-none gap-[22px] p-0">
            {messages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                messages={messages}
                currentUserId={currentUser?.id}
                onReply={setReplyTo}
              />
            ))}
          </ul>
        ) : (
          <div className="grid h-full place-content-center justify-items-center gap-2 text-center text-[color:var(--color-text-muted)]">
            <Hash size={30} />
            <h2 className="text-base text-[color:var(--color-text-primary)]">
              Bem-vindo ao #{channel.name}
            </h2>
            <p className="text-sm">Este é o começo desta conversa.</p>
          </div>
        )}
      </div>
      <MessageComposer
        users={[] as MentionableUser[]}
        replyTo={replyTo}
        isSending={sendMutation.isPending}
        onCancelReply={() => setReplyTo(null)}
        onSend={async (content, replyToId) => {
          await sendMutation.mutateAsync({ content, replyToId });
        }}
      />
    </main>
  );
}
