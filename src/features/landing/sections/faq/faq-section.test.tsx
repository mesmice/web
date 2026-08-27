import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { FaqSection } from './faq-section.js';

const QUESTIONS = [
  'O Mesmice é gratuito?',
  'O que são Spaces?',
  'Posso usar no computador e no celular?',
  'Como funciona a privacidade?',
  'Quando o Mesmice estará disponível?',
  'Posso conversar em privado com outras pessoas?'
];

describe('FaqSection', () => {
  afterEach(cleanup);

  it('renderiza o título, subtítulo e as seis perguntas', () => {
    render(<FaqSection />);

    expect(screen.getByRole('heading', { level: 2, name: 'Perguntas frequentes' })).toBeTruthy();
    expect(screen.getByText('Algumas respostas rápidas antes de você entrar.')).toBeTruthy();
    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual(QUESTIONS);
  });

  it('abre uma pergunta e atualiza aria-expanded', () => {
    render(<FaqSection />);

    const trigger = screen.getByRole('button', { name: 'O que são Spaces?' });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(trigger);

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(
      screen.getByText(
        'Spaces são ambientes para reunir pessoas, conversas e canais em torno de comunidades, grupos ou interesses em comum.'
      )
    ).toBeTruthy();
  });

  it('mantém apenas uma pergunta aberta por vez', () => {
    render(<FaqSection />);

    const firstTrigger = screen.getByRole('button', { name: 'O Mesmice é gratuito?' });
    const secondTrigger = screen.getByRole('button', { name: 'Como funciona a privacidade?' });

    fireEvent.click(firstTrigger);
    expect(firstTrigger.getAttribute('aria-expanded')).toBe('true');

    fireEvent.click(secondTrigger);

    expect(firstTrigger.getAttribute('aria-expanded')).toBe('false');
    expect(secondTrigger.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText(/Privacidade e segurança fazem parte da arquitetura do Mesmice/)).toBeTruthy();
  });

  it('responde à navegação por teclado nativa do botão', () => {
    render(<FaqSection />);

    const trigger = screen.getByRole('button', { name: 'Quando o Mesmice estará disponível?' });
    trigger.focus();
    fireEvent.keyDown(trigger, { code: 'Space', key: ' ' });
    fireEvent.keyUp(trigger, { code: 'Space', key: ' ' });

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });
});
