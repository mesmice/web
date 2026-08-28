import type { TextareaHTMLAttributes } from 'react';
import './input.css';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export function Textarea({ className = '', error = false, ...props }: TextareaProps) {
  return (
    <textarea
      {...props}
      aria-invalid={error || undefined}
      className={`textarea${error ? ' textarea--error' : ''} ${className}`.trim()}
    />
  );
}
