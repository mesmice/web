import { Navigate, Outlet } from 'react-router-dom'
import { Spinner } from '../../components/ui/spinner.js'
import { useAuthStore } from '../../stores/auth-store.js'
import './require-auth.css'

/**
 * Guarda de rotas autenticadas: espera o boot resolver a sessão e
 * redireciona visitantes ao /login.
 */
export function RequireAuth() {
  const status = useAuthStore((state) => state.status)

  if (status === 'booting') {
    return (
      <div className="auth-splash">
        <Spinner label="Restaurando sessão" />
      </div>
    )
  }

  if (status === 'anonymous') {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
