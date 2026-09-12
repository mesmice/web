import { Plus, Settings } from 'lucide-react';
import type { SpaceResponse } from '../../../lib/api/endpoints.js';

function initials(name: string) {
  return name.trim().slice(0, 2).toUpperCase() || 'S';
}

interface SpaceRailProps {
  spaces: SpaceResponse[];
  activeSpaceId?: string;
  onSelect: (space: SpaceResponse) => void;
  onCreate: () => void;
}

export function SpaceRail({ spaces, activeSpaceId, onSelect, onCreate }: SpaceRailProps) {
  return (
    <aside
      className="flex w-16 shrink-0 flex-col items-center gap-3 overflow-y-auto bg-[#21144d] px-2 py-4 text-white sm:w-[76px] sm:px-2.5"
      aria-label="Spaces"
    >
      <button
        className="grid h-11 w-11 shrink-0 cursor-not-allowed place-items-center overflow-hidden rounded-[15px] border-0 bg-white p-1.5 opacity-80 transition hover:rounded-xl hover:brightness-110"
        type="button"
        disabled
        aria-label="Mensagens diretas"
        title="Mensagens diretas em breve"
      >
        <img
          className="h-full w-full object-contain"
          src="/images/auth/logo-v2-lightmode.png"
          alt="Mesmice"
        />
      </button>
      <div className="h-px w-8 shrink-0 bg-white/20" />
      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto">
        {spaces.map((space) => (
          <button
            key={space.id}
            type="button"
            title={space.name}
            aria-label={`Abrir ${space.name}`}
            aria-pressed={space.id === activeSpaceId}
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-[15px] border-0 bg-[#46356f] font-extrabold text-white transition hover:-translate-y-0.5 hover:rounded-xl hover:bg-[#a78bfa] ${space.id === activeSpaceId ? 'rounded-xl bg-[#a78bfa]' : ''}`}
            onClick={() => onSelect(space)}
          >
            {initials(space.name)}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-[15px] border-0 bg-[#2c9466] text-white transition hover:-translate-y-0.5 hover:rounded-xl hover:brightness-110"
        onClick={onCreate}
        aria-label="Criar Space"
      >
        <Plus size={19} aria-hidden="true" />
      </button>
      <button
        type="button"
        className="grid h-11 w-11 shrink-0 cursor-not-allowed place-items-center rounded-[15px] border-0 bg-[#46356f] text-white opacity-80 transition hover:rounded-xl hover:bg-[#a78bfa]"
        disabled
        title="Configurações em breve"
        aria-label="Configurações em breve"
      >
        <Settings size={19} aria-hidden="true" />
      </button>
    </aside>
  );
}
