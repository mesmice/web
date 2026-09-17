import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { MessageResponse } from '../../../lib/api/endpoints.js';
import { MessageItem } from './message-item.js';

const message: MessageResponse = {
  id: 'message-1',
  containerId: 'channel-1',
  containerType: 'channel',
  authorId: 'author-1',
  content: 'Mensagem importante',
  replyToId: null,
  mentions: [],
  mentionsEveryone: false,
  reactions: [],
  attachments: [],
  pinnedAt: null,
  editedAt: null,
  createdAt: '2026-09-17T12:00:00.000Z'
};

describe('MessageItem', () => {
  it('mantém as ações dentro do menu da mensagem', () => {
    const onReply = vi.fn();
    const onCreateThread = vi.fn();
    const onSaveMessage = vi.fn();

    render(
      <MessageItem
        message={message}
        messages={[message]}
        currentUserId="current-user"
        onReply={onReply}
        onCreateThread={onCreateThread}
        onSaveMessage={onSaveMessage}
      />
    );

    expect(screen.queryByRole('button', { name: 'Guardar mensagem' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Ações da mensagem' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar mensagem' }));

    expect(onSaveMessage).toHaveBeenCalledWith(message);
    expect(screen.queryByRole('button', { name: 'Guardar mensagem' })).toBeNull();
  });
});
