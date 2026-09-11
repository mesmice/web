import { useId, useRef, useState } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '../../../components/ui/button.js';
import { Input } from '../../../components/ui/input.js';
import { Spinner } from '../../../components/ui/spinner.js';
import type { PublicUser } from '../../../lib/types/auth.js';
import './profile-section.css';

const DISPLAY_NAME_MAX = 32;
const USERNAME_MIN = 3;
const USERNAME_MAX = 20;
const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;
const DEBOUNCE_MS = 400;

type IdentityPatch = { displayName?: string; username?: string };
type UsernameStatus = 'idle' | 'checking' | 'valid' | 'invalid' | 'taken';

interface ProfileIdentityProps extends Pick<PublicUser, 'displayName' | 'username' | 'presence'> {
  isOwner?: boolean;
  onSave?: (patch: IdentityPatch) => Promise<void>;
  onCheckUsername?: (value: string) => Promise<boolean>;
}

const PRESENCE_LABEL: Record<PublicUser['presence'], string> = {
  online: 'Online',
  idle: 'Ausente',
  dnd: 'Não incomodar',
  invisible: 'Invisível',
  offline: 'Offline'
};

export function ProfileIdentity({
  displayName,
  username,
  presence,
  isOwner = false,
  onSave,
  onCheckUsername
}: ProfileIdentityProps) {
  const displayNameId = useId();
  const usernameId = useId();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [draftDisplayName, setDraftDisplayName] = useState(displayName);
  const [draftUsername, setDraftUsername] = useState(username);
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  const invalidDisplayName =
    draftDisplayName.trim().length === 0 || draftDisplayName.trim().length > DISPLAY_NAME_MAX;
  const usernameChanged = draftUsername.trim() !== username;
  const unchanged = draftDisplayName.trim() === displayName && !usernameChanged;
  const isUsernameValid = !usernameChanged || usernameStatus === 'valid';
  const canSubmit = !invalidDisplayName && !unchanged && isUsernameValid && !isSaving;

  function checkAvailability(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value === username) {
      setUsernameStatus('valid');
      setUsernameError(null);
      return;
    }
    if (value.length < USERNAME_MIN) {
      setUsernameStatus('idle');
      setUsernameError(null);
      return;
    }
    if (!USERNAME_PATTERN.test(value)) {
      setUsernameStatus('invalid');
      setUsernameError('Use 3 a 20 caracteres: letras minúsculas, números e _');
      return;
    }
    if (!onCheckUsername) {
      setUsernameStatus('valid');
      setUsernameError(null);
      return;
    }

    setUsernameStatus('checking');
    const requestId = ++requestIdRef.current;
    debounceRef.current = setTimeout(() => {
      onCheckUsername(value)
        .then((available) => {
          if (requestId !== requestIdRef.current) return;
          setUsernameStatus(available ? 'valid' : 'taken');
          setUsernameError(available ? null : 'Este username já está em uso.');
        })
        .catch(() => {
          if (requestId !== requestIdRef.current) return;
          setUsernameStatus('idle');
          setUsernameError('Não foi possível checar agora. Tente de novo.');
        });
    }, DEBOUNCE_MS);
  }

  function handleUsernameChange(value: string) {
    const normalized = value.toLowerCase().trim();
    setDraftUsername(normalized);
    checkAvailability(normalized);
  }

  function startEditing() {
    setDraftDisplayName(displayName);
    setDraftUsername(username);
    setUsernameStatus('valid');
    setUsernameError(null);
    setSaveError(null);
    setIsEditing(true);
  }

  function cancelEditing() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    requestIdRef.current += 1;
    setIsEditing(false);
  }

  async function handleSave() {
    if (!canSubmit) return;
    if (!onSave) {
      setIsEditing(false);
      return;
    }
    const patch: IdentityPatch = {};
    if (draftDisplayName.trim() !== displayName) patch.displayName = draftDisplayName.trim();
    if (usernameChanged) patch.username = draftUsername.trim();

    setIsSaving(true);
    setSaveError(null);
    try {
      await onSave(patch);
      setIsEditing(false);
    } catch {
      setSaveError('Não foi possível salvar. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="profile-section profile-identity" aria-labelledby="profile-title">
      <div className="profile-identity__heading">
        <div>
          <h1 id="profile-title">{isEditing ? draftDisplayName : displayName}</h1>
          <div className="profile-identity__meta">
            <p className="profile-identity__username">@{isEditing ? draftUsername : username}</p>
            <p className="profile-identity__presence" aria-label={`Presença: ${presence}`}>
              <span
                className={`profile-identity__presence-dot profile-identity__presence-dot--${presence}`}
                aria-hidden="true"
              />
              <span>{PRESENCE_LABEL[presence]}</span>
            </p>
          </div>
        </div>
        {isOwner && !isEditing ? (
          <button
            type="button"
            className="profile-identity__icon-button"
            onClick={startEditing}
            aria-label="Editar nome e username"
          >
            <Pencil size={16} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {isEditing && (
        <form
          className="profile-identity__editor"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSave();
          }}
        >
          <div className="profile-identity__field">
            <label htmlFor={displayNameId}>Nome de exibição</label>
            <Input
              id={displayNameId}
              value={draftDisplayName}
              onChange={(event) => setDraftDisplayName(event.target.value)}
              error={invalidDisplayName}
              maxLength={64}
              disabled={isSaving}
              required
            />
            {invalidDisplayName && (
              <span className="profile-identity__field-error">
                O nome precisa ter entre 1 e {DISPLAY_NAME_MAX} caracteres.
              </span>
            )}
          </div>

          <div className="profile-identity__field">
            <label htmlFor={usernameId}>Username</label>
            <div className="profile-identity__username-row">
              <span className="profile-identity__username-prefix">@</span>
              <Input
                id={usernameId}
                value={draftUsername}
                onChange={(event) => handleUsernameChange(event.target.value)}
                error={usernameStatus === 'invalid' || usernameStatus === 'taken'}
                placeholder="seu-username"
                maxLength={USERNAME_MAX}
                autoComplete="off"
                disabled={isSaving}
                required
              />
              {usernameStatus === 'checking' && (
                <span className="profile-identity__username-spinner">
                  <Spinner decorative />
                </span>
              )}
            </div>
            {usernameError && (
              <span className="profile-identity__field-error" role="alert">
                {usernameError}
              </span>
            )}
            {usernameStatus === 'valid' && usernameChanged && !usernameError && (
              <span className="profile-identity__field-success">Username disponível!</span>
            )}
          </div>

          {saveError && (
            <p className="profile-identity__save-error" role="alert">
              {saveError}
            </p>
          )}

          <div className="profile-identity__editor-actions">
            <Button type="button" variant="ghost" onClick={cancelEditing} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isSaving ? 'Salvando…' : 'Salvar'}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
