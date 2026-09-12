import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getMessages, markChannelRead, sendMessage } from '../../../lib/api/endpoints.js';
import { createDirectMessage, getConversations } from '../api/conversation-endpoints.js';
import { ConversationPanel } from './conversation-panel.js';

vi.mock('../../../lib/api/endpoints.js', () => ({
  getMessages: vi.fn(),
  markChannelRead: vi.fn(),
  sendMessage: vi.fn()
}));
vi.mock('../api/conversation-endpoints.js', () => ({
  createDirectMessage: vi.fn(),
  getConversations: vi.fn()
}));

const mockedGetMessages = vi.mocked(getMessages);
const mockedMarkChannelRead = vi.mocked(markChannelRead);
const mockedSendMessage = vi.mocked(sendMessage);
const mockedCreateDirectMessage = vi.mocked(createDirectMessage);
const mockedGetConversations = vi.mocked(getConversations);

beforeEach(() => {
  mockedGetMessages.mockReset();
  mockedMarkChannelRead.mockReset();
  mockedSendMessage.mockReset();
  mockedCreateDirectMessage.mockReset();
  mockedGetConversations.mockReset();
});

afterEach(cleanup);

describe('ConversationPanel', () => {
  it('preserva a marcação de leitura do painel social existente', async () => {
    mockedGetConversations.mockResolvedValue({
      items: [
        {
          id: 'dm-1',
          ownerId: 'user-1',
          type: 'DM',
          name: null,
          participantIds: ['user-1', 'user-2'],
          participants: [
            {
              id: 'user-1',
              username: 'ana',
              displayName: 'Ana',
              avatarUrl: null,
              presence: 'online'
            },
            {
              id: 'user-2',
              username: 'bia',
              displayName: 'Bia',
              avatarUrl: null,
              presence: 'offline'
            }
          ],
          unreadCount: 1,
          createdAt: '2026-09-10T09:00:00.000Z',
          lastMessageAt: null,
          permissions: { default: '0', memberOverwrites: [] }
        }
      ]
    });
    mockedGetMessages.mockResolvedValue({
      items: [
        {
          id: 'message-1',
          containerId: 'dm-1',
          containerType: 'channel',
          authorId: 'user-2',
          content: 'Olá',
          replyToId: null,
          mentions: [],
          mentionsEveryone: false,
          reactions: [],
          attachments: [],
          pinnedAt: null,
          editedAt: null,
          createdAt: '2026-09-10T10:00:00.000Z'
        }
      ],
      meta: { nextCursor: null }
    });
    mockedMarkChannelRead.mockResolvedValue({ lastReadMessageId: 'message-1' });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <ConversationPanel
          friend={{
            id: 'user-2',
            displayName: 'Bia',
            username: 'bia',
            avatarUrl: null,
            status: 'offline'
          }}
          currentUserId="user-1"
          onClose={vi.fn()}
        />
      </QueryClientProvider>
    );

    expect(await screen.findByText('Olá')).toBeDefined();
    await waitFor(() => expect(mockedMarkChannelRead).toHaveBeenCalledWith('dm-1', 'message-1'));
  });
});
