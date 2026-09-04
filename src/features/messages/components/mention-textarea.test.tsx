import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MentionTextarea } from './mention-textarea.js';
import { getMentionQuery, insertMention, type MentionableUser } from './mention-utils.js';

const users: MentionableUser[] = [
  { id: '1', username: 'maria.dev', displayName: 'Maria Souza' },
  { id: '2', username: 'mateus.ui', displayName: 'Mateus Lima' }
];

describe('mention utilities', () => {
  it('detecta a menção no token antes do cursor', () => {
    expect(getMentionQuery('Olá @mari', 9)).toEqual({ query: 'mari', start: 4 });
    expect(getMentionQuery('Olá @mari mundo', 15)).toBeNull();
  });

  it('insere o username e posiciona o cursor depois da menção', () => {
    expect(insertMention('Olá @mari', 9, users[0])).toEqual({
      value: 'Olá @maria.dev ',
      cursorPosition: 15
    });
  });
});

describe('MentionTextarea', () => {
  it('sugere e seleciona usuários por teclado', () => {
    const onChange = vi.fn();
    render(<MentionTextarea value="Olá @mar" users={users} onChange={onChange} />);

    expect(screen.getByRole('option', { name: /Maria Souza/ })).toBeTruthy();
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Mensagem' }), { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith('Olá @maria.dev ');
  });
});
