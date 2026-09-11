import { MessagesSquare } from 'lucide-react';

export function DmListEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-5 py-10 text-center">
      <span className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand-primary)]">
        <MessagesSquare aria-hidden="true" />
      </span>
      <p className="font-semibold text-[color:var(--color-text-primary)]">Nenhuma conversa ainda</p>
      <p className="mt-1 text-sm leading-relaxed text-[color:var(--color-text-muted)]">
        Suas conversas diretas aparecerão aqui.
      </p>
    </div>
  );
}
