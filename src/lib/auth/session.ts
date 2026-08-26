import { refreshSession } from '../api/client.js'
import { getMe, logout } from '../api/endpoints.js'
import {
  clearPersistedSession,
  getSavedRefreshToken,
  saveRefreshToken
} from './session-persistence.js'
import { useAuthStore } from '../../stores/auth-store.js'
import type { PrivateUser, TokenPair } from '../types/auth.js'

/**
 * Contrato para as telas de login/cadastro: aplica o par recebido da API
 * (persistindo o refreshToken) e autentica a store.
 */
export function applyAuthenticatedSession(pair: TokenPair, user: PrivateUser): void {
  saveRefreshToken(pair.refreshToken)
  useAuthStore.getState().setSession(pair.accessToken, user)
}

/**
 * Encerra a sessão: revoga no servidor e limpa o estado local MESMO se a
 * chamada falhar (idempotente). A reação da UI (redirect ao /login) cabe ao
 * `<SessionWatcher/>` via motivo registrado na store.
 */
export async function signOut(): Promise<void> {
  try {
    await logout()
  } catch {
    // API indisponível não pode prender o usuário logado.
  } finally {
    clearPersistedSession()
    useAuthStore.getState().clearSession('logout')
  }
}

let restoreInFlight: Promise<void> | null = null

/**
 * Restaura a sessão salva no boot do app (F5/reabrir aba). Chamadas
 * concorrentes compartilham a mesma promise — evita duplo refresh quando o
 * React StrictMode monta o layout duas vezes.
 */
export function restoreSession(): Promise<void> {
  restoreInFlight ??= doRestore().finally(() => {
    restoreInFlight = null
  })
  return restoreInFlight
}

async function doRestore(): Promise<void> {
  const state = useAuthStore.getState()
  if (state.status === 'authenticated') return

  if (!getSavedRefreshToken()) {
    state.clearSession()
    return
  }

  if (!(await refreshSession())) {
    clearPersistedSession()
    useAuthStore.getState().clearSession()
    return
  }

  const accessToken = useAuthStore.getState().accessToken
  if (!accessToken) {
    clearPersistedSession()
    useAuthStore.getState().clearSession()
    return
  }

  try {
    const { user } = await getMe()
    useAuthStore.getState().setSession(accessToken, user)
  } catch {
    clearPersistedSession()
    useAuthStore.getState().clearSession()
  }
}
