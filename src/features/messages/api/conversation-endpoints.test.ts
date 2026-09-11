import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from '../../../lib/api/client.js';
import { createDirectMessage, getConversations } from './conversation-endpoints.js';
import type { ConversationListResponse } from '../../../lib/types/conversations.js';

vi.mock('../../../lib/api/client.js', () => ({
  apiFetch: vi.fn()
}));

const mockedApiFetch = vi.mocked(apiFetch);

const response: ConversationListResponse = {
  items: [
    {
      id: 'dm-1',
      ownerId: 'user-1',
      type: 'DM',
      name: null,
      participantIds: ['user-1', 'user-2'],
      participants: [
        { id: 'user-1', username: 'ana', displayName: 'Ana', avatarUrl: null, presence: 'online' },
        { id: 'user-2', username: 'bia', displayName: 'Bia', avatarUrl: null, presence: 'offline' }
      ],
      unreadCount: 3,
      createdAt: '2026-09-10T09:00:00.000Z',
      lastMessageAt: '2026-09-10T10:00:00.000Z',
      permissions: { default: '0', memberOverwrites: [] }
    },
    {
      id: 'group-1',
      ownerId: 'user-1',
      type: 'GROUP_DM',
      name: 'Equipe',
      participantIds: ['user-1', 'user-2'],
      participants: [
        { id: 'user-1', username: 'ana', displayName: 'Ana', avatarUrl: null, presence: 'online' },
        { id: 'user-2', username: 'bia', displayName: 'Bia', avatarUrl: null, presence: 'offline' }
      ],
      unreadCount: 0,
      createdAt: '2026-09-10T08:00:00.000Z',
      lastMessageAt: null,
      permissions: { default: '0', memberOverwrites: [] }
    }
  ]
};

describe('conversation endpoints', () => {
  beforeEach(() => mockedApiFetch.mockReset());

  it('requests GET /channels with the supported limit and preserves the official summaries', async () => {
    mockedApiFetch.mockResolvedValue(response);
    const signal = new AbortController().signal;

    await expect(getConversations(25, signal)).resolves.toEqual(response);
    expect(mockedApiFetch).toHaveBeenCalledWith('/channels?limit=25', { signal });
    expect(response.items.map((item) => item.type)).toEqual(['DM', 'GROUP_DM']);
    expect(response.items[0]?.participants.map(({ id }) => id)).toEqual(
      response.items[0]?.participantIds
    );
    expect(response.items.map((item) => item.unreadCount)).toEqual([3, 0]);
  });

  it('creates or opens a direct message with the official payload', async () => {
    mockedApiFetch.mockResolvedValue({ channel: response.items[0] });

    await createDirectMessage('user-2');

    expect(mockedApiFetch).toHaveBeenCalledWith('/channels', {
      method: 'POST',
      body: { type: 'DM', recipientId: 'user-2' }
    });
  });

  it('propagates the typed API error envelope', async () => {
    const error = Object.assign(new Error('Acesso negado.'), {
      status: 403,
      code: 'FORBIDDEN'
    });
    mockedApiFetch.mockImplementationOnce(() => {
      throw error;
    });

    expect(() => getConversations()).toThrow(error);
  });
});
