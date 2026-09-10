import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProfileIdentity } from './profile-identity.js';

afterEach(() => cleanup());

describe('ProfileIdentity', () => {
  it('mostra nome, username e presença sem botão de edição para visitante', () => {
    render(<ProfileIdentity displayName="Maria Souza" username="maria" presence="online" />);

    expect(screen.getByRole('heading', { level: 1, name: 'Maria Souza' })).toBeDefined();
    expect(screen.getByText('@maria')).toBeDefined();
    expect(screen.getByLabelText('Presença: online')).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Editar perfil' })).toBeNull();
  });

  it('permite abrir e fechar o editor mesmo sem onSave (modo preview)', () => {
    render(<ProfileIdentity displayName="Maria Souza" username="maria" presence="online" isOwner />);

    fireEvent.click(screen.getByRole('button', { name: 'Editar perfil' }));
    fireEvent.change(screen.getByLabelText('Nome de exibição'), { target: { value: 'Nova' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(screen.queryByLabelText('Nome de exibição')).toBeNull();
  });

  it('edita apenas o nome de exibição quando o username não muda', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <ProfileIdentity
        displayName="Maria Souza"
        username="maria"
        presence="online"
        isOwner
        onSave={onSave}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Editar perfil' }));
    fireEvent.change(screen.getByLabelText('Nome de exibição'), {
      target: { value: 'Maria Atualizada' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ displayName: 'Maria Atualizada' }));
    expect(screen.queryByRole('button', { name: 'Cancelar' })).toBeNull();
  });

  it('checa disponibilidade do username e bloqueia envio quando ocupado', async () => {
    const onCheckUsername = vi.fn().mockResolvedValue(false);
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <ProfileIdentity
        displayName="Maria Souza"
        username="maria"
        presence="online"
        isOwner
        onSave={onSave}
        onCheckUsername={onCheckUsername}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Editar perfil' }));
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'ocupado' } });

    await screen.findByText('Este username já está em uso.');
    expect(onCheckUsername).toHaveBeenCalledWith('ocupado');
    expect(screen.getByRole('button', { name: 'Salvar' }).hasAttribute('disabled')).toBe(true);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('salva novo username quando disponível', async () => {
    const onCheckUsername = vi.fn().mockResolvedValue(true);
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <ProfileIdentity
        displayName="Maria Souza"
        username="maria"
        presence="online"
        isOwner
        onSave={onSave}
        onCheckUsername={onCheckUsername}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Editar perfil' }));
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'maria_nova' } });

    await screen.findByText('Username disponível!');
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ username: 'maria_nova' }));
  });

  it('rejeita formato inválido sem chamar a checagem de disponibilidade', async () => {
    const onCheckUsername = vi.fn().mockResolvedValue(true);
    render(
      <ProfileIdentity
        displayName="Maria Souza"
        username="maria"
        presence="online"
        isOwner
        onSave={vi.fn()}
        onCheckUsername={onCheckUsername}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Editar perfil' }));
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'ab-cd' } });

    expect(await screen.findByText(/Use 3 a 20 caracteres/)).toBeDefined();
    expect(onCheckUsername).not.toHaveBeenCalled();
  });

  it('cancelar descarta as alterações e fecha o editor', () => {
    render(
      <ProfileIdentity
        displayName="Maria Souza"
        username="maria"
        presence="online"
        isOwner
        onSave={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Editar perfil' }));
    fireEvent.change(screen.getByLabelText('Nome de exibição'), { target: { value: 'Rascunho' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Maria Souza' })).toBeDefined();
    expect(screen.queryByLabelText('Nome de exibição')).toBeNull();
  });

  it('mostra erro genérico e mantém o editor aberto quando o save falha', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('falha'));
    render(
      <ProfileIdentity
        displayName="Maria Souza"
        username="maria"
        presence="online"
        isOwner
        onSave={onSave}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Editar perfil' }));
    fireEvent.change(screen.getByLabelText('Nome de exibição'), { target: { value: 'Nova' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toContain('Não foi possível salvar')
    );
    expect(screen.getByLabelText('Nome de exibição')).toBeDefined();
  });
});
