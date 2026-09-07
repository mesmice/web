import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProfileLinks } from './profile-links.js';

afterEach(cleanup);
const links = [{ label: 'GitHub', url: 'https://github.com/mesmice' }, { label: 'Meu site', url: 'https://example.com' }];

describe('ProfileLinks', () => {
  it('renderiza links seguros, fallback genérico e oculta vazio do visitante', () => {
    const { rerender, container } = render(<ProfileLinks links={[links[1]]} />);
    expect(screen.getByRole('link', { name: /Meu site/ }).getAttribute('href')).toBe('https://example.com');
    expect(container.querySelector('.lucide-globe')).not.toBeNull();
    rerender(<ProfileLinks links={[]} />);
    expect(screen.queryByRole('heading', { name: 'Conexões' })).toBeNull();
  });

  it('mantém URL insegura visível sem torná-la navegável', () => {
    render(<ProfileLinks links={[{ label: 'Legado', url: 'javascript:alert(1)' }]} />);
    expect(screen.getByText('Legado')).toBeDefined();
    expect(screen.queryByRole('link', { name: /Legado/ })).toBeNull();
  });

  it('mostra CTA vazio ao owner e permite adicionar, editar, remover e cancelar', () => {
    const { rerender } = render(<ProfileLinks links={[]} isOwner onSave={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar link' }));
    expect(screen.getByRole('list', { name: 'Links em edição' })).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar outro link' }));
    fireEvent.change(screen.getAllByLabelText('Nome')[0], { target: { value: 'Novo' } });
    fireEvent.change(screen.getAllByLabelText('URL')[0], { target: { value: 'https://novo.test' } });
    fireEvent.click(screen.getByRole('button', { name: 'Remover link 2' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByRole('button', { name: 'Adicionar link' })).toBeDefined();
    rerender(<ProfileLinks links={links} isOwner onSave={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Editar links' }));
    expect(screen.getAllByLabelText('Nome').map((input) => (input as HTMLInputElement).value)).toEqual(['GitHub', 'Meu site']);
  });

  it('impede sexto item e valida todos os campos e limites', async () => {
    render(<ProfileLinks links={[]} isOwner onSave={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar link' }));
    for (let i = 0; i < 4; i += 1) fireEvent.click(screen.getByRole('button', { name: 'Adicionar outro link' }));
    expect(screen.getAllByText(/^Link \d$/)).toHaveLength(5);
    expect(screen.queryByRole('button', { name: 'Adicionar outro link' })).toBeNull();
    expect(screen.getByText('Limite de 5 links atingido.')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Salvar links' }));
    expect(screen.getAllByText('Informe um nome para o link.')).toHaveLength(5);
    expect(screen.getAllByText('Informe a URL.')).toHaveLength(5);
    fireEvent.change(screen.getAllByLabelText('Nome')[0], { target: { value: ' '.repeat(2) } });
    fireEvent.change(screen.getAllByLabelText('URL')[0], { target: { value: 'invalid' } });
    fireEvent.change(screen.getAllByLabelText('Nome')[1], { target: { value: 'a'.repeat(33) } });
    fireEvent.change(screen.getAllByLabelText('URL')[1], { target: { value: `https://e.test/${'a'.repeat(500)}` } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar links' }));
    expect(screen.getByText('Informe uma URL válida.')).toBeDefined();
    expect(screen.getByText('Use no máximo 32 caracteres.')).toBeDefined();
    expect(screen.getByText('Use no máximo 512 caracteres.')).toBeDefined();
  });

  it('reordena duplicatas e salva exatamente label/url na nova ordem', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const duplicate = { label: 'Igual', url: 'https://example.com' };
    render(<ProfileLinks links={[duplicate, duplicate]} isOwner onSave={onSave} />);
    fireEvent.click(screen.getByRole('button', { name: 'Editar links' }));
    fireEvent.change(screen.getAllByLabelText('Nome')[0], { target: { value: ' Primeiro ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Mover link 1 para baixo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar links' }));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith([{ label: 'Igual', url: 'https://example.com' }, { label: 'Primeiro', url: 'https://example.com' }]));
    expect(Object.keys(onSave.mock.calls[0][0][0])).toEqual(['label', 'url']);
  });

  it('bloqueia ações durante pending, preserva edição no erro e permite retry', async () => {
    let reject!: (reason: Error) => void;
    const first = new Promise<void>((_, rejectPromise) => { reject = rejectPromise; });
    const onSave = vi.fn().mockReturnValueOnce(first).mockResolvedValueOnce(undefined);
    render(<ProfileLinks links={[links[0]]} isOwner onSave={onSave} />);
    fireEvent.click(screen.getByRole('button', { name: 'Editar links' }));
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'GitHub editado' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar links' }));
    expect(screen.getByRole('button', { name: 'Salvando…' }).hasAttribute('disabled')).toBe(true);
    reject(new Error('falha'));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Não foi possível'));
    expect((screen.getByLabelText('Nome') as HTMLInputElement).value).toBe('GitHub editado');
    fireEvent.click(screen.getByRole('button', { name: 'Salvar links' }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2));
  });
});
