import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Input } from './input.js';

afterEach(cleanup);

describe('Input', () => {
  it('preserva associação com label e permite digitação', () => {
    render(
      <label>
        Nome
        <Input />
      </label>
    );
    const input = screen.getByRole('textbox', { name: 'Nome' });

    fireEvent.change(input, { target: { value: 'Mesmice' } });

    expect((input as HTMLInputElement).value).toBe('Mesmice');
  });

  it('expõe estados disabled e error semanticamente', () => {
    render(<Input aria-label="Nome" disabled error />);
    const input = screen.getByRole('textbox', { name: 'Nome' });

    expect(input.hasAttribute('disabled')).toBe(true);
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('preserva classes de composição de spacing', () => {
    render(<Input aria-label="Busca" className="pl-10 pr-11" />);

    expect(screen.getByRole('textbox', { name: 'Busca' }).className).toContain('pl-10 pr-11');
  });
});
