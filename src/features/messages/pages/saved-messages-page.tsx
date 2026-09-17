import { useMemo } from 'react';
import { Bookmark, LoaderCircle, MessageCircle, Trash2 } from 'lucide-react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  getSavedMessages,
  getSpaceChannels,
  getSpaces,
  unsaveMessage,
  type SavedMessageResponse
} from '../../../lib/api/endpoints.js';

export function SavedMessagesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const savedQuery = useInfiniteQuery({
    queryKey: ['saved-messages'],
    queryFn: ({ pageParam }) => getSavedMessages({ cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.meta.nextCursor ?? undefined
  });
  const spacesQuery = useQuery({ queryKey: ['spaces'], queryFn: getSpaces });
  const channelsQuery = useQuery({
    queryKey: ['saved-message-context'],
    queryFn: async () => {
      const spaces = spacesQuery.data?.items ?? [];
      const entries = await Promise.all(
        spaces.map(async (space) => ({ space, channels: (await getSpaceChannels(space.id)).items }))
      );
      return entries;
    },
    enabled: Boolean(spacesQuery.data)
  });
  const unsaveMutation = useMutation({
    mutationFn: ({ channelId, messageId }: { channelId: string; messageId: string }) =>
      unsaveMessage(channelId, messageId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-messages'] })
  });
  const savedMessages = useMemo(
    () => savedQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [savedQuery.data]
  );
  const contextByChannel = useMemo(() => {
    const context = new Map<string, { spaceName: string; channelName: string }>();
    for (const entry of channelsQuery.data ?? []) {
      for (const channel of entry.channels) {
        context.set(channel.id, { spaceName: entry.space.name, channelName: channel.name });
      }
    }
    return context;
  }, [channelsQuery.data]);

  function openOriginal(item: SavedMessageResponse) {
    if (!item.message) return;
    const params = new URLSearchParams({
      channel: item.message.containerId,
      message: item.message.id
    });
    navigate(
      contextByChannel.has(item.message.containerId)
        ? `/app?${params.toString()}`
        : `/app/dms/${encodeURIComponent(item.message.containerId)}?message=${encodeURIComponent(item.message.id)}`
    );
  }

  return (
    <section className="mx-auto flex min-h-[calc(100dvh-7rem)] w-full max-w-5xl flex-col gap-5 px-4 py-6 sm:px-6">
      <header className="flex items-start gap-3 border-b border-[color:var(--color-border-default)] pb-5">
        <Bookmark className="mt-1 text-[color:var(--color-brand-primary)]" aria-hidden="true" />
        <div>
          <h1 className="text-xl font-semibold text-[color:var(--color-text-primary)]">
            Mensagens guardadas
          </h1>
          <p className="mt-1 text-sm text-[color:var(--color-text-muted)]">
            Referências pessoais para voltar ao contexto original.
          </p>
        </div>
      </header>
      {savedQuery.isLoading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-[color:var(--color-text-muted)]">
          <LoaderCircle className="mr-2 animate-spin" /> Carregando mensagens
        </div>
      ) : savedQuery.isError ? (
        <p role="alert" className="text-sm text-[color:var(--color-danger)]">
          Não foi possível carregar suas mensagens guardadas.
        </p>
      ) : savedMessages.length === 0 ? (
        <div className="grid flex-1 place-content-center justify-items-center gap-2 text-center text-[color:var(--color-text-muted)]">
          <MessageCircle size={30} aria-hidden="true" />
          <p className="text-sm">Você ainda não guardou nenhuma mensagem.</p>
          <Link to="/app" className="text-sm font-semibold text-[color:var(--color-brand-primary)]">
            Voltar aos canais
          </Link>
        </div>
      ) : (
        <ul className="grid list-none gap-3 p-0">
          {savedMessages.map((item) => {
            const message = item.message;
            const context = message ? contextByChannel.get(message.containerId) : undefined;
            return (
              <li
                key={`${item.message?.id ?? 'unavailable'}:${item.savedAt}`}
                className="border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-primary)] p-4 shadow-sm"
              >
                {message ? (
                  <button
                    type="button"
                    onClick={() => openOriginal(item)}
                    className="block w-full text-left"
                  >
                    <p className="whitespace-pre-wrap break-words text-sm text-[color:var(--color-text-primary)]">
                      {message.content || 'Esta mensagem contém apenas anexos.'}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[color:var(--color-text-muted)]">
                      <span>
                        {message.authorId === 'me'
                          ? 'Você'
                          : `Usuário ${message.authorId.slice(0, 6)}`}
                      </span>
                      <span>{context ? `#${context.channelName}` : 'Conversa'}</span>
                      {context ? <span>{context.spaceName}</span> : null}
                      <span>{new Date(message.createdAt).toLocaleString('pt-BR')}</span>
                      <span>Guardada em {new Date(item.savedAt).toLocaleString('pt-BR')}</span>
                    </div>
                  </button>
                ) : (
                  <div>
                    <p className="text-sm text-[color:var(--color-text-muted)]">
                      Esta mensagem já não está disponível.
                    </p>
                    <p className="mt-2 text-xs text-[color:var(--color-text-muted)]">
                      Guardada em {new Date(item.savedAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                )}
                <div className="mt-3 flex gap-3 text-xs">
                  {message ? (
                    <button
                      type="button"
                      onClick={() => openOriginal(item)}
                      className="font-semibold text-[color:var(--color-brand-primary)]"
                    >
                      Ver original
                    </button>
                  ) : null}
                  {message ? (
                    <button
                      type="button"
                      onClick={() =>
                        unsaveMutation.mutate({
                          channelId: message.containerId,
                          messageId: message.id
                        })
                      }
                      className="inline-flex items-center gap-1 text-[color:var(--color-text-muted)]"
                      disabled={unsaveMutation.isPending}
                    >
                      <Trash2 size={13} aria-hidden="true" /> Remover
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {savedQuery.hasNextPage ? (
        <button
          type="button"
          onClick={() => void savedQuery.fetchNextPage()}
          className="self-center text-sm font-semibold text-[color:var(--color-brand-primary)]"
        >
          Carregar mais
        </button>
      ) : null}
    </section>
  );
}
