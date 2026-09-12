import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import type { ConversationSummary } from '../../../lib/types/conversations.js';
import { server } from '../../../mocks/node.js';
import { useAuthStore } from '../../../stores/auth-store.js';
import { useUiStore } from '../../../stores/ui-store.js';
import { insertConversationCreated } from '../realtime/conversation-cache.js';
import { DmListPage } from './dm-list-page.js';

const conversation: ConversationSummary = {
  id: 'dm-1',
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

beforeEach(() => {
  useAuthStore.setState({
    status: 'authenticated',
    accessToken: 'access-token',
    user: { id: 'user-1' } as NonNullable<ReturnType<typeof useAuthStore.getState>['user']>,
    sessionEnd: null
  });
  useUiStore.setState({ gatewayStatus: 'connected', presence: {} });
});

afterEach(cleanup);

describe('DmListPage', () => {
  function LocationProbe() {
    return <output aria-label="Rota atual">{useLocation().pathname}</output>;
  }

  it('acompanha conversation.created pelo cache da query sem refazer a ordenação', async () => {
    server.use(http.get('*/api/v1/channels', () => HttpResponse.json({ items: [conversation] })));
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/app/dms']}>
          <Routes>
            <Route path="/app/dms/:conversationId?" element={<DmListPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByRole('button', { name: 'Bia' })).toBeDefined();

    const created: ConversationSummary = {
      ...conversation,
      id: 'group-new',
      type: 'GROUP_DM',
      name: 'Equipe',
      participantIds: ['user-1', 'user-3'],
      participants: [
        conversation.participants[0],
        { id: 'user-3', username: 'caio', displayName: 'Caio', avatarUrl: null, presence: 'online' }
      ]
    };
    act(() => insertConversationCreated(queryClient, created));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Equipe' })).toBeDefined());
    const items = screen.getAllByRole('listitem');
    expect(items[0].textContent).toContain('Equipe');
    expect(items[1].textContent).toContain('Bia');
  });

  it('armazena a seleção na URL e marca a conversa como ativa', async () => {
    server.use(
      http.get('*/api/v1/channels', () => HttpResponse.json({ items: [conversation] })),
      http.get('*/api/v1/channels/:channelId/messages', () =>
        HttpResponse.json({ items: [], meta: { nextCursor: null } })
      )
    );
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/app/dms']}>
          <LocationProbe />
          <Routes>
            <Route path="/app/dms/:conversationId?" element={<DmListPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    const item = await screen.findByRole('button', { name: 'Bia' });
    fireEvent.click(item);

    await waitFor(() =>
      expect(screen.getByLabelText('Rota atual').textContent).toBe('/app/dms/dm-1')
    );
    expect(item.getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('heading', { name: 'Bia' })).toBeDefined();
    expect(await screen.findByRole('heading', { name: 'Comece a conversa' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Voltar para conversas' })).toBeDefined();
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Bia' }));

    fireEvent.click(screen.getByRole('button', { name: 'Voltar para conversas' }));
    await waitFor(() => expect(screen.getByLabelText('Rota atual').textContent).toBe('/app/dms'));
    expect(document.activeElement).toBe(item);
  });

  it('mantém retorno e foco em acesso direto sem histórico anterior', async () => {
    server.use(
      http.get('*/api/v1/channels', () => HttpResponse.json({ items: [conversation] })),
      http.get('*/api/v1/channels/:channelId/messages', () =>
        HttpResponse.json({ items: [], meta: { nextCursor: null } })
      )
    );
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/app/dms/dm-1']}>
          <LocationProbe />
          <Routes>
            <Route path="/app/dms/:conversationId?" element={<DmListPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    const heading = await screen.findByRole('heading', { name: 'Bia' });
    await waitFor(() => expect(document.activeElement).toBe(heading));
    fireEvent.click(screen.getByRole('button', { name: 'Voltar para conversas' }));

    await waitFor(() => expect(screen.getByLabelText('Rota atual').textContent).toBe('/app/dms'));
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Bia' }));
  });

  it('oferece atualizar e voltar para um ID ausente sem afirmar remoção', async () => {
    let requests = 0;
    server.use(
      http.get('*/api/v1/channels', () => {
        requests += 1;
        return HttpResponse.json({ items: [] });
      })
    );
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/app/dms/fora-da-lista']}>
          <LocationProbe />
          <Routes>
            <Route path="/app/dms/:conversationId?" element={<DmListPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    const heading = await screen.findByRole('heading', { name: 'Conversa indisponível' });
    expect(document.activeElement).toBe(heading);
    expect(screen.getByText(/não está disponível na lista carregada/i)).toBeDefined();
    expect(screen.queryByText(/removid/i)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Atualizar' }));
    await waitFor(() => expect(requests).toBe(2));
    fireEvent.click(screen.getAllByRole('button', { name: 'Voltar às mensagens' }).at(-1)!);
    await waitFor(() => expect(screen.getByLabelText('Rota atual').textContent).toBe('/app/dms'));
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Mensagens' }));
  });

  it('permite voltar à lista enquanto a conversa está carregando', async () => {
    server.use(http.get('*/api/v1/channels', () => new Promise(() => undefined)));
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/app/dms/dm-1']}>
          <LocationProbe />
          <Routes>
            <Route path="/app/dms/:conversationId?" element={<DmListPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByRole('heading', { name: 'Carregando conversa' })).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Voltar às mensagens' }));
    await waitFor(() => expect(screen.getByLabelText('Rota atual').textContent).toBe('/app/dms'));
  });

  it('distingue falha de atualização e mantém atualizar e voltar disponíveis', async () => {
    server.use(
      http.get('*/api/v1/channels', () =>
        HttpResponse.json(
          { error: { code: 'INTERNAL', message: 'Falha temporária' } },
          { status: 500 }
        )
      )
    );
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/app/dms/dm-1']}>
          <Routes>
            <Route path="/app/dms/:conversationId?" element={<DmListPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(
      await screen.findByText('Não foi possível atualizar a lista para localizar esta conversa.')
    ).toBeDefined();
    expect(screen.getByRole('button', { name: 'Atualizar' })).toBeDefined();
    expect(screen.getAllByRole('button', { name: 'Voltar às mensagens' })).toHaveLength(2);
  });

  it('preserva o foco durante atualização da lista em cache', async () => {
    server.use(http.get('*/api/v1/channels', () => HttpResponse.json({ items: [conversation] })));
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/app/dms']}>
          <Routes>
            <Route path="/app/dms/:conversationId?" element={<DmListPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    const item = await screen.findByRole('button', { name: 'Bia' });
    item.focus();
    act(() => insertConversationCreated(queryClient, { ...conversation, id: 'dm-2' }));
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(2));
    expect(document.activeElement).toBe(item);
  });

  it('remove o badge somente depois de marcar a DM selecionada como lida', async () => {
    let readRequests = 0;
    let releaseRead!: () => void;
    const readPending = new Promise<void>((resolve) => {
      releaseRead = resolve;
    });
    const unreadConversation = { ...conversation, unreadCount: 4 };
    server.use(
      http.get('*/api/v1/channels', () => HttpResponse.json({ items: [unreadConversation] })),
      http.get('*/api/v1/channels/:channelId/messages', () =>
        HttpResponse.json({ items: [], meta: { nextCursor: null } })
      ),
      http.post('*/api/v1/channels/:channelId/read', async ({ request }) => {
        readRequests += 1;
        expect(await request.json()).toEqual({});
        await readPending;
        return HttpResponse.json({ lastReadMessageId: 'message-4' });
      })
    );
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/app/dms/dm-1']}>
          <Routes>
            <Route path="/app/dms/:conversationId" element={<DmListPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByRole('button', { name: 'Bia, 4 não lidas' })).toBeDefined();
    await waitFor(() => expect(readRequests).toBe(1));
    act(() => releaseRead());
    await waitFor(() => expect(screen.getByRole('button', { name: 'Bia' })).toBeDefined());
    expect(screen.queryByLabelText('4 mensagens não lidas')).toBeNull();
    expect(readRequests).toBe(1);
  });
});
