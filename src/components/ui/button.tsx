import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { WaveText } from './wave-text.js';
import './button.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  wave?: boolean;
  children: ReactNode;
}

interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant;
  wave?: boolean;
  children: ReactNode;
}

const VARIANTS = ['primary', 'secondary', 'ghost'] as const;

function getButtonClassName(variant: ButtonVariant, wave: boolean, className = ''): string {
  const safeVariant = VARIANTS.includes(variant) ? variant : 'primary';
  return `btn btn--${safeVariant}${wave ? ' wave-text-trigger' : ''} ${className}`.trim();
}

function renderButtonContent(children: ReactNode, wave: boolean) {
  return wave && typeof children === 'string' ? <WaveText>{children}</WaveText> : children;
}

export function Button({
  variant = 'primary',
  wave = false,
  children,
  className = '',
  ...rest
}: ButtonProps) {
  return (
    <button className={getButtonClassName(variant, wave, className)} {...rest}>
      {renderButtonContent(children, wave)}
    </button>
  );
}

export function ButtonLink({
  variant = 'primary',
  wave = false,
  children,
  className = '',
  ...rest
}: ButtonLinkProps) {
  return (
    <Link className={getButtonClassName(variant, wave, className)} {...rest}>
      {renderButtonContent(children, wave)}
    </Link>
  );
}
