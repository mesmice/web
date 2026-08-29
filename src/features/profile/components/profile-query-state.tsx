import { Button } from '../../../components/ui/button.js'
import { Spinner } from '../../../components/ui/spinner.js'
import './profile-query-state.css'

export function ProfileLoading() {
  return (
    <div className="profile-query-state" aria-busy="true">
      <Spinner label="Carregando perfil" />
      <p>Carregando seu perfil…</p>
    </div>
  )
}

interface ProfileErrorProps {
  onRetry(): void
  retrying: boolean
}

export function ProfileError({ onRetry, retrying }: ProfileErrorProps) {
  return (
    <section className="profile-query-state" aria-labelledby="profile-error-title">
      <h1 id="profile-error-title">Não foi possível carregar seu perfil</h1>
      <p>Tente novamente em instantes.</p>
      <Button type="button" onClick={onRetry} disabled={retrying}>
        {retrying ? 'Tentando novamente…' : 'Tentar novamente'}
      </Button>
    </section>
  )
}
