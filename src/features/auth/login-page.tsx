import { Navigate } from 'react-router-dom'
import { Button } from '../../components/ui/button.js'
import { useAuthStore } from '../../stores/auth-store.js'
import './login-page.css'

export function LoginPage() {
  const status = useAuthStore((state) => state.status)

  if (status === 'authenticated') {
    return <Navigate to="/" replace />
  }

  return (
    <div className="login">
      <h1>Entrar no Mesmice</h1>
      <p className="login__hint">
        A autenticação será implementada na Fase 2 do roadmap. Este é um placeholder da estrutura
        de rotas.
      </p>
      <Button disabled>Entrar</Button>
    </div>
  )
}
