import { Hash, X } from 'lucide-react';
import { useState } from 'react';
import { ErrorState } from './error-state.js';

interface CreateChannelDialogProps {
  open: boolean;
  spaceName: string;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onCreate: (name: string) => void;
}

export function CreateChannelDialog({
  open,
  spaceName,
  pending,
  error,
  onClose,
  onCreate
}: CreateChannelDialogProps) {
  const [name, setName] = useState('');
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-black/55 p-5" role="presentation">
      <form
        className="relative grid w-full max-w-[430px] gap-3 rounded-[14px] bg-[color:var(--color-surface-elevated)] p-[26px] shadow-2xl"
        onSubmit={(event) => {
          event.preventDefault();
          if (name.trim()) onCreate(name.trim());
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-channel-title"
      >
        <button
          type="button"
          className="absolute right-4 top-4 inline-grid h-[30px] w-[30px] place-items-center rounded-md border-0 bg-transparent text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-brand-soft)]"
          onClick={onClose}
          aria-label="Fechar"
        >
          <X size={18} />
        </button>
        <h2 id="create-channel-title" className="text-xl text-[color:var(--color-text-primary)]">
          Criar canal
        </h2>
        <p className="mb-2 text-sm text-[color:var(--color-text-secondary)]">
          Adicione um canal de texto em {spaceName}.
        </p>
        <label
          className="text-xs font-bold text-[color:var(--color-text-primary)]"
          htmlFor="channel-name"
        >
          Nome do canal
        </label>
        <div className="flex items-center gap-2 rounded-lg border border-[color:var(--color-border-default)] px-3 text-[color:var(--color-text-muted)]">
          <Hash size={17} />
          <input
            className="h-[42px] w-full border-0 bg-transparent font-inherit text-[color:var(--color-text-primary)] outline-none"
            id="channel-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="desenvolvimento"
            maxLength={100}
            autoFocus
          />
        </div>
        {error ? <ErrorState message={error} /> : null}
        <div className="mt-2 flex justify-end gap-2">
          <button
            className="min-h-[38px] rounded-md border-0 bg-[color:var(--color-surface-secondary)] px-4 text-sm font-bold text-[color:var(--color-text-secondary)]"
            type="button"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="min-h-[38px] rounded-md border-0 bg-[color:var(--color-brand-primary)] px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            type="submit"
            disabled={pending || !name.trim()}
          >
            {pending ? 'Criando...' : 'Criar canal'}
          </button>
        </div>
      </form>
    </div>
  );
}
