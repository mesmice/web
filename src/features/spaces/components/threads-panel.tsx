import { useEffect, useMemo, useState } from 'react';
import { Archive, LoaderCircle, MessageCircle, X } from 'lucide-react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  archiveThread,
  getMessages,
  reopenThread,
  sendMessage,
  type MessageResponse,
  type ThreadResponse
} from '../../../lib/api/endpoints.js';
import { gateway } from '../../../lib/ws/socket.js';
import { useAuthStore } from '../../../stores/auth-store.js';
import { MessageComposer } from '../../messages/components/message-composer.js';
import { MessageItem } from './message-item.js';

interface ThreadsPanelProps {
  thread: ThreadResponse;
  onClose: () => void;
}

export function ThreadsPanel({ thread, onClose }: ThreadsPanelProps) {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [replyTo, setReplyTo] = useState<MessageResponse | null>(null);
  const query = useInfiniteQuery({
    queryKey: ['thread-messages', thread.id],
    queryFn: ({ pageParam }) => getMessages(thread.id, { cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.meta.nextCursor ?? undefined
  });
  const sendMutation = useMutation({
    mutationFn: ({ content, replyToId }: { content: string; replyToId?: string }) =>
      sendMessage(thread.id, { content, replyToId, nonce: crypto.randomUUID() }),
    onSuccess: () => setReplyTo(null)
  });
  const archiveMutation = useMutation({
    mutationFn: () => (thread.archivedAt ? reopenThread(thread.id) : archiveThread(thread.id)),
    onSuccess: ({ thread: updated }) => {
      queryClient.setQueryData<ThreadResponse>(['thread', thread.id], updated);
      queryClient.invalidateQueries({ queryKey: ['threads', thread.parentContainerId] });
    }
  });
  const messages = useMemo(
    () => query.data?.pages.flatMap((page) => page.items).reverse() ?? [],
    [query.data]
  );

  useEffect(
    () =>
      gateway.onMessage((event) => {
        if (event.type !== 'message.created' || event.payload.containerId !== thread.id) return;
        const incoming: MessageResponse = {
          ...event.payload,
          containerType: 'channel',
          replyToId: null,
          reactions: [],
          pinnedAt: null,
          editedAt: null
        };
        queryClient.setQueryData<{
          pages: Array<{ items: MessageResponse[] }>;
          pageParams: unknown[];
        }>(['thread-messages', thread.id], (current) =>
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
      }),
    [queryClient, thread.id]
  );

  return (
    <aside className="fixed inset-y-0 right-0 z-20 flex w-full min-w-0 flex-col border-l border-[color:var(--color-border-default)] bg-[color:var(--color-surface-primary)] shadow-2xl md:top-[65px] md:w-[390px]">
      <header className="flex min-h-[74px] items-center gap-3 border-b border-[color:var(--color-border-default)] px-4">
        <MessageCircle
          size={19}
          className="text-[color:var(--color-brand-primary)]"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold text-[color:var(--color-text-primary)]">
            {thread.name ?? 'Tópico sem título'}
          </h2>
          <p className="text-xs text-[color:var(--color-text-muted)]">Conversa paralela</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar tópico"
          className="p-1 text-[color:var(--color-text-muted)]"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
        {query.isLoading ? (
          <div className="flex justify-center py-8 text-[color:var(--color-text-muted)]">
            <LoaderCircle className="animate-spin" />
          </div>
        ) : messages.length ? (
          <ul className="grid list-none gap-5 p-0">
            {messages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                messages={messages}
                currentUserId={currentUserId}
                onReply={setReplyTo}
                onCreateThread={() => undefined}
              />
            ))}
          </ul>
        ) : (
          <p className="py-8 text-center text-sm text-[color:var(--color-text-muted)]">
            Comece a conversa neste tópico.
          </p>
        )}
      </div>
      <div className="border-t border-[color:var(--color-border-default)]">
        {thread.archivedAt ? (
          <div className="flex items-center justify-between gap-3 p-4 text-sm text-[color:var(--color-text-muted)]">
            <span>Este tópico está arquivado.</span>
            <button
              type="button"
              onClick={() => archiveMutation.mutate()}
              className="text-[color:var(--color-brand-primary)]"
            >
              Reabrir
            </button>
          </div>
        ) : (
          <MessageComposer
            replyTo={replyTo}
            isSending={sendMutation.isPending}
            onCancelReply={() => setReplyTo(null)}
            onSend={async (content, replyToId) => {
              await sendMutation.mutateAsync({ content, replyToId });
            }}
          />
        )}
        {!thread.archivedAt ? (
          <button
            type="button"
            onClick={() => archiveMutation.mutate()}
            className="flex items-center gap-2 px-4 pb-3 text-xs text-[color:var(--color-text-muted)]"
          >
            <Archive size={13} aria-hidden="true" /> Arquivar tópico
          </button>
        ) : null}
      </div>
    </aside>
  );
}
