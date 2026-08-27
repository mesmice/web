import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { LandingFooter } from './landing-footer.js';

describe('LandingFooter', () => {
  afterEach(cleanup);

  it('encerra a landing com CTAs e a navegação completa', () => {
    render(
      <MemoryRouter>
        <LandingFooter />
      </MemoryRouter>
    );

    const footer = screen.getByRole('contentinfo');
    expect(
      within(footer).getByRole('heading', {
        level: 2,
        name: 'A sua próxima conversa pode começar aqui.'
      })
    ).toBeTruthy();
    expect(within(footer).getAllByRole('link', { name: 'Criar conta' })).toHaveLength(1);
    expect(within(footer).getAllByRole('link', { name: 'Entrar' })).toHaveLength(1);
    expect(within(footer).queryByText('/ até logo')).toBeNull();
    expect(within(footer).getByRole('link', { name: 'Como funciona' }).getAttribute('href')).toBe(
      '#o-que-e'
    );
    expect(within(footer).getByRole('link', { name: 'Termos' }).getAttribute('href')).toBe(
      '#footer-navigation'
    );
    expect(
      within(footer)
        .getAllByRole('link', { name: 'Criar conta' })
        .every((link) => link.getAttribute('href') === '/register')
    ).toBe(true);
    expect(within(footer).queryByRole('heading', { level: 3, name: 'Conta' })).toBeNull();
    ['Produto', 'Mesmice', 'Recursos', 'Políticas'].forEach((group) => {
      expect(within(footer).getByRole('heading', { level: 3, name: group })).toBeTruthy();
    });
  });
});
