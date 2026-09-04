import { useState } from 'react';
import { BlockedList, type BlockedListItem } from './components/blocked-list.js';
import { mapBlockedListItemFromApi } from './components/blocked-list-mapper.js';

const demoPeople: BlockedListItem[] = [
  mapBlockedListItemFromApi({
    id: 301,
    displayName: 'Carlos Mendes',
    username: 'carlos.mendes',
    isBlocked: true
  }),
  mapBlockedListItemFromApi({
    id: 302,
    displayName: 'Beatriz Alves',
    username: 'bia.alves',
    isBlocked: true
  }),
  mapBlockedListItemFromApi({
    id: 303,
    displayName: 'Rafael Lima',
    username: 'rafa.lima',
    isBlocked: false
  })
];

function BlockConfirmation({
  person,
  isBlocking,
  onCancel,
  onConfirm
}: {
  person: BlockedListItem;
  isBlocking: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[color:var(--color-overlay)] p-4"
      role="presentation"
    >
      <div
        className="w-full max-w-[380px] rounded-[var(--radius-lg)] border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-elevated)] p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="block-confirmation-title"
      >
        <h2
          id="block-confirmation-title"
          className="text-lg font-semibold text-[color:var(--color-text-primary)]"
        >
          {isBlocking ? `Bloquear ${person.displayName}?` : `Desbloquear ${person.displayName}?`}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
          {isBlocking
            ? 'Essa pessoa não poderá ver seu perfil, enviar mensagens ou interagir com você. Você também não verá as interações dela.'
            : 'Essa pessoa poderá novamente ver seu perfil, enviar mensagens e interagir com você, conforme suas configurações de privacidade.'}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded-[var(--radius-md)] border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-secondary)] px-3 py-2 text-sm font-semibold text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-action-secondary-hover)]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="cursor-pointer rounded-[var(--radius-md)] bg-[color:var(--color-brand-primary)] px-3 py-2 text-sm font-semibold text-[color:var(--color-text-on-brand)] hover:bg-[color:var(--color-brand-primary-hover)]"
          >
            {isBlocking ? 'Bloquear pessoa' : 'Desbloquear pessoa'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function BlockedDemoPage() {
  const [people, setPeople] = useState(demoPeople);
  const [pendingPerson, setPendingPerson] = useState<BlockedListItem | null>(null);
  const isBlocking = pendingPerson?.isBlocked === false;

  function confirmToggleBlock() {
    if (!pendingPerson) return;

    setPeople((currentPeople) =>
      currentPeople.map((person) =>
        person.id === pendingPerson.id ? { ...person, isBlocked: !person.isBlocked } : person
      )
    );
    setPendingPerson(null);
  }

  return (
    <main className="min-h-screen bg-[color:var(--color-surface)] px-4 py-8 text-[color:var(--color-text-primary)] md:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[color:var(--color-border-default)]">
        <div className="border-b border-[color:var(--color-border-default)] bg-[color:var(--color-surface-primary)] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--color-text-muted)]">
            Privacidade
          </p>
        </div>
        <div className="bg-[color:var(--color-surface-primary)] p-4">
          <BlockedList items={people} onToggleBlock={setPendingPerson} />
        </div>
      </div>

      {pendingPerson ? (
        <BlockConfirmation
          person={pendingPerson}
          isBlocking={isBlocking}
          onCancel={() => setPendingPerson(null)}
          onConfirm={confirmToggleBlock}
        />
      ) : null}
    </main>
  );
}

export default BlockedDemoPage;
