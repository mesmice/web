import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { PrivateUser } from '../../lib/types/auth.js';
import {
  PROFILE_DEMO,
  PROFILE_DEMO_FRIENDS_COUNT,
  PROFILE_DEMO_HIGHLIGHT,
  PROFILE_DEMO_TAGLINE
} from './profile-demo-data.js';
import { ProfileExperience } from './profile-page.js';

afterEach(() => cleanup());

function renderProfile(overrides: Partial<PrivateUser> = {}, friendsCount?: number | null) {
  render(
    <ProfileExperience
      profile={{ ...PROFILE_DEMO, ...overrides }}
      isOwner
      friendsCount={friendsCount === undefined ? PROFILE_DEMO_FRIENDS_COUNT : friendsCount}
      tagline={PROFILE_DEMO_TAGLINE}
      highlight={PROFILE_DEMO_HIGHLIGHT}
    />
  );
}

describe('ProfilePage', () => {
  it('renderiza o perfil de demonstração sem depender de requests', () => {
    renderProfile();

    expect(screen.getByRole('heading', { level: 1, name: 'Maria Souza' })).toBeDefined();
    expect(screen.getByText('@maria')).toBeDefined();
    expect(screen.getByRole('heading', { name: 'Sobre' })).toBeDefined();
    expect(screen.getByText(PROFILE_DEMO.bio!)).toBeDefined();
    expect(screen.getByRole('heading', { name: 'Conexões' })).toBeDefined();
    expect(screen.getByRole('link', { name: /Site pessoal/ })).toBeDefined();
    expect(screen.getByText('128 amigos')).toBeDefined();
    expect(screen.getByText('Membro desde janeiro de 2026')).toBeDefined();
    expect(screen.getByRole('heading', { name: 'Destaque' })).toBeDefined();
    expect(screen.getByText('Space Song')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Editar perfil' }).hasAttribute('disabled')).toBe(
      true
    );
    expect(screen.queryByRole('button', { name: 'Tentar novamente' })).toBeNull();
    expect(screen.queryByRole('status', { name: 'Carregando perfil' })).toBeNull();
    expect(document.querySelector('.profile-meta__count')).toBeNull();

    const memberSince = screen.getByText('Membro desde janeiro de 2026');
    const highlightTitle = screen.getByRole('heading', { name: 'Destaque' });
    const connectionsTitle = screen.getByRole('heading', { name: 'Conexões' });
    expect(
      memberSince.compareDocumentPosition(highlightTitle) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      connectionsTitle.compareDocumentPosition(highlightTitle) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('compõe mídia, links e badges fornecidos diretamente pela UI', () => {
    renderProfile({
      avatarUrl: 'https://cdn.example.com/avatar.png',
      bannerUrl: 'https://cdn.example.com/banner.png',
      externalLinks: [{ label: 'Portfólio', url: 'https://example.com' }],
      badges: [
        { code: 'founder', name: 'Fundadora', category: 'community', grantedAt: '2026-01-01T12:00:00.000Z' }
      ]
    });

    expect(screen.getByRole('img', { name: 'Avatar de Maria Souza' })).toBeDefined();
    expect(document.querySelector<HTMLImageElement>('.profile-header__banner-image')?.src).toBe(
      'https://cdn.example.com/banner.png'
    );
    expect(screen.getByRole('link', { name: /Portfólio/ })).toBeDefined();
    expect(screen.getByText('Fundadora')).toBeDefined();
  });

  it('trata campos opcionais ausentes sem quebrar a composição', () => {
    renderProfile(
      {
        bio: null,
        avatarUrl: null,
        bannerUrl: null,
        externalLinks: [],
        badges: [],
        createdAt: 'invalid'
      },
      null
    );

    expect(screen.getByLabelText('Avatar de Maria Souza').textContent).toBe('M');
    expect(screen.getByText('Nenhuma bio adicionada.')).toBeDefined();
    expect(screen.queryByRole('heading', { name: 'Conexões' })).toBeNull();
    expect(document.querySelector('.profile-header__banner-image')).toBeNull();
    expect(screen.queryByLabelText('Informações do perfil')).toBeNull();
  });

  it('não renderiza status, presence ou lista pública de amigos', () => {
    renderProfile();

    expect(screen.queryByText(/online|offline|idle|dnd|invisible/i)).toBeNull();
    expect(screen.queryByRole('list', { name: /amigos/i })).toBeNull();
  });

  it('permite alterar as duas cores, aplicar um preset e restaurar o tema', () => {
    renderProfile();
    const shell = document.querySelector<HTMLElement>('.profile-shell')!;

    fireEvent.change(screen.getByRole('textbox', { name: 'Cor principal hexadecimal' }), {
      target: { value: '#FFFFFF' }
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Cor secundária hexadecimal' }), {
      target: { value: '#EEEEEE' }
    });
    expect(shell.style.getPropertyValue('--profile-color-primary')).toBe('#FFFFFF');
    expect(shell.style.getPropertyValue('--profile-color-secondary')).toBe('#EEEEEE');
    expect(shell.style.getPropertyValue('--profile-foreground')).toBe('#201A2C');
    expect(shell.style.getPropertyValue('--profile-secondary-surface')).toContain('#EEEEEE');
    expect(shell.style.getPropertyValue('--profile-button-bg')).toContain('#EEEEEE');

    fireEvent.click(screen.getByRole('button', { name: 'Usar preset Azul' }));
    expect(shell.style.getPropertyValue('--profile-color-primary')).toBe('#1D4ED8');
    expect(shell.style.getPropertyValue('--profile-color-secondary')).toBe('#93C5FD');

    fireEvent.click(screen.getByRole('button', { name: 'Restaurar padrão' }));
    expect(shell.style.getPropertyValue('--profile-color-primary')).toBe('#8B5CF6');
    expect(shell.style.getPropertyValue('--profile-color-secondary')).toBe('#D8CCFF');
  });

  it('pré-visualiza, confirma e cancela cores do Profile e do Nick', () => {
    renderProfile();
    const shell = document.querySelector<HTMLElement>('.profile-shell')!;
    const primaryInput = screen.getByRole('textbox', { name: 'Cor principal hexadecimal' });
    const nickInput = screen.getByRole('textbox', { name: 'Cor 1 hexadecimal' });

    fireEvent.change(primaryInput, { target: { value: '#FFFFFF' } });
    expect(shell.style.getPropertyValue('--profile-color-primary')).toBe('#FFFFFF');
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar Cor principal' }));
    expect(shell.style.getPropertyValue('--profile-color-primary')).toBe('#8B5CF6');

    fireEvent.change(primaryInput, { target: { value: '#FFFFFF' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Cor principal' }));
    fireEvent.change(primaryInput, { target: { value: '#090909' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar Cor principal' }));
    expect(shell.style.getPropertyValue('--profile-color-primary')).toBe('#FFFFFF');

    fireEvent.change(nickInput, { target: { value: '#FFB6D9' } });
    expect(shell.style.getPropertyValue('--nickname-color-primary')).toBe('#FFB6D9');
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar Cor 1' }));
    expect(shell.style.getPropertyValue('--nickname-color-primary')).toBe('#FFFFFF');

    fireEvent.change(nickInput, { target: { value: '#FFB6D9' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Cor 1' }));
    fireEvent.change(nickInput, { target: { value: '#8B5CF6' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar Cor 1' }));
    expect(shell.style.getPropertyValue('--nickname-color-primary')).toBe('#FFB6D9');
  });

  it.each([
    ['light', '#FFFFFF', '#E9E9EF', '#201A2C'],
    ['dark', '#FFFFFF', '#E9E9EF', '#201A2C'],
    ['light', '#080808', '#1E1028', '#FFFFFF'],
    ['dark', '#080808', '#1E1028', '#FFFFFF']
  ])(
    'mantém App Theme %s independente do Profile %s/%s',
    (appTheme, primary, secondary, foreground) => {
      renderProfile();
      const shell = document.querySelector<HTMLElement>('.profile-shell')!;

      fireEvent.change(screen.getByRole('textbox', { name: 'Cor principal hexadecimal' }), {
        target: { value: primary }
      });
      fireEvent.change(screen.getByRole('textbox', { name: 'Cor secundária hexadecimal' }), {
        target: { value: secondary }
      });
      document.documentElement.dataset.theme = appTheme;

      expect(shell.style.getPropertyValue('--profile-color-primary')).toBe(primary);
      expect(shell.style.getPropertyValue('--profile-color-secondary')).toBe(secondary);
      expect(shell.style.getPropertyValue('--profile-foreground')).toBe(foreground);
      delete document.documentElement.dataset.theme;
    }
  );

  it('expõe wrappers locais para os cards internos do mobile sem alterar a Bio', () => {
    renderProfile();

    expect(document.querySelector('.profile-page__about.profile-mobile-card')).not.toBeNull();
    expect(document.querySelector('.profile-page__about .profile-meta')).not.toBeNull();
    expect(document.querySelector('.profile-connections')).not.toBeNull();
    expect(document.querySelector('.profile-highlight')).not.toBeNull();
    expect(document.querySelector('.profile-header')?.previousElementSibling).toBeNull();
  });

  it('aplica Nick sólido e gradiente somente ao Display Name e acompanha o preview', () => {
    renderProfile();
    const shell = document.querySelector<HTMLElement>('.profile-shell')!;
    const displayName = screen.getByRole('heading', { level: 1, name: 'Maria Souza' });
    const username = screen.getByText('@maria');

    fireEvent.change(screen.getByRole('textbox', { name: 'Cor 1 hexadecimal' }), {
      target: { value: '#FFB6D9' }
    });
    expect(shell.dataset.nicknameMode).toBe('solid');
    expect(shell.style.getPropertyValue('--nickname-color-primary')).toBe('#FFB6D9');
    expect(username.getAttribute('style')).toBeNull();

    fireEvent.click(screen.getByRole('radio', { name: 'Gradiente' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Cor 2 hexadecimal' }), {
      target: { value: '#8B5CF6' }
    });
    expect(shell.dataset.nicknameMode).toBe('gradient');
    expect(shell.style.getPropertyValue('--nickname-color-secondary')).toBe('#8B5CF6');
    expect(displayName.textContent).toBe('Maria Souza');
    expect(screen.getAllByText('Maria Souza')).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: 'Restaurar padrão' }));
    expect(shell.dataset.nicknameMode).toBe('solid');
    expect(shell.style.getPropertyValue('--nickname-color-primary')).toBe('#FFFFFF');
  });
});
