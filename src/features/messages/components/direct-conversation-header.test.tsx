import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ConversationSummary } from '../../../lib/types/conversations.js';
import { DirectConversationHeader } from './direct-conversation-header.js';

const directMessage: ConversationSummary = {
  id: 'dm-1',
  ownerId: 'user-1',
  type: 'DM',
  name: null,
  participantIds: ['user-1', 'user-2'],
  participants: [
    { id: 'user-1', username: 'ana', displayName: 'Ana', avatarUrl: null, presence: 'online' },
    { id: 'user-2', username: 'bia', displayName: 'Bia Lima', avatarUrl: null, presence: 'idle' }
  ],
  unreadCount: 0,
  createdAt: '2026-09-10T09:00:00.000Z',
  lastMessageAt: null,
  permissions: { default: '0', memberOverwrites: [] }
};

afterEach(cleanup);

describe('DirectConversationHeader', () => {
  it('apresenta a identidade da DM e permite voltar à lista', () => {
    const onBack = vi.fn();
    render(
      <DirectConversationHeader
        conversation={directMessage}
        currentUserId="user-1"
        onBack={onBack}
      />
    );

    expect(screen.getByRole('heading', { name: 'Bia Lima' })).toBeDefined();
    expect(screen.getByText('@bia · idle')).toBeDefined();
    expect(screen.getByLabelText('Avatar de Bia Lima').textContent).toBe('BL');
    fireEvent.click(screen.getByRole('button', { name: 'Voltar para conversas' }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('apresenta nome e quantidade de participantes de GROUP_DM', () => {
    render(
      <DirectConversationHeader
        conversation={{
          ...directMessage,
          id: 'group-1',
          type: 'GROUP_DM',
          name: 'Equipe',
          participantIds: ['user-1', 'user-2', 'user-3'],
          participants: [
            ...directMessage.participants,
            {
              id: 'user-3',
              username: 'caio',
              displayName: 'Caio',
              avatarUrl: null,
              presence: 'online'
            }
          ]
        }}
        currentUserId="user-1"
        onBack={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: 'Equipe' })).toBeDefined();
    expect(screen.getByText('3 participantes')).toBeDefined();
  });
});
