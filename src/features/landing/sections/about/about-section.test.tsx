import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { AboutSection } from './about-section.js';

describe('AboutSection', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('mantém o heading e todo o conteúdo editorial disponível', () => {
    render(<AboutSection />);

    expect(
      screen.getByRole('heading', {
        name: /Onde os mesmos se encontram/i
      })
    ).toBeTruthy();
    expect(screen.getByText(/O Mesmice reúne conversas, amizades e comunidades/)).toBeTruthy();
    expect(screen.getAllByRole('article')).toHaveLength(3);
    expect(screen.getByText('01 — CONVERSAS')).toBeTruthy();
    expect(screen.getByText('02 — COMUNIDADES')).toBeTruthy();
    expect(screen.getByText('03 — PRIVACIDADE')).toBeTruthy();
  });

  it('renderiza os três passos na ordem esperada e remove o card de pessoas', () => {
    render(<AboutSection />);

    expect(
      screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)
    ).toEqual([
      'Converse do seu jeito.',
      'Um canto para cada assunto.',
      'Seus dados continuam seus.'
    ]);
    expect(screen.queryByText('Feito para ficar perto.')).toBeNull();
  });

  it('usa as imagens oficiais como ilustrações decorativas', () => {
    const { container } = render(<AboutSection />);
    const images = Array.from(container.querySelectorAll<HTMLImageElement>('.about-card-visual img'));

    expect(images.map((image) => image.getAttribute('src'))).toEqual([
      '/images/landing-page/what-is/conversation-card.png',
      '/images/landing-page/what-is/community-card.png',
      '/images/landing-page/what-is/privacity-card.png'
    ]);
    expect(images.every((image) => image.getAttribute('alt') === '')).toBe(true);
    expect(images.every((image) => image.classList.contains('object-cover'))).toBe(true);
  });
});
