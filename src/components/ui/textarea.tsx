import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import './input.css';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className = '', error = false, ...props },
  ref
) {
  return (
    <textarea
      {...props}
      ref={ref}
      aria-invalid={error || undefined}
      className={`textarea${error ? ' textarea--error' : ''} ${className}`.trim()}
    />
  );
});
