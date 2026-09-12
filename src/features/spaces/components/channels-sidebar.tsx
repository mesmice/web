import { Hash, LoaderCircle, Plus, Settings, X } from 'lucide-react';
import type { SpaceResponse, TextChannelResponse } from '../../../lib/api/endpoints.js';

function initials(name: string) {
  return name.trim().slice(0, 2).toUpperCase() || 'S';
}

interface ChannelsSidebarProps {
  space?: SpaceResponse;
  channels: TextChannelResponse[];
  activeChannelId?: string;
  loading: boolean;
  onSelect: (channel: TextChannelResponse) => void;
  onCreate: () => void;
  onSettings?: () => void;
  onClose?: () => void;
}

export function ChannelsSidebar({
  space,
  channels,
  activeChannelId,
  loading,
  onSelect,
  onCreate,
  onSettings,
  onClose
}: ChannelsSidebarProps) {
  return (
    <aside className="flex min-w-0 flex-1 flex-col border-r border-[color:var(--color-border-default)] bg-[#f5f3fb]">
      <header className="flex min-h-[74px] items-center justify-between border-b border-[color:var(--color-border-default)] px-3.5 py-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-xl bg-[color:var(--color-brand-primary)] font-extrabold text-white">
            {space ? initials(space.name) : 'S'}
          </span>
          <div className="min-w-0">
            <strong className="block truncate text-sm text-[color:var(--color-brand-deep-purple)]">
              {space?.name ?? 'Nenhum Space selecionado'}
            </strong>
            <span className="mt-0.5 block truncate text-xs text-[color:var(--color-text-muted)]">
              {space ? `${space.memberCount} membros` : 'Aguardando dados do Space'}
            </span>
          </div>
        </div>
        {onClose ? (
          <button
            type="button"
            className="inline-grid h-[30px] w-[30px] place-items-center rounded-md border-0 bg-transparent text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-brand-soft)] hover:text-[color:var(--color-brand-primary)]"
            onClick={onClose}
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        ) : null}
        {onSettings ? (
          <button
            type="button"
            className="inline-grid h-[30px] w-[30px] place-items-center rounded-md border-0 bg-transparent text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-brand-soft)] hover:text-[color:var(--color-brand-primary)]"
            onClick={onSettings}
            aria-label="Configurar Space"
            title="Configurar Space"
          >
            <Settings size={17} />
          </button>
        ) : null}
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-2.5 pt-[18px]">
        <div className="flex items-center justify-between px-2 pb-2 text-[.7rem] font-extrabold uppercase tracking-[.08em] text-[color:var(--color-text-muted)]">
          <span>Canais de texto</span>
          <button
            type="button"
            className="inline-grid h-[30px] w-[30px] place-items-center rounded-md border-0 bg-transparent text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-brand-soft)] hover:text-[color:var(--color-brand-primary)]"
            onClick={onCreate}
            aria-label="Criar canal"
          >
            <Plus size={16} />
          </button>
        </div>
        {loading ? (
          <div className="flex min-h-20 items-center gap-2 px-2 text-xs text-[color:var(--color-text-muted)]">
            <LoaderCircle size={16} className="animate-spin" /> Carregando canais
          </div>
        ) : channels.length ? (
          <nav aria-label={`Canais de ${space?.name ?? 'Space'}`}>
            {channels.map((channel) => (
              <button
                key={channel.id}
                type="button"
                className={`flex w-full items-center gap-2 rounded-md border-0 px-2.5 py-2 text-left text-[color:var(--color-text-secondary)] transition hover:bg-[color:var(--color-brand-soft)] hover:text-[color:var(--color-brand-deep-purple)] ${channel.id === activeChannelId ? 'bg-[color:var(--color-brand-soft)] font-bold text-[color:var(--color-brand-deep-purple)]' : ''}`}
                onClick={() => onSelect(channel)}
              >
                <Hash size={17} aria-hidden="true" />
                <span>{channel.name}</span>
              </button>
            ))}
          </nav>
        ) : (
          <div className="px-2 py-4 text-[.82rem] leading-normal text-[color:var(--color-text-muted)]">
            <p>Nenhum canal ainda.</p>
            <button
              className="border-0 bg-transparent p-0 font-bold text-[color:var(--color-brand-primary)]"
              type="button"
              onClick={onCreate}
            >
              Criar primeiro canal
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
