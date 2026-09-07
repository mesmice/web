import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../../../components/ui/button.js';
import type { PrivateUser } from '../../../lib/types/auth.js';

interface ProfileAboutProps {
  bio: PrivateUser['bio'];
  isOwner: boolean;
  onSave?: (bio: string | null) => Promise<void> | void;
}

const BIO_LIMIT = 190;
const URL_REGEX = /(https?:\/\/[^\s]+)/g;
const MENTION_REGEX = /(@[a-zA-Z0-9_.]+)/g;

type BioBlock =
  { type: 'line'; text: string } | { type: 'quote'; text: string; attribution?: string };

/**
 * Mantém a bio como texto do perfil, sem transformar o bloco em um card separado.
 * Links e menções recebem destaque, mas a estrutura visual continua simples.
 */
function renderInline(text: string, keyPrefix: string) {
  const parts = text.split(new RegExp(`(${URL_REGEX.source}|${MENTION_REGEX.source})`, 'g'));

  return parts
    .filter((part): part is string => Boolean(part))
    .map((part, index) => {
      const key = `${keyPrefix}-${index}`;

      if (/^https?:\/\//.test(part)) {
        return (
          <a
            key={key}
            href={part}
            target="_blank"
            rel="noreferrer"
            className="text-(--color-brand-primary) underline decoration-(--color-brand-lilac) underline-offset-2 transition-colors hover:text-(--color-brand-primary-hover) hover:decoration-(--color-brand-primary)"
          >
            {part}
          </a>
        );
      }

      if (/^@[a-zA-Z0-9_.]+$/.test(part)) {
        return (
          <span
            key={key}
            className="rounded-sm bg-(--color-action-secondary) px-1 py-px font-medium text-(--color-brand-deep-purple)"
          >
            {part}
          </span>
        );
      }

      return <span key={key}>{part}</span>;
    });
}

/**
 * Agrupa citações de múltiplas linhas para manter a leitura mais limpa.
 */
function parseBioBlocks(rawBio: string): BioBlock[] {
  const lines = rawBio.split('\n');
  const blocks: BioBlock[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line) continue;

    const isQuoteLine = /^['"“].+['"”]$/.test(line);
    const nextLine = lines[i + 1]?.trim();
    const nextIsAttribution = Boolean(nextLine && /^[—-]\s?/.test(nextLine));

    if (isQuoteLine && nextIsAttribution) {
      blocks.push({
        type: 'quote',
        text: line.replace(/^['"“]|['"”]$/g, ''),
        attribution: nextLine.replace(/^[—-]\s?/, '')
      });
      i += 1;
      continue;
    }

    blocks.push({ type: 'line', text: line });
  }

  return blocks;
}

export function ProfileAbout({ bio, isOwner, onSave }: ProfileAboutProps) {
  const initialBio = bio?.trim() ?? '';
  const [draft, setDraft] = useState(initialBio);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const editRef = useRef<HTMLTextAreaElement>(null);

  const normalizedBio = useMemo(() => initialBio, [initialBio]);
  const blocks = useMemo(() => parseBioBlocks(normalizedBio), [normalizedBio]);
  const remaining = BIO_LIMIT - draft.length;

  // Ajusta a altura do textarea em tempo real, sem parecer um editor em caixa separada.
  useEffect(() => {
    if (isEditing && editRef.current) {
      editRef.current.style.height = 'auto';
      editRef.current.style.height = `${editRef.current.scrollHeight}px`;
      editRef.current.focus();
      editRef.current.selectionStart = editRef.current.value.length;
    }
  }, [isEditing, draft]);

  const startEditing = () => {
    setDraft(normalizedBio);
    setFeedback(null);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setDraft(normalizedBio);
    setIsEditing(false);
    setFeedback(null);
  };

  const handleSave = async () => {
    const nextBio = draft.trim();
    if (!onSave) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      await onSave(nextBio || null);
      setIsEditing(false);
      setFeedback('Bio salva com sucesso.');
    } catch {
      setFeedback('Não foi possível salvar a bio.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mt-3 w-full">
      <h2 className="mb-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-(--color-text-muted)]">
        Sobre
      </h2>

      {isEditing ? (
        <div className="space-y-2">
          <label htmlFor="profile-bio-edit" className="sr-only">
            Bio
          </label>
          {/** Edição inline para manter o texto da bio como parte do perfil. */}
          <textarea
            ref={editRef}
            id="profile-bio-edit"
            value={draft}
            onChange={(event) => setDraft(event.target.value.slice(0, BIO_LIMIT))}
            rows={1}
            maxLength={BIO_LIMIT}
            placeholder="Fale um pouco sobre você..."
            className="w-full resize-none overflow-hidden bg-transparent p-0 text-[13px] leading-6 text-(--color-text-primary) placeholder:text-(--color-text-muted) focus:outline-none"
          />

          <div className="flex items-center justify-between gap-3 border-t border-(--color-border-default) pt-2 text-xs text-(--color-text-muted)">
            <span className={remaining < 0 ? 'text-(--color-danger)' : undefined}>
              {Math.max(0, draft.length)}/{BIO_LIMIT}
            </span>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                className="h-8 px-3 text-xs"
                onClick={cancelEditing}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => void handleSave()}
                className="h-8 px-3 text-xs bg-(--color-brand-primary) text-(--color-brand-white) hover:bg-(--color-brand-primary-hover)"
                disabled={isSaving}
                aria-label="Salvar bio"
              >
                {isSaving ? 'Salvando...' : 'Salvar bio'}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div
            className={[
              'w-full rounded-md px-1 py-1 text-[13px] leading-6 text-(--color-text-primary) transition-all duration-200',
              isOwner
                ? 'cursor-pointer hover:bg-(--color-surface-secondary) hover:border-2 border-[#693de9]'
                : ''
            ].join(' ')}
            onClick={isOwner ? startEditing : undefined}
            onKeyDown={
              isOwner
                ? (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      startEditing();
                    }
                  }
                : undefined
            }
            role={isOwner ? 'button' : undefined}
            tabIndex={isOwner ? 0 : undefined}
          >
            {blocks.length > 0 ? (
              <div className="space-y-1.5">
                {blocks.map((block, i) =>
                  block.type === 'quote' ? (
                    <blockquote
                      key={`b-${i}`}
                      className="my-1 border-l-2 border-(--color-brand-primary) py-0.5 pl-3 text-[13px] italic leading-6 text-(--color-text-secondary)"
                    >
                      <p className="m-0">“{renderInline(block.text, `q-${i}`)}”</p>
                      {block.attribution && (
                        <cite className="mt-0.5 block text-[11px] not-italic uppercase tracking-wide text-(--color-text-muted)">
                          — {block.attribution}
                        </cite>
                      )}
                    </blockquote>
                  ) : (
                    <p
                      key={`l-${i}`}
                      className="m-0 text-[13px] leading-6 text-(--color-text-primary)"
                    >
                      {renderInline(block.text, `l-${i}`)}
                    </p>
                  )
                )}
              </div>
            ) : (
              <p className="m-0 text-[13px] italic leading-6 text-(--color-text-muted)">
                {isOwner ? 'Nenhuma bio adicionada.' : 'Sem bio no momento.'}
              </p>
            )}
          </div>

          {feedback && <p className="mt-2 text-xs text-(--color-success)">{feedback}</p>}
        </>
      )}
    </div>
  );
}
