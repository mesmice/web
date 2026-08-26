import { create } from 'zustand'
import type { PrivateUser } from '../lib/types/auth.js'

/**
 * Estado de sessão em MEMÓRIA: o accessToken nunca é persistido (alvo
 * principal de XSS). O refreshToken vive apenas no storage, gerenciado por
 * `session-persistence.ts` — nunca aqui.
 */
export type AuthStatus = 'booting' | 'authenticated' | 'anonymous'

/**
 * Motivo do último encerramento de sessão. Consumido pelo `SessionWatcher`
 * para decidir a reação da UI (modal de expiração vs. redirect silencioso).
 */
export type SessionEndReason = 'logout' | 'expired' | 'revoked'

interface AuthState {
  status: AuthStatus
  accessToken: string | null
  user: PrivateUser | null
  sessionEnd: SessionEndReason | null
  setSession(accessToken: string, user: PrivateUser): void
  /** Substitui apenas o access token após um refresh bem-sucedido. */
  setAccessToken(accessToken: string): void
  /** Encerra a sessão registrando o motivo (quando conhecido). */
  clearSession(reason?: SessionEndReason): void
  /** Consome o motivo pendente após o tratamento na UI. */
  acknowledgeSessionEnd(): void
}

export const useAuthStore = create<AuthState>()((set) => ({
  status: 'booting',
  accessToken: null,
  user: null,
  sessionEnd: null,
  setSession: (accessToken, user) =>
    set({ status: 'authenticated', accessToken, user, sessionEnd: null }),
  setAccessToken: (accessToken) => set({ accessToken }),
  clearSession: (reason) =>
    set({ status: 'anonymous', accessToken: null, user: null, sessionEnd: reason ?? null }),
  acknowledgeSessionEnd: () => set({ sessionEnd: null })
}))
