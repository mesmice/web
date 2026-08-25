import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/button.js'
import { applyAuthenticatedSession } from '../../lib/auth/session.js'
import { login } from '../../lib/api/endpoints.js'

/**
 * ATALHO DE DESENVOLVIMENTO — não é o formulário de login oficial
 * (task 2.1). Renderizado apenas em dev com mocks ligados, para permitir
 * testar logout/sessão expirada sem depender da tela do colega.
 */
export function DevLoginButton() {
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick(): Promise<void> {
    setPending(true)
    setError(null)
    try {
      const { user, accessToken, refreshToken } = await login('maria', 'senha-dev')
      applyAuthenticatedSession({ accessToken, refreshToken }, user)
      navigate('/', { replace: true })
    } catch {
      setError('Não foi possível entrar com o usuário mockado.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="dev-login">
      <Button variant="ghost" onClick={() => void handleClick()} disabled={pending}>
        {pending ? 'Entrando…' : 'Entrar (modo dev)'}
      </Button>
      {error && (
        <p className="dev-login__error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
