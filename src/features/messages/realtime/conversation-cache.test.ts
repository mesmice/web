import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { conversationKeys } from '../api/conversation-query-keys.js';
import type {
  ConversationListResponse,
  ConversationSummary
} from '../../../lib/types/conversations.js';
import { insertConversationCreated, setConversationUnreadCount } from './conversation-cache.js';

const conversation: ConversationSummary = {
  id: 'dm-new',
  ownerId: 'user-1',
  type: 'DM',
  name: null,
  participantIds: ['user-1', 'user-2'],
  participants: [
    { id: 'user-1', username: 'ana', displayName: 'Ana', avatarUrl: null, presence: 'online' },
    { id: 'user-2', username: 'bia', displayName: 'Bia', avatarUrl: null, presence: 'offline' }
  ],
  unreadCount: 0,
  createdAt: '2026-09-10T09:00:00.000Z',
  lastMessageAt: null,
  permissions: { default: '0', memberOverwrites: [] }
};

describe('conversation.created cache update', () => {
  it('prepends the conversation to every loaded list without changing an unloaded cache', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData<ConversationListResponse>(conversationKeys.list(), { items: [] });
    queryClient.setQueryData<ConversationListResponse>(conversationKeys.list(20), { items: [] });

    insertConversationCreated(queryClient, conversation);

    expect(
      queryClient.getQueryData<ConversationListResponse>(conversationKeys.list())?.items
    ).toEqual([conversation]);
    expect(
      queryClient.getQueryData<ConversationListResponse>(conversationKeys.list(20))?.items
    ).toEqual([conversation]);
    expect(queryClient.getQueryData(conversationKeys.list(10))).toBeUndefined();
  });

  it('does not duplicate a conversation when the event is delivered again', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData<ConversationListResponse>(conversationKeys.list(), {
      items: [conversation]
    });

    insertConversationCreated(queryClient, conversation);
    insertConversationCreated(queryClient, conversation);

    expect(
      queryClient.getQueryData<ConversationListResponse>(conversationKeys.list())?.items
    ).toHaveLength(1);
  });
});

describe('conversation unread cache update', () => {
  it('updates every loaded list without changing API order or unrelated conversations', () => {
    const queryClient = new QueryClient();
    const unreadConversation = { ...conversation, unreadCount: 4 };
    const otherConversation = { ...conversation, id: 'dm-other', unreadCount: 2 };
    queryClient.setQueryData<ConversationListResponse>(conversationKeys.list(), {
      items: [unreadConversation, otherConversation]
    });
    queryClient.setQueryData<ConversationListResponse>(conversationKeys.list(20), {
      items: [otherConversation, unreadConversation]
    });

    setConversationUnreadCount(queryClient, conversation.id, 0);

    expect(
      queryClient
        .getQueryData<ConversationListResponse>(conversationKeys.list())
        ?.items.map(({ id, unreadCount }) => [id, unreadCount])
    ).toEqual([
      [conversation.id, 0],
      ['dm-other', 2]
    ]);
    expect(
      queryClient
        .getQueryData<ConversationListResponse>(conversationKeys.list(20))
        ?.items.map(({ id, unreadCount }) => [id, unreadCount])
    ).toEqual([
      ['dm-other', 2],
      [conversation.id, 0]
    ]);
  });
});
