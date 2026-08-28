import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Spinner } from './spinner.js';

afterEach(cleanup);

describe('Spinner', () => {
  it('expõe status com nome acessível configurável', () => {
    render(<Spinner label="Entrando" />);

    expect(screen.getByRole('status', { name: 'Entrando' })).toBeTruthy();
  });

  it('pode ser decorativo em controles que já possuem nome', () => {
    const { container } = render(<Spinner decorative />);

    expect(screen.queryByRole('status')).toBeNull();
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
  });
});
