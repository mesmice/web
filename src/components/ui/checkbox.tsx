import type { InputHTMLAttributes } from 'react';

export function Checkbox({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} type="checkbox" className={`h-4 w-4 accent-[#693de9] ${className}`} />;
}
