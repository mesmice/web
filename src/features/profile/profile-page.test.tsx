import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PrivateUser } from '../../lib/types/auth.js';
import { PROFILE_DEMO } from './profile-demo-data.js';
import { ProfileExperience } from './profile-page.js';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function renderProfile(overrides: Partial<PrivateUser> = {}) {
  render(<ProfileExperience profile={{ ...PROFILE_DEMO, ...overrides }} isOwner />);
}

function openEditor() {
  fireEvent.click(screen.getByRole('button', { name: 'Editar perfil' }));
}

describe('ProfilePage', () => {
  it('renderiza uma composição de preview sem depender de requests', () => {
    renderProfile();

    expect(screen.getByRole('heading', { level: 1, name: 'Maria Souza' })).toBeDefined();
    expect(screen.getByText('@maria')).toBeDefined();
    expect(screen.getByRole('heading', { name: 'Sobre' })).toBeDefined();
    expect(screen.getByText(PROFILE_DEMO.bio!)).toBeDefined();
    expect(screen.getByRole('heading', { name: 'Conexões' })).toBeDefined();
    expect(screen.getByRole('link', { name: /Site pessoal/ })).toBeDefined();
    expect(screen.getByRole('heading', { name: 'Membro desde' })).toBeDefined();
    expect(screen.getByText('janeiro de 2026')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Editar perfil' })).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Alterar banner' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Alterar avatar' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Tentar novamente' })).toBeNull();
    expect(screen.queryByRole('status', { name: 'Carregando perfil' })).toBeNull();
    expect(document.querySelector('.profile-meta__count')).toBeNull();

    const connectionsTitle = screen.getByRole('heading', { name: 'Conexões' });
    const memberSince = screen.getByRole('heading', { name: 'Membro desde' });
    expect(
      connectionsTitle.compareDocumentPosition(memberSince) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Enviar mensagem' }).hasAttribute('disabled')).toBe(
      true
    );
  });

  it('compõe mídia, links e badges fornecidos diretamente pela UI', () => {
    renderProfile({
      avatarUrl: 'https://cdn.example.com/avatar.png',
      bannerUrl: 'https://cdn.example.com/banner.png',
      externalLinks: [{ label: 'Portfólio', url: 'https://example.com' }],
      badges: [
        {
          code: 'founder',
          name: 'Fundadora',
          category: 'community',
          grantedAt: '2026-01-01T12:00:00.000Z'
        }
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
    renderProfile({
      bio: null,
      avatarUrl: null,
      bannerUrl: null,
      externalLinks: [],
      badges: [],
      createdAt: 'invalid'
    });

    expect(screen.getByLabelText('Avatar de Maria Souza').textContent).toBe('M');
    expect(screen.getByText('Sem bio no momento.')).toBeDefined();
    expect(screen.queryByRole('heading', { name: 'Conexões' })).toBeNull();
    expect(document.querySelector('.profile-header__banner-image')).toBeNull();
    expect(screen.queryByLabelText('Informações do perfil')).toBeNull();
  });

  it('renderiza apenas a presença suportada pelo contrato e não lista social', () => {
    renderProfile();

    expect(screen.getByLabelText('Presença: invisible')).toBeDefined();
    expect(screen.queryByRole('list', { name: /amigos/i })).toBeNull();
  });

  it('permite alterar as duas cores, aplicar um preset e restaurar o tema', () => {
    renderProfile();
    openEditor();
    const shell = document.querySelector<HTMLElement>('.profile-shell')!;

    fireEvent.change(screen.getByRole('textbox', { name: 'Cor do perfil hexadecimal' }), {
      target: { value: '#FFFFFF' }
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Cor de apoio hexadecimal' }), {
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

    fireEvent.click(screen.getByRole('button', { name: 'Restaurar' }));
    expect(shell.style.getPropertyValue('--profile-color-primary')).toBe('#8B5CF6');
    expect(shell.style.getPropertyValue('--profile-color-secondary')).toBe('#D8CCFF');
  });

  it('pré-visualiza, confirma e cancela cores do Profile e do Nick', () => {
    renderProfile();
    openEditor();
    const shell = document.querySelector<HTMLElement>('.profile-shell')!;
    const primaryInput = screen.getByRole('textbox', { name: 'Cor do perfil hexadecimal' });
    const nickInput = screen.getByRole('textbox', { name: 'Cor do nick hexadecimal' });

    fireEvent.change(primaryInput, { target: { value: '#FFFFFF' } });
    expect(shell.style.getPropertyValue('--profile-color-primary')).toBe('#FFFFFF');
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar Cor do perfil' }));
    expect(shell.style.getPropertyValue('--profile-color-primary')).toBe('#8B5CF6');

    fireEvent.change(primaryInput, { target: { value: '#FFFFFF' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Cor do perfil' }));
    fireEvent.change(primaryInput, { target: { value: '#090909' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar Cor do perfil' }));
    expect(shell.style.getPropertyValue('--profile-color-primary')).toBe('#FFFFFF');

    fireEvent.change(nickInput, { target: { value: '#FFB6D9' } });
    expect(shell.style.getPropertyValue('--nickname-color-primary')).toBe('#FFB6D9');
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar Cor do nick' }));
    expect(shell.style.getPropertyValue('--nickname-color-primary')).toBe('#FFFFFF');

    fireEvent.change(nickInput, { target: { value: '#FFB6D9' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Cor do nick' }));
    fireEvent.change(nickInput, { target: { value: '#8B5CF6' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar Cor do nick' }));
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
      openEditor();
      const shell = document.querySelector<HTMLElement>('.profile-shell')!;

      fireEvent.change(screen.getByRole('textbox', { name: 'Cor do perfil hexadecimal' }), {
        target: { value: primary }
      });
      fireEvent.change(screen.getByRole('textbox', { name: 'Cor de apoio hexadecimal' }), {
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
    expect(document.querySelector('.profile-shell__footer .profile-meta')).not.toBeNull();
    expect(document.querySelector('.profile-connections')).not.toBeNull();
    expect(document.querySelector('.profile-highlight')).toBeNull();
    expect(document.querySelector('.profile-preview__toolbar')).toBeNull();
  });

  it('aplica Nick sólido e gradiente somente ao Display Name e acompanha o preview', () => {
    renderProfile();
    openEditor();
    const shell = document.querySelector<HTMLElement>('.profile-shell')!;
    const displayName = screen.getByRole('heading', { level: 1, name: 'Maria Souza' });
    const username = screen.getByText('@maria');

    fireEvent.change(screen.getByRole('textbox', { name: 'Cor do nick hexadecimal' }), {
      target: { value: '#FFB6D9' }
    });
    expect(shell.dataset.nicknameMode).toBe('solid');
    expect(shell.style.getPropertyValue('--nickname-color-primary')).toBe('#FFB6D9');
    expect(username.getAttribute('style')).toBeNull();

    fireEvent.click(screen.getByRole('radio', { name: 'Gradiente' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Segunda cor do nick hexadecimal' }), {
      target: { value: '#8B5CF6' }
    });
    expect(shell.dataset.nicknameMode).toBe('gradient');
    expect(shell.style.getPropertyValue('--nickname-color-secondary')).toBe('#8B5CF6');
    expect(displayName.textContent).toBe('Maria Souza');
    expect(screen.getAllByText('Maria Souza')).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: 'Restaurar' }));
    expect(shell.dataset.nicknameMode).toBe('solid');
    expect(shell.style.getPropertyValue('--nickname-color-primary')).toBe('#FFFFFF');
  });

  it('mantém a personalização fora do preview e atualiza o card com o draft local', () => {
    renderProfile();
    expect(screen.queryByLabelText('Display name / nick')).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Personalizar perfil' })).toBeNull();

    openEditor();
    const displayNameInput = screen.getByLabelText('Display name / nick');
    fireEvent.change(displayNameInput, { target: { value: 'Maria em preview' } });

    expect(screen.getByRole('heading', { level: 1, name: 'Maria em preview' })).toBeDefined();
    expect(screen.getByRole('heading', { name: 'Editar perfil' })).toBeDefined();
    expect(screen.getByRole('status', { name: 'Prévia local' })).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Ver perfil' }));
    expect(screen.queryByLabelText('Display name / nick')).toBeNull();
    expect(screen.getByRole('heading', { level: 1, name: 'Maria em preview' })).toBeDefined();
  });

  it('normaliza hexadecimal sem #, rejeita valor inválido e mantém o último preview válido', () => {
    renderProfile();
    openEditor();
    const shell = document.querySelector<HTMLElement>('.profile-shell')!;
    const input = screen.getByRole('textbox', { name: 'Cor do perfil hexadecimal' });

    fireEvent.change(input, { target: { value: '3478d4' } });
    expect(shell.style.getPropertyValue('--profile-color-primary')).toBe('#3478D4');

    fireEvent.change(input, { target: { value: '#12345Z' } });
    expect(screen.getByRole('alert').textContent).toContain('hexadecimal com 6 caracteres');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(shell.style.getPropertyValue('--profile-color-primary')).toBe('#3478D4');
  });

  it('pré-visualiza a bio no card e preserva o salvamento existente', async () => {
    const onSaveBio = vi.fn().mockResolvedValue(undefined);
    render(<ProfileExperience profile={PROFILE_DEMO} isOwner onSaveBio={onSaveBio} />);
    openEditor();

    fireEvent.change(screen.getByRole('textbox', { name: 'Display name / nick' }), {
      target: { value: 'Maria Atualizada' }
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Bio' }), {
      target: { value: 'Uma bio em duas linhas\nque permanece centralizada.' }
    });

    expect(screen.getByRole('heading', { level: 1, name: 'Maria Atualizada' })).toBeDefined();
    expect(screen.getByText('Uma bio em duas linhas')).toBeDefined();
    expect(screen.getByText('que permanece centralizada.')).toBeDefined();
    expect(screen.queryByText(/Moldura do avatar/i)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Guardar alterações' }));
    await waitFor(() =>
      expect(onSaveBio).toHaveBeenCalledWith('Uma bio em duas linhas\nque permanece centralizada.')
    );
  });

  it('persiste nome, bio e cor usando apenas os campos existentes do Profile', async () => {
    const onSaveCustomization = vi.fn().mockResolvedValue(undefined);
    render(
      <ProfileExperience
        profile={PROFILE_DEMO}
        isOwner
        onSaveCustomization={onSaveCustomization}
      />
    );
    openEditor();

    fireEvent.change(screen.getByRole('textbox', { name: 'Display name / nick' }), {
      target: { value: '  Maria Atualizada  ' }
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Bio' }), {
      target: { value: 'Bio atualizada' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Usar preset Azul' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar alterações' }));

    await waitFor(() =>
      expect(onSaveCustomization).toHaveBeenCalledWith({
        displayName: 'Maria Atualizada',
        bio: 'Bio atualizada',
        profileColor: '#1D4ED8'
      })
    );
    expect(screen.queryByRole('heading', { name: 'Editar perfil' })).toBeNull();
  });

  it('desabilita todos os controles de personalização durante o salvamento', async () => {
    let resolveSave!: () => void;
    const onSaveCustomization = vi.fn(
      () => new Promise<void>((resolve) => (resolveSave = resolve))
    );
    render(
      <ProfileExperience
        profile={PROFILE_DEMO}
        isOwner
        onSaveCustomization={onSaveCustomization}
      />
    );
    openEditor();
    fireEvent.change(screen.getByRole('textbox', { name: 'Bio' }), {
      target: { value: 'Bio pendente' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar alterações' }));

    expect(screen.getByRole('button', { name: 'Guardando…' }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('textbox', { name: 'Display name / nick' }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('textbox', { name: 'Cor do perfil hexadecimal' }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByLabelText('Escolher Cor do perfil').hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('button', { name: 'Usar preset Azul' }).hasAttribute('disabled')).toBe(true);

    resolveSave();
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Guardando…' })).toBeNull());
  });

  it('mostra Bio salva por cinco segundos, reinicia o timer e limpa ao desmontar', async () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    const onSaveCustomization = vi.fn().mockResolvedValue(undefined);
    const { unmount } = render(
      <ProfileExperience
        profile={PROFILE_DEMO}
        isOwner
        onSaveCustomization={onSaveCustomization}
      />
    );

    openEditor();
    fireEvent.change(screen.getByRole('textbox', { name: 'Bio' }), {
      target: { value: 'Primeira bio salva' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar alterações' }));
    await vi.waitFor(() => expect(screen.getByRole('status').textContent).toContain('Bio salva'));

    act(() => vi.advanceTimersByTime(3000));
    openEditor();
    fireEvent.change(screen.getByRole('textbox', { name: 'Bio' }), {
      target: { value: 'Segunda bio salva' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar alterações' }));
    await vi.waitFor(() => expect(onSaveCustomization).toHaveBeenCalledTimes(2));
    await vi.waitFor(() => expect(screen.getByRole('status').textContent).toContain('Bio salva'));

    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByRole('status').textContent).toContain('Bio salva');
    unmount();
    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });
});
