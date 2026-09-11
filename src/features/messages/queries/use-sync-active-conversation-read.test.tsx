import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { markChannelRead } from '../../../lib/api/endpoints.js';
import type {
  ConversationListResponse,
  ConversationSummary
} from '../../../lib/types/conversations.js';
import { conversationKeys } from '../api/conversation-query-keys.js';
import { useSyncActiveConversationRead } from './use-sync-active-conversation-read.js';

vi.mock('../../../lib/api/endpoints.js', () => ({ markChannelRead: vi.fn() }));

const mockedMarkChannelRead = vi.mocked(markChannelRead);

function createConversation(id: string, unreadCount: number): ConversationSummary {
  return {
    id,
    ownerId: 'user-1',
    type: 'DM',
    name: null,
    participantIds: ['user-1', `participant-${id}`],
    participants: [
      { id: 'user-1', username: 'ana', displayName: 'Ana', avatarUrl: null, presence: 'online' },
      {
        id: `participant-${id}`,
        username: id,
        displayName: id.toUpperCase(),
        avatarUrl: null,
        presence: 'offline'
      }
    ],
    unreadCount,
    createdAt: '2026-09-10T09:00:00.000Z',
    lastMessageAt: null,
    permissions: { default: '0', memberOverwrites: [] }
  };
}

function Harness({
  conversation,
  updatedAt
}: {
  conversation?: ConversationSummary;
  updatedAt: number;
}) {
  useSyncActiveConversationRead(conversation, updatedAt);
  return null;
}

function renderHook(queryClient: QueryClient, conversation?: ConversationSummary, updatedAt = 1) {
  return render(
    <QueryClientProvider client={queryClient}>
      <Harness conversation={conversation} updatedAt={updatedAt} />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  mockedMarkChannelRead.mockReset();
});
afterEach(cleanup);

describe('useSyncActiveConversationRead', () => {
  it('marca a conversa ativa uma vez e zera o cache sem reordenar', async () => {
    const first = createConversation('dm-1', 3);
    const second = createConversation('dm-2', 1);
    const queryClient = new QueryClient();
    queryClient.setQueryData<ConversationListResponse>(conversationKeys.list(), {
      items: [first, second]
    });
    mockedMarkChannelRead.mockResolvedValue({ lastReadMessageId: 'message-3' });

    const view = renderHook(queryClient, first);
    view.rerender(
      <QueryClientProvider client={queryClient}>
        <Harness conversation={first} updatedAt={1} />
      </QueryClientProvider>
    );

    await waitFor(() => expect(mockedMarkChannelRead).toHaveBeenCalledOnce());
    expect(mockedMarkChannelRead).toHaveBeenCalledWith('dm-1');
    await waitFor(() => {
      const items = queryClient.getQueryData<ConversationListResponse>(
        conversationKeys.list()
      )!.items;
      expect(items.map(({ id }) => id)).toEqual(['dm-1', 'dm-2']);
      expect(items.map(({ unreadCount }) => unreadCount)).toEqual([0, 1]);
    });
  });

  it('não chama o endpoint para conversa já lida ou inativa', async () => {
    const queryClient = new QueryClient();
    const view = renderHook(queryClient, undefined);
    view.rerender(
      <QueryClientProvider client={queryClient}>
        <Harness conversation={createConversation('dm-1', 0)} updatedAt={2} />
      </QueryClientProvider>
    );

    await act(async () => Promise.resolve());
    expect(mockedMarkChannelRead).not.toHaveBeenCalled();
  });

  it('preserva a contagem em falha e tenta novamente após refetch', async () => {
    const conversation = createConversation('dm-1', 2);
    const queryClient = new QueryClient();
    queryClient.setQueryData<ConversationListResponse>(conversationKeys.list(), {
      items: [conversation]
    });
    mockedMarkChannelRead.mockRejectedValueOnce(new Error('offline'));

    const view = renderHook(queryClient, conversation, 10);
    await waitFor(() => expect(mockedMarkChannelRead).toHaveBeenCalledOnce());
    expect(
      queryClient.getQueryData<ConversationListResponse>(conversationKeys.list())?.items[0]
        ?.unreadCount
    ).toBe(2);

    mockedMarkChannelRead.mockResolvedValueOnce({ lastReadMessageId: 'message-2' });
    view.rerender(
      <QueryClientProvider client={queryClient}>
        <Harness conversation={conversation} updatedAt={11} />
      </QueryClientProvider>
    );
    await waitFor(() => expect(mockedMarkChannelRead).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(
        queryClient.getQueryData<ConversationListResponse>(conversationKeys.list())?.items[0]
          ?.unreadCount
      ).toBe(0)
    );
  });

  it('não duplica chamadas em uma troca rápida entre conversas', async () => {
    const first = createConversation('dm-1', 1);
    const second = createConversation('dm-2', 1);
    const queryClient = new QueryClient();
    const resolvers = new Map<string, () => void>();
    mockedMarkChannelRead.mockImplementation(
      (id) =>
        new Promise((resolve) => {
          resolvers.set(id, () => resolve({ lastReadMessageId: `message-${id}` }));
        })
    );

    const view = renderHook(queryClient, first);
    await waitFor(() => expect(mockedMarkChannelRead).toHaveBeenCalledTimes(1));
    view.rerender(
      <QueryClientProvider client={queryClient}>
        <Harness conversation={second} updatedAt={2} />
      </QueryClientProvider>
    );
    await waitFor(() => expect(mockedMarkChannelRead).toHaveBeenCalledTimes(2));
    view.rerender(
      <QueryClientProvider client={queryClient}>
        <Harness conversation={first} updatedAt={3} />
      </QueryClientProvider>
    );

    expect(mockedMarkChannelRead).toHaveBeenCalledTimes(2);
    expect(mockedMarkChannelRead.mock.calls.map(([id]) => id)).toEqual(['dm-1', 'dm-2']);
    await act(async () => {
      resolvers.get('dm-1')?.();
      resolvers.get('dm-2')?.();
      await Promise.all(mockedMarkChannelRead.mock.results.map(({ value }) => value));
    });
  });
});
