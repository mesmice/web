import type { InputHTMLAttributes } from 'react';
import './checkbox.css';

export function Checkbox({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} type="checkbox" className={`checkbox ${className}`.trim()} />;
}
