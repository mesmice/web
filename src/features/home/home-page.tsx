import { Link } from 'react-router-dom'
import { useHealth } from '../../hooks/use-health.js'
import { Spinner } from '../../components/ui/spinner.js'
import './home-page.css'

export function HomePage() {
  const { data, isPending, isError, error } = useHealth()

  if (isPending) {
    return (
      <div className="home">
        <Spinner label="Verificando status da API" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="home" role="alert">
        <h1>Mesmice</h1>
        <p className="home__error">API indisponível: {error.message}</p>
      </div>
    )
  }

  const mongo = data.checks.find((check) => check.name === 'mongo')
  const redis = data.checks.find((check) => check.name === 'redis')

  return (
    <div className="home">
      <h1>Mesmice</h1>
      <p>Status da API: <strong>{data.status === 'ok' ? 'operacional' : 'degradado'}</strong></p>
      <ul className="home__checks">
        <li>MongoDB: {mongo?.ok ? 'ok' : 'indisponível'}</li>
        <li>Redis: {redis?.ok ? 'ok' : 'indisponível'}</li>
      </ul>
      <Link to="/login">Entrar</Link>
    </div>
  )
}
