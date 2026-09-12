import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getMessages,
  markChannelRead,
  sendMessage,
  type MessageResponse
} from '../../../lib/api/endpoints.js';
import { DirectConversationHistory } from './direct-conversation-history.js';

vi.mock('../../../lib/api/endpoints.js', () => ({
  getMessages: vi.fn(),
  markChannelRead: vi.fn(),
  sendMessage: vi.fn()
}));

const mockedGetMessages = vi.mocked(getMessages);
const mockedMarkChannelRead = vi.mocked(markChannelRead);
const mockedSendMessage = vi.mocked(sendMessage);

const message: MessageResponse = {
  id: 'message-1',
  containerId: 'dm-1',
  containerType: 'channel',
  authorId: 'user-2',
  content: 'Olá por DM',
  replyToId: null,
  mentions: [],
  mentionsEveryone: false,
  reactions: [],
  attachments: [],
  pinnedAt: null,
  editedAt: null,
  createdAt: '2026-09-10T10:00:00.000Z'
};

beforeEach(() => {
  mockedGetMessages.mockReset();
  mockedMarkChannelRead.mockReset();
  mockedSendMessage.mockReset();
});

afterEach(cleanup);

function renderHistory(markAsRead = false) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <DirectConversationHistory channelId="dm-1" currentUserId="user-1" markAsRead={markAsRead} />
    </QueryClientProvider>
  );
}

describe('DirectConversationHistory', () => {
  it('apresenta loading enquanto busca o histórico', () => {
    mockedGetMessages.mockReturnValue(new Promise(() => undefined));
    renderHistory();
    expect(screen.getByRole('status', { name: 'Carregando mensagens' })).toBeDefined();
  });

  it('apresenta o estado vazio e mantém o composer existente', async () => {
    mockedGetMessages.mockResolvedValue({ items: [], meta: { nextCursor: null } });
    renderHistory();

    expect(await screen.findByRole('heading', { name: 'Comece a conversa' })).toBeDefined();
    expect(screen.getByRole('textbox', { name: 'Nova mensagem' })).toBeDefined();
  });

  it('apresenta mensagens sem marcar leitura na nova experiência', async () => {
    mockedGetMessages.mockResolvedValue({ items: [message], meta: { nextCursor: null } });
    renderHistory();

    expect(await screen.findByText('Olá por DM')).toBeDefined();
    expect(mockedMarkChannelRead).not.toHaveBeenCalled();
  });

  it('preserva a marcação de leitura quando reutilizado pelo painel social', async () => {
    mockedGetMessages.mockResolvedValue({ items: [message], meta: { nextCursor: null } });
    mockedMarkChannelRead.mockResolvedValue({ lastReadMessageId: message.id });
    renderHistory(true);

    await waitFor(() => expect(mockedMarkChannelRead).toHaveBeenCalledWith('dm-1', 'message-1'));
  });

  it('apresenta erro e permite tentar novamente', async () => {
    mockedGetMessages.mockRejectedValue(new Error('offline'));
    renderHistory();

    fireEvent.click(await screen.findByRole('button', { name: 'Tentar novamente' }));
    await waitFor(() => expect(mockedGetMessages).toHaveBeenCalledTimes(2));
  });
});
