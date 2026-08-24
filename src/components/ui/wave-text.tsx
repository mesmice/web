import type { CSSProperties } from 'react';
import './wave-text.css';

interface WaveTextProps {
  children: string;
  className?: string;
  duration?: number;
  intensity?: number;
}

type WaveCharacterStyle = CSSProperties & {
  '--character-index': number;
  '--wave-duration': `${number}ms`;
  '--wave-distance': `${number}%`;
};

export function WaveText({
  children,
  className = '',
  duration = 420,
  intensity = 105
}: WaveTextProps) {
  return (
    <span className={`wave-text ${className}`.trim()}>
      <span className="visually-hidden">{children}</span>
      <span className="wave-text__visual" aria-hidden="true">
        {Array.from(children).map((character, index) => {
          const style: WaveCharacterStyle = {
            '--character-index': index,
            '--wave-duration': `${duration}ms`,
            '--wave-distance': `${intensity}%`
          };

          return (
            <span className="wave-text__character" style={style} key={`${character}-${index}`}>
              <span className="wave-text__current">{character === ' ' ? '\u00a0' : character}</span>
              <span className="wave-text__next">{character === ' ' ? '\u00a0' : character}</span>
            </span>
          );
        })}
      </span>
    </span>
  );
}
