import type { InputHTMLAttributes } from 'react';
import './input.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function Input({ className = '', error = false, ...props }: InputProps) {
  return (
    <input
      {...props}
      aria-invalid={error || undefined}
      className={`input${error ? ' input--error' : ''} ${className}`.trim()}
    />
  );
}
