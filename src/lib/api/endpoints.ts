import { apiFetch } from './client.js'
import type { ReadinessReport } from '../types/api.js'
import type { PrivateUser, TokenPair } from '../types/auth.js'

export function getLiveness(): Promise<{ status: 'ok' }> {
  return apiFetch('/health/live')
}

export function getReadiness(): Promise<ReadinessReport> {
  return apiFetch('/health/ready')
}

export function getMe(): Promise<{ user: PrivateUser }> {
  return apiFetch('/users/me')
}

/** Resposta de login/registro: usuário + par de tokens. */
export interface AuthResponse extends TokenPair {
  user: PrivateUser
}

/**
 * Autentica por e-mail OU username (`identifier`). Já retorna a sessão aberta.
 */
export function login(identifier: string, password: string): Promise<AuthResponse> {
  return apiFetch('/auth/login', { method: 'POST', body: { identifier, password } })
}

/** Revoga a sessão atual. Resposta 204 sem corpo. */
export function logout(): Promise<void> {
  return apiFetch('/auth/logout', { method: 'POST' })
}
