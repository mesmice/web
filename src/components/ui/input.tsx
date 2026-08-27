import type { InputHTMLAttributes } from 'react';

export const INPUT_CLASS =
  'mt-2 w-full rounded-lg border border-[#cabeff] bg-white px-3 py-3 text-sm text-[#2b1861] outline-none transition placeholder:text-[#8e7dbd] focus:border-[#693de9] focus:ring-2 focus:ring-[#cabeff]';

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${INPUT_CLASS} ${className}`} />;
}
