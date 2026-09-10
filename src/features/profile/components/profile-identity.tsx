import { useId, useRef, useState } from 'react'
import { Button } from '../../../components/ui/button.js'
import { Input } from '../../../components/ui/input.js'
import { Spinner } from '../../../components/ui/spinner.js'
import type { PrivateUser } from '../../../lib/types/auth.js'
import { checkUsernameAvailability } from '../api/profile-endpoints.js'
import { useUpdateProfile } from '../queries/use-update-profile.js'
import './profile-section.css'

const DISPLAY_NAME_MAX = 32
const USERNAME_MIN = 3
const USERNAME_MAX = 20
const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/
const DEBOUNCE_MS = 400

type ProfileIdentityProps = Pick<PrivateUser, 'displayName' | 'username'>

type UsernameStatus = 'idle' | 'checking' | 'valid' | 'invalid' | 'taken'

export function ProfileIdentity({ displayName, username }: ProfileIdentityProps) {
  const updateProfile = useUpdateProfile()
  const displayNameId = useId()
  const usernameId = useId()

  const [editing, setEditing] = useState(false)
  const [draftDisplayName, setDraftDisplayName] = useState(displayName)
  const [draftUsername, setDraftUsername] = useState(username)

  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle')
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestIdRef = useRef(0)

  const nameLength = draftDisplayName.trim().length
  const invalidDisplayName = nameLength === 0 || nameLength > DISPLAY_NAME_MAX
  const usernameChanged = draftUsername.trim() !== username
  const unchanged = draftDisplayName.trim() === displayName && !usernameChanged
  const isUsernameValid = !usernameChanged || usernameStatus === 'valid'
  const canSubmit = !invalidDisplayName && !unchanged && isUsernameValid && !updateProfile.isPending

  function checkAvailability(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (value === username) {
      setUsernameStatus('valid')
      setUsernameError(null)
      return
    }
    if (value.length < USERNAME_MIN) {
      setUsernameStatus('idle')
      setUsernameError(null)
      return
    }
    if (!USERNAME_PATTERN.test(value)) {
      setUsernameStatus('invalid')
      setUsernameError('Use 3 a 20 caracteres: letras minúsculas, números e _')
      return
    }

    setUsernameStatus('checking')
    const requestId = ++requestIdRef.current
    debounceRef.current = setTimeout(() => {
      checkUsernameAvailability(value)
        .then(({ available }) => {
          if (requestId !== requestIdRef.current) return
          setUsernameStatus(available ? 'valid' : 'taken')
          setUsernameError(available ? null : 'Este username já está em uso.')
        })
        .catch(() => {
          if (requestId !== requestIdRef.current) return
          setUsernameStatus('idle')
          setUsernameError('Não foi possível checar agora. Tente de novo.')
        })
    }, DEBOUNCE_MS)
  }

  function handleUsernameChange(value: string) {
    const normalized = value.toLowerCase().trim()
    setDraftUsername(normalized)
    checkAvailability(normalized)
  }

  function startEditing() {
    setDraftDisplayName(displayName)
    setDraftUsername(username)
    setUsernameStatus('valid')
    setUsernameError(null)
    setEditing(true)
  }

  function cancel() {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    requestIdRef.current += 1
    setEditing(false)
  }

  function save() {
    if (!canSubmit) return
    const updates: { displayName?: string; username?: string } = {}
    if (draftDisplayName.trim() !== displayName) {
      updates.displayName = draftDisplayName.trim()
    }
    if (usernameChanged) {
      updates.username = draftUsername.trim()
    }
    updateProfile.mutate(updates, { onSuccess: () => setEditing(false) })
  }

  return (
    <section className="profile-section profile-identity" aria-labelledby="profile-title">
      <div className="profile-identity__heading">
        <div>
          <h1 id="profile-title">{editing ? draftDisplayName : displayName}</h1>
          <span className="profile-identity__username">@{editing ? draftUsername : username}</span>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={startEditing}
          disabled={editing || updateProfile.isPending}
        >
          Editar perfil
        </Button>
      </div>

      {editing && (
        <form
          className="profile-identity__form"
          onSubmit={(event) => {
            event.preventDefault()
            save()
          }}
        >
          <div className="profile-identity__field">
            <label className="profile-identity__label" htmlFor={displayNameId}>
              Nome de exibição
            </label>
            <Input
              id={displayNameId}
              value={draftDisplayName}
              onChange={(event) => setDraftDisplayName(event.target.value)}
              error={invalidDisplayName}
              maxLength={64}
              required
            />
            {invalidDisplayName && (
              <span className="profile-identity__error">
                O nome precisa ter entre 1 e {DISPLAY_NAME_MAX} caracteres.
              </span>
            )}
          </div>

          <div className="profile-identity__field">
            <label className="profile-identity__label" htmlFor={usernameId}>
              Username
            </label>
            <div className="profile-identity__username-row">
              <span className="profile-identity__username-prefix">@</span>
              <Input
                id={usernameId}
                className="profile-identity__username-input"
                value={draftUsername}
                onChange={(event) => handleUsernameChange(event.target.value)}
                error={usernameStatus === 'invalid' || usernameStatus === 'taken'}
                placeholder="seu-username"
                maxLength={USERNAME_MAX}
                autoComplete="off"
                required
              />
              {usernameStatus === 'checking' && (
                <span className="profile-identity__username-spinner">
                  <Spinner decorative />
                </span>
              )}
            </div>
            {usernameError && (
              <span
                className={`profile-identity__username-status ${
                  usernameStatus === 'valid'
                    ? 'profile-identity__username-status--success'
                    : 'profile-identity__username-status--error'
                }`}
              >
                {usernameError}
              </span>
            )}
            {usernameStatus === 'valid' && usernameChanged && !usernameError && (
              <span className="profile-identity__username-status profile-identity__username-status--success">
                Username disponível!
              </span>
            )}
            <span className="profile-identity__hint">
              {USERNAME_MIN}-{USERNAME_MAX} caracteres. Letras minúsculas, números e _.
            </span>
          </div>

          {updateProfile.isError && (
            <p className="profile-identity__error" role="alert">
              Não foi possível salvar: {updateProfile.error?.message}
            </p>
          )}

          <div className="profile-identity__actions">
            <Button type="submit" disabled={!canSubmit}>
              {updateProfile.isPending ? <Spinner decorative /> : null}
              Salvar
            </Button>
            <Button type="button" variant="ghost" onClick={cancel} disabled={updateProfile.isPending}>
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </section>
  )
}
