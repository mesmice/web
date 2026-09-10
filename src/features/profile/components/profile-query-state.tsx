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
  notFound?: boolean
}

export function ProfileError({ onRetry, retrying, notFound = false }: ProfileErrorProps) {
  return (
    <section className="profile-query-state" aria-labelledby="profile-error-title">
      <h1 id="profile-error-title">
        {notFound ? 'Perfil não encontrado' : 'Não foi possível carregar o perfil'}
      </h1>
      <p>{notFound ? 'Este utilizador não existe ou não está disponível.' : 'Tente novamente em instantes.'}</p>
      <Button type="button" onClick={onRetry} disabled={retrying}>
        {retrying ? 'Tentando novamente…' : 'Tentar novamente'}
      </Button>
    </section>
  )
}
