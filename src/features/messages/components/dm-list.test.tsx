import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ConversationSummary } from '../../../lib/types/conversations.js';
import { DmList } from './dm-list.js';

const directMessage: ConversationSummary = {
  id: 'dm-1',
  ownerId: 'user-1',
  type: 'DM',
  name: null,
  participantIds: ['user-1', 'user-2'],
  participants: [
    { id: 'user-1', username: 'ana', displayName: 'Ana', avatarUrl: null, presence: 'online' },
    {
      id: 'user-2',
      username: 'bia',
      displayName: 'Bia Lima',
      avatarUrl: 'https://cdn.example.com/bia.png',
      presence: 'idle'
    }
  ],
  unreadCount: 4,
  createdAt: '2026-09-10T09:00:00.000Z',
  lastMessageAt: null,
  permissions: { default: '0', memberOverwrites: [] }
};

const groupMessage: ConversationSummary = {
  id: 'group-1',
  ownerId: 'user-1',
  type: 'GROUP_DM',
  name: null,
  participantIds: ['user-1', 'user-3', 'user-4'],
  participants: [
    { id: 'user-1', username: 'ana', displayName: 'Ana', avatarUrl: null, presence: 'online' },
    { id: 'user-3', username: 'caio', displayName: 'Caio', avatarUrl: null, presence: 'dnd' },
    { id: 'user-4', username: 'duda', displayName: 'Duda', avatarUrl: null, presence: 'offline' }
  ],
  unreadCount: 0,
  createdAt: '2026-09-10T08:00:00.000Z',
  lastMessageAt: null,
  permissions: { default: '0', memberOverwrites: [] }
};

afterEach(cleanup);

function renderList(overrides: Partial<React.ComponentProps<typeof DmList>> = {}) {
  const props: React.ComponentProps<typeof DmList> = {
    conversations: [directMessage, groupMessage],
    currentUserId: 'user-1',
    activeConversationId: undefined,
    connectionStatus: 'connected',
    loading: false,
    fetching: false,
    error: false,
    onRetry: vi.fn(),
    onSelect: vi.fn(),
    ...overrides
  };
  render(<DmList {...props} />);
  return props;
}

describe('DmList', () => {
  it('renderiza DM 1:1 com outro participante, avatar, username, presença e não lidas', () => {
    renderList();

    expect(screen.getByRole('button', { name: 'Bia Lima, 4 não lidas' })).toBeDefined();
    expect(screen.getByRole('img', { name: 'Avatar de Bia Lima' })).toBeDefined();
    expect(screen.getByText('@bia')).toBeDefined();
    expect(screen.getByLabelText('Presença: idle')).toBeDefined();
    expect(screen.getByLabelText('4 mensagens não lidas')).toBeDefined();
  });

  it('usa iniciais como fallback quando o avatar da DM não está disponível', () => {
    const withoutAvatar: ConversationSummary = {
      ...directMessage,
      participants: [
        directMessage.participants[0],
        { ...directMessage.participants[1], avatarUrl: null }
      ]
    };
    renderList({ conversations: [withoutAvatar] });

    expect(screen.getByLabelText('Avatar de Bia Lima').textContent).toBe('BL');
    expect(screen.queryByRole('img', { name: 'Avatar de Bia Lima' })).toBeNull();
  });

  it('deriva deterministicamente o nome e a composição de avatar de GROUP_DM', () => {
    renderList();

    expect(screen.getByRole('button', { name: 'Caio, Duda' })).toBeDefined();
    expect(screen.getByLabelText('Avatar de Caio, Duda')).toBeDefined();
    expect(screen.getByText('3 participantes')).toBeDefined();
  });

  it('prioriza o nome contratado do grupo e mantém fallbacks sem participantes públicos', () => {
    const namedGroup = { ...groupMessage, name: 'Equipe Produto' };
    const emptyGroup: ConversationSummary = {
      ...groupMessage,
      id: 'group-empty',
      name: null,
      participantIds: [],
      participants: []
    };
    renderList({ conversations: [namedGroup, emptyGroup] });

    expect(screen.getByRole('button', { name: 'Equipe Produto' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Conversa em grupo' })).toBeDefined();
    expect(screen.getByLabelText('Avatar de Conversa em grupo')).toBeDefined();
  });

  it('marca o item ativo e permite seleção com um botão focável', () => {
    const props = renderList({ activeConversationId: 'dm-1' });
    const button = screen.getByRole('button', { name: 'Bia Lima, 4 não lidas' });

    expect(button.getAttribute('aria-current')).toBe('page');
    button.focus();
    expect(document.activeElement).toBe(button);
    fireEvent.click(button);
    expect(props.onSelect).toHaveBeenCalledWith(directMessage);
  });

  it('renderiza skeleton apenas no carregamento inicial', () => {
    renderList({ conversations: [], loading: true, fetching: true });
    expect(screen.getByRole('status', { name: 'Carregando conversas' })).toBeDefined();
    expect(screen.queryByRole('list', { name: 'Lista de conversas diretas' })).toBeNull();
  });

  it('renderiza estado vazio', () => {
    renderList({ conversations: [] });
    expect(screen.getByText('Nenhuma conversa ainda')).toBeDefined();
  });

  it('renderiza erro inicial e executa retry', () => {
    const props = renderList({ conversations: [], error: true });
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(props.onRetry).toHaveBeenCalledOnce();
  });

  it('preserva a lista durante refetch e permite retry quando a atualização falha', () => {
    const props = renderList({ fetching: true, error: true });

    expect(screen.getByRole('button', { name: 'Bia Lima, 4 não lidas' })).toBeDefined();
    expect(screen.getByText('Atualizando')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(props.onRetry).toHaveBeenCalledOnce();
  });

  it('comunica offline e reconexão usando o status existente do gateway', () => {
    const { rerender } = render(
      <DmList
        conversations={[directMessage]}
        currentUserId="user-1"
        connectionStatus="unavailable"
        loading={false}
        fetching={false}
        error={false}
        onRetry={vi.fn()}
        onSelect={vi.fn()}
      />
    );
    expect(screen.getByText('Offline. Exibindo dados disponíveis.')).toBeDefined();

    rerender(
      <DmList
        conversations={[directMessage]}
        currentUserId="user-1"
        connectionStatus="reconnecting"
        loading={false}
        fetching={false}
        error={false}
        onRetry={vi.fn()}
        onSelect={vi.fn()}
      />
    );
    expect(screen.getByText('Reconectando em tempo real…')).toBeDefined();
  });
});
