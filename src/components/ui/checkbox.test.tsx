import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Checkbox } from './checkbox.js';

afterEach(cleanup);

describe('Checkbox', () => {
  it('preserva label e alterna pelo click', () => {
    render(
      <label>
        Lembrar de mim
        <Checkbox />
      </label>
    );
    const checkbox = screen.getByRole('checkbox', { name: 'Lembrar de mim' });

    fireEvent.click(checkbox);

    expect((checkbox as HTMLInputElement).checked).toBe(true);
  });

  it('preserva o estado disabled nativo', () => {
    render(<Checkbox aria-label="Aceitar" disabled />);

    expect(screen.getByRole('checkbox', { name: 'Aceitar' }).hasAttribute('disabled')).toBe(true);
  });

  it('pode receber foco pelo teclado', () => {
    render(<Checkbox aria-label="Aceitar" />);
    const checkbox = screen.getByRole('checkbox', { name: 'Aceitar' });

    checkbox.focus();

    expect(document.activeElement).toBe(checkbox);
  });
});
