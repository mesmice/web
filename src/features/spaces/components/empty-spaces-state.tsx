import { Compass, Plus } from 'lucide-react';

export function EmptySpacesState() {
  return (
    <main className="flex min-w-0 flex-1 items-center justify-center bg-[color:var(--color-surface-primary)] p-6">
      <section className="flex w-full max-w-lg flex-col items-center gap-5 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand-primary)]">
          <img
            className="h-10 w-10 object-contain"
            src="/images/auth/logo-v2-lightmode.png"
            alt=""
          />
        </div>
        <div className="grid gap-2">
          <h1 className="text-xl font-semibold text-[color:var(--color-text-primary)]">
            Comece pelos seus Spaces
          </h1>
          <p className="text-sm leading-6 text-[color:var(--color-text-muted)]">
            Crie um Space para reunir sua comunidade ou entre em um Space existente para começar a
            conversar.
          </p>
        </div>
        <div className="grid w-full gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled
            title="Criação de Spaces em breve"
            className="flex min-h-24 cursor-not-allowed flex-col items-center justify-center gap-2 rounded-xl border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-elevated)] px-4 text-sm font-semibold text-[color:var(--color-text-disabled)] opacity-80"
          >
            <Plus size={20} aria-hidden="true" />
            Criar um Space
            <span className="text-xs font-normal">Em breve</span>
          </button>
          <button
            type="button"
            disabled
            title="Entrada em Spaces em breve"
            className="flex min-h-24 cursor-not-allowed flex-col items-center justify-center gap-2 rounded-xl border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-elevated)] px-4 text-sm font-semibold text-[color:var(--color-text-disabled)] opacity-80"
          >
            <Compass size={20} aria-hidden="true" />
            Entrar em um Space
            <span className="text-xs font-normal">Em breve</span>
          </button>
        </div>
      </section>
    </main>
  );
}
