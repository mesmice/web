import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ProfileMeta } from './profile-meta.js';

afterEach(() => cleanup());

describe('ProfileMeta', () => {
  it('renderiza somente a contagem agregada de amigos quando ela existe', () => {
    render(<ProfileMeta createdAt="invalid" badges={[]} friendsCount={128} />);

    expect(screen.getByText('128 amigos')).toBeDefined();
    expect(screen.queryByRole('list', { name: /amigos/i })).toBeNull();
  });

  it('aceita zero amigos e omite uma contagem inválida', () => {
    const { rerender } = render(<ProfileMeta createdAt="invalid" badges={[]} friendsCount={0} />);

    expect(screen.getByText('0 amigos')).toBeDefined();

    rerender(<ProfileMeta createdAt="invalid" badges={[]} friendsCount={-1} />);
    expect(screen.queryByLabelText('Informações do perfil')).toBeNull();
  });

  it('combina amigos e data de entrada em metadata compacta sem ícones', () => {
    const { container } = render(
      <ProfileMeta createdAt="2026-01-01T12:00:00.000Z" badges={[]} friendsCount={128} />
    );

    expect(screen.getByText('128 amigos')).toBeDefined();
    expect(screen.getByText('Membro desde janeiro de 2026')).toBeDefined();
    expect(container.querySelector('svg')).toBeNull();
  });
});
