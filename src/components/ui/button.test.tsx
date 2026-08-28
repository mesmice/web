import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Button, ButtonLink } from './button.js';
import { Spinner } from './spinner.js';

afterEach(cleanup);

describe('Button', () => {
  it('preserva texto simples por default', () => {
    const { container } = render(<Button>Criar conta</Button>);
    const button = screen.getByRole('button', { name: 'Criar conta' });

    expect(button.textContent).toContain('Criar conta');
    expect(button.classList.contains('btn--primary')).toBe(true);
    expect(container.querySelector('.wave-text')).toBeNull();
  });

  it('renderiza WaveText somente por opt-in', () => {
    const { container } = render(<Button wave>Criar conta</Button>);

    expect(screen.getByRole('button', { name: 'Criar conta' })).toBeTruthy();
    expect(container.querySelector('.wave-text__visual')?.getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelectorAll('.wave-text__character')).toHaveLength(11);
  });

  it('aplica a variante secondary', () => {
    render(<Button variant="secondary">Entrar</Button>);

    expect(
      screen.getByRole('button', { name: 'Entrar' }).classList.contains('btn--secondary')
    ).toBe(true);
  });

  it('mantém o estado disabled nativo', () => {
    render(<Button disabled>Entrar</Button>);

    expect(screen.getByRole('button', { name: 'Entrar' }).hasAttribute('disabled')).toBe(true);
  });

  it('mantém nome acessível único durante loading', () => {
    render(
      <Button disabled>
        <Spinner decorative /> Salvando
      </Button>
    );

    expect(screen.getByRole('button', { name: 'Salvando' })).toBeTruthy();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('aciona o callback por click', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Entrar</Button>);

    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('mantém conteúdo React composto sem convertê-lo em caracteres', () => {
    const { container } = render(
      <Button aria-label="Continuar">
        <span aria-hidden="true">→</span>
      </Button>
    );

    expect(screen.getByRole('button', { name: 'Continuar' })).toBeTruthy();
    expect(container.querySelector('.wave-text')).toBeNull();
  });
});

describe('ButtonLink', () => {
  it('usa a mesma API visual e acessível em links', () => {
    render(
      <MemoryRouter>
        <ButtonLink to="/login" variant="secondary">
          Entrar
        </ButtonLink>
      </MemoryRouter>
    );

    const link = screen.getByRole('link', { name: 'Entrar' });
    expect(link.classList.contains('btn--secondary')).toBe(true);
    expect(link.getAttribute('href')).toBe('/login');
  });
});
