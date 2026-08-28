import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Modal } from './modal.js';

afterEach(cleanup);

describe('Modal', () => {
  it('não renderiza quando fechado', () => {
    render(
      <Modal
        open={false}
        title="Sessão expirada"
        description="Entre novamente."
        confirmLabel="Entrar"
        onConfirm={vi.fn()}
      />
    );

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('expõe nome, descrição e foco na confirmação', () => {
    render(
      <Modal
        open
        title="Sessão expirada"
        description="Entre novamente."
        confirmLabel="Entrar"
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog', { name: 'Sessão expirada' })).toBeTruthy();
    expect(screen.getByText('Entre novamente.')).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Entrar' }));
  });

  it('confirma somente pela ação explícita', () => {
    const onConfirm = vi.fn();
    render(
      <Modal
        open
        title="Sessão expirada"
        description="Entre novamente."
        confirmLabel="Entrar"
        onConfirm={onConfirm}
      />
    );

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
