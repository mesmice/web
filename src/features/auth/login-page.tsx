import { Button } from '../../components/ui/button.js'
import './login-page.css'

export function LoginPage() {
  return (
    <div className="login">
      <h1>Entrar no Concord</h1>
      <p className="login__hint">
        A autenticação será implementada na Fase 2 do roadmap. Este é um placeholder da estrutura
        de rotas.
      </p>
      <Button disabled>Entrar</Button>
    </div>
  )
}
