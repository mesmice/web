import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { WhyMesmiceSection } from './why-mesmice-section.js';

describe('WhyMesmiceSection', () => {
  afterEach(cleanup);

  it('apresenta a pergunta e os quatro momentos narrativos na ordem correta', () => {
    render(<WhyMesmiceSection />);
    expect(
      screen.getByRole('heading', { level: 2, name: /Por que escolher o Mesmice/i })
    ).toBeTruthy();
    expect(
      screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)
    ).toEqual([
      'Nem toda conversa precisa virar conteúdo.',
      'Pessoas antes dos números.',
      'Um canto que parece seu.',
      'Seus dados continuam seus.'
    ]);
    expect(screen.getAllByRole('article')).toHaveLength(4);
  });
});
