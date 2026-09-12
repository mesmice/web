import { useEffect, useState } from 'react';
import { Smile, X } from 'lucide-react';
import { Button } from '../../../components/ui/button.js';
import { Input } from '../../../components/ui/input.js';

interface ProfileStatusProps {
  status: string | null | undefined;
  isOwner: boolean;
  onSave?: (status: string) => Promise<void> | void;
  className?: string;
}

const STATUS_LIMIT = 80;
const PLACEHOLDER_TEXT = 'Que item de jogo você seria?';

/**
 * Status em formato de balão de pensamento, sem anexos extra ao avatar.
 * A ideia é manter a visualização limpa e reconhecível como um comentário/estado.
 */

/**
 * Status de perfil no estilo Discord:
 *
 * 1. Preview — balão simples, como uma mensagem curta de pensamento.
 *    Clicar nele apenas ABRE o popup de edição.
 * 2. Popup — modal centralizado com overlay ("Definir seu status"): título,
 *    botão de fechar, campo com ícone de emoji, contador e ações.
 *    Fecha ao clicar no overlay, apertar Esc, ou clicar no X.
 *
 * Persistência via onSave; sem esse callback, apenas fecha a edição localmente.
 */
export function ProfileStatus({ status, isOwner, onSave, className }: ProfileStatusProps) {
  const initialStatus = status?.trim() ?? '';

  const [draft, setDraft] = useState(initialStatus);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const remaining = STATUS_LIMIT - draft.length;
  const isOverLimit = remaining < 0;
  const hasStatus = initialStatus.length > 0;

  const startEditing = () => {
    if (!isOwner) return;
    setDraft(initialStatus);
    setFeedback(null);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setDraft(initialStatus);
    setIsEditing(false);
    setFeedback(null);
  };

  const handleSave = async () => {
    const nextStatus = draft.trim();

    if (!onSave) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      await onSave(nextStatus);
      setIsEditing(false);
      setFeedback('Status salvo com sucesso.');
    } catch {
      setFeedback('Não foi possível salvar o status.');
    } finally {
      setIsSaving(false);
    }
  };

  // Fecha com Esc e foca o campo assim que o popup abre.
  useEffect(() => {
    if (!isEditing) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSaving) cancelEditing();
    };

    document.addEventListener('keydown', handleKeyDown);
    const inputElement = document.getElementById('profile-status-edit');
    if (inputElement instanceof HTMLInputElement) {
      inputElement.focus();
    }

    return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  const previewText = isEditing
    ? draft.trim() || PLACEHOLDER_TEXT
    : hasStatus
      ? initialStatus
      : isOwner
        ? PLACEHOLDER_TEXT
        : 'Status não informado.';

  return (
    <div className={className}>
      {/* Balão de pensamento simples e limpo. */}
      <div className="inline-flex items-end">
        {isOwner ? (
          <button
            type="button"
            onClick={startEditing}
            aria-haspopup="dialog"
            aria-expanded={isEditing}
            aria-label="Editar status"
            className={[
              'max-w-[16rem] rounded-[18px] border border-[var(--color-border-default)] bg-[var(--color-surface-elevated)] px-3.5 py-2 text-left text-[11px] leading-4 shadow-[0_10px_20px_rgba(15,23,42,0.12)] transition-colors duration-200 hover:bg-[var(--color-surface-secondary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-lilac)]',
              hasStatus
                ? 'not-italic text-[var(--color-text-primary)]'
                : 'italic text-[var(--color-text-muted)]/80'
            ].join(' ')}
          >
            {previewText}
          </button>
        ) : (
          hasStatus && (
            <div className="max-w-[16rem] rounded-[18px] border border-[var(--color-border-default)] bg-[var(--color-surface-elevated)] px-3.5 py-2 text-[11px] leading-4 text-[var(--color-text-primary)] shadow-[0_10px_20px_rgba(15,23,42,0.12)]">
              {previewText}
            </div>
          )
        )}
      </div>

      {feedback && (
        <span role="status" className="mt-2 block text-[11px] text-[var(--color-success)]">
          {feedback}
        </span>
      )}

      {/* Popup mais enxuto, alinhado à referência: sem cancelar, só fechar e salvar. */}
      {isEditing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#090b11]/70 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isSaving) cancelEditing();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-status-title"
            className="w-full max-w-[26rem] rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-secondary)] p-4 shadow-[0_24px_60px_rgba(15,23,42,0.42)]"
          >
            <div className="flex items-center justify-between">
              <h2
                id="profile-status-title"
                className="text-[18px] font-semibold text-[var(--color-text-primary)]"
              >
                Definir seu status
              </h2>
              <button
                type="button"
                onClick={cancelEditing}
                disabled={isSaving}
                aria-label="Fechar"
                className="rounded-full p-1 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)] disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5">
              <label
                htmlFor="profile-status-edit"
                className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]"
              >
                Status
              </label>

              <div className="relative">
                <Smile
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]"
                />
                <Input
                  id="profile-status-edit"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value.slice(0, STATUS_LIMIT))}
                  maxLength={STATUS_LIMIT}
                  placeholder={PLACEHOLDER_TEXT}
                  className="w-full rounded-[14px] border border-[var(--color-border-default)] bg-[var(--color-surface-elevated)] py-2.5 pl-9 pr-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus-visible:border-[var(--color-brand-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]/40"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <span
                className={[
                  'text-[11px] text-[var(--color-text-muted)]',
                  isOverLimit && 'text-[var(--color-danger)]'
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {Math.max(0, draft.length)}/{STATUS_LIMIT}
              </span>

              <Button
                type="button"
                onClick={() => void handleSave()}
                className="h-9 px-5 text-[12px] bg-[var(--color-brand-primary)] text-[var(--color-brand-white)] hover:bg-[var(--color-brand-primary-hover)]"
                disabled={isSaving || isOverLimit}
                aria-label="Salvar status"
              >
                {isSaving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
