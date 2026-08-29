/**
 * Tipos da camada de sessão, espelhando `@mesmice/contracts` (rest/auth.ts e
 * rest/users.ts). Quando o pacote de contratos for publicado e importado pelo
 * web, estes tipos devem ser substituídos pelos oficiais.
 */

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

export type UserPresence = 'online' | 'idle' | 'dnd' | 'invisible'

export interface ExternalLink {
  label: string
  url: string
}

export interface ProfileBadge {
  code: string
  name: string
  grantedAt: string
}

/** Usuário retornado para o próprio dono (`/users/me`, login, registro). */
export interface PrivateUser {
  id: string
  username: string
  displayName: string
  bio: string | null
  avatarUrl: string | null
  avatarThumbUrl: string | null
  bannerUrl: string | null
  externalLinks: ExternalLink[]
  profileTheme: string | null
  avatarFrameUrl: string | null
  profileColor: string | null
  badges: ProfileBadge[]
  presence: UserPresence
  lastActiveAt: string
  createdAt: string
  email: string
  emailVerified: boolean
}

/**
 * Códigos que indicam sessão inválida/dead. Qualquer um deles ⇒ limpar estado
 * local e ir para o login (ver api/docs/integracao.md §3).
 */
export const AUTH_ERROR_CODES = [
  'UNAUTHORIZED',
  'TOKEN_INVALID',
  'SESSION_EXPIRED',
  'SESSION_REVOKED'
] as const

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[number]

export function isAuthErrorCode(code: string): code is AuthErrorCode {
  return (AUTH_ERROR_CODES as readonly string[]).includes(code)
}
