import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getSavedMessages,
  getSpaceChannels,
  getSpaces,
  unsaveMessage
} from '../../../lib/api/endpoints.js';
import { SavedMessagesPage } from './saved-messages-page.js';

vi.mock('../../../lib/api/endpoints.js', () => ({
  getSavedMessages: vi.fn(),
  getSpaceChannels: vi.fn(),
  getSpaces: vi.fn(),
  unsaveMessage: vi.fn()
}));

const mockedGetSavedMessages = vi.mocked(getSavedMessages);
const mockedGetSpaceChannels = vi.mocked(getSpaceChannels);
const mockedGetSpaces = vi.mocked(getSpaces);
const mockedUnsaveMessage = vi.mocked(unsaveMessage);

const message = {
  id: 'message-1',
  containerId: 'channel-1',
  containerType: 'channel' as const,
  authorId: 'author-1',
  content: 'Guardar este contexto',
  replyToId: null,
  mentions: [],
  mentionsEveryone: false,
  reactions: [],
  attachments: [],
  pinnedAt: null,
  editedAt: null,
  createdAt: '2026-09-17T12:00:00.000Z'
};

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <SavedMessagesPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('SavedMessagesPage', () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetSpaces.mockResolvedValue({ items: [{ id: 'space-1', name: 'Mesmice' }] } as never);
    mockedGetSpaceChannels.mockResolvedValue({
      items: [{ id: 'channel-1', name: 'geral' }]
    } as never);
    mockedUnsaveMessage.mockResolvedValue(undefined);
  });

  it('exibe autor, canal e data da mensagem guardada', async () => {
    mockedGetSavedMessages.mockResolvedValue({
      items: [{ message, savedAt: '2026-09-17T13:00:00.000Z' }],
      meta: { nextCursor: null }
    });

    renderPage();

    expect(await screen.findByText('Usuário author')).toBeDefined();
    expect(await screen.findByText('#geral')).toBeDefined();
    expect(screen.getByText('Mesmice')).toBeDefined();
    expect(screen.getByText('Guardar este contexto')).toBeDefined();
  });

  it('mostra mensagem indisponível sem quebrar a lista', async () => {
    mockedGetSavedMessages.mockResolvedValue({
      items: [{ message: null, savedAt: '2026-09-17T13:00:00.000Z' }],
      meta: { nextCursor: null }
    });

    renderPage();

    expect(await screen.findByText('Esta mensagem já não está disponível.')).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Ver original' })).toBeNull();
    await waitFor(() => expect(mockedUnsaveMessage).not.toHaveBeenCalled());
  });

  it('mantém a ação de remoção para uma referência disponível', async () => {
    mockedGetSavedMessages.mockResolvedValue({
      items: [{ message, savedAt: '2026-09-17T13:00:00.000Z' }],
      meta: { nextCursor: null }
    });

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Remover' }));

    await waitFor(() => expect(mockedUnsaveMessage).toHaveBeenCalledWith('channel-1', 'message-1'));
  });
});
