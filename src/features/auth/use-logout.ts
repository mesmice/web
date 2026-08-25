import { useMutation } from '@tanstack/react-query'
import { signOut } from '../../lib/auth/session.js'

/**
 * Fluxo de logout: revoga a sessão no servidor e limpa o estado local
 * (`signOut` garante a limpeza mesmo se a API falhar). A navegação ao
 * /login acontece via `<SessionWatcher/>`.
 */
export function useLogout() {
  return useMutation({ mutationFn: () => signOut() })
}
