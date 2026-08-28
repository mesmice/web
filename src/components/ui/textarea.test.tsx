import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Textarea } from './textarea.js';

afterEach(cleanup);

describe('Textarea', () => {
  it('preserva associação com label e permite digitação', () => {
    render(
      <label>
        Sobre você
        <Textarea />
      </label>
    );
    const textarea = screen.getByRole('textbox', { name: 'Sobre você' });

    fireEvent.change(textarea, { target: { value: 'Olá!' } });

    expect((textarea as HTMLTextAreaElement).value).toBe('Olá!');
  });

  it('expõe o estado error semanticamente', () => {
    render(<Textarea aria-label="Bio" error />);

    expect(screen.getByRole('textbox', { name: 'Bio' }).getAttribute('aria-invalid')).toBe('true');
  });
});
