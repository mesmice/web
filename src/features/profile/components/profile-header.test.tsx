import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProfileHeader } from './profile-header.js';

afterEach(cleanup);

const profile = {
  avatarUrl: 'https://cdn.example/avatar.webp',
  avatarThumbUrl: 'https://cdn.example/avatar-thumb.webp',
  bannerUrl: 'https://cdn.example/banner.webp',
  displayName: 'Maria Souza'
};

describe('ProfileHeader media controls', () => {
  it('torna o banner e o avatar inteiros acionáveis e acessíveis', () => {
    const onUploadMedia = vi.fn(async () => undefined);
    render(<ProfileHeader {...profile} isOwner onUploadMedia={onUploadMedia} />);

    const banner = screen.getByRole('button', { name: 'Alterar banner' });
    const avatar = screen.getAllByRole('button', { name: 'Alterar avatar' })[0];
    expect(banner.getAttribute('tabindex')).toBe('0');
    expect(avatar.getAttribute('tabindex')).toBe('0');
    expect(screen.getByTitle('Alterar avatar').getAttribute('aria-label')).toBe('Alterar avatar');

    fireEvent.keyDown(banner, { key: 'Enter' });
    expect(screen.getByRole('dialog', { name: 'Editar banner' })).toBeDefined();
  });

  it('abre o editor pelo botão circular do avatar sem depender do contêiner', () => {
    render(<ProfileHeader {...profile} isOwner onUploadMedia={vi.fn(async () => undefined)} />);

    fireEvent.click(screen.getByTitle('Alterar avatar'));
    expect(screen.getByRole('dialog', { name: 'Editar avatar' })).toBeDefined();
  });
});
