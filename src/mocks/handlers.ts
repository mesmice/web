import { http, HttpResponse } from 'msw'
import type { PrivateUser, TokenPair } from '../lib/types/auth.js'

/**
 * Handlers de autenticação para desenvolvimento/testes (VITE_ENABLE_MOCKS=true).
 * Simulam o contrato da API (`api/docs/integracao.md`): rotação de refresh,
 * revogação no logout e envelope de erro nos 401.
 */

const MOCK_USER: PrivateUser = {
  id: '9000000000000000001',
  username: 'maria',
  displayName: 'Maria Souza',
  bio: null,
  avatarUrl: null,
  presence: 'online',
  createdAt: '2026-01-01T12:00:00.000Z',
  email: 'maria@example.com',
  emailVerified: true
}

/** Refresh token atualmente válido no "servidor" mockado. */
let activeRefreshToken: string | null = null

function randomSuffix(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function authError(status: number, code: string, message: string) {
  return HttpResponse.json({ error: { code, message } }, { status })
}

/** Emite um par novo e passa a aceitar apenas o refreshToken dele. */
function issueSession(): TokenPair {
  const pair: TokenPair = {
    accessToken: `mock-access-${randomSuffix()}`,
    refreshToken: `mock-refresh-${randomSuffix()}`
  }
  activeRefreshToken = pair.refreshToken
  return pair
}

export function getMockUser(): PrivateUser {
  return MOCK_USER
}

export const handlers = [
  http.get('*/api/v1/health/live', () => {
    return HttpResponse.json({ status: 'ok' })
  }),

  http.get('*/api/v1/health/ready', () => {
    return HttpResponse.json({
      status: 'degraded',
      checks: [
        { name: 'mongo', ok: false },
        { name: 'redis', ok: false }
      ]
    })
  }),

  http.post('*/api/v1/auth/login', () => {
    const pair = issueSession()
    return HttpResponse.json({
      user: MOCK_USER,
      accessToken: pair.accessToken,
      refreshToken: pair.refreshToken
    })
  }),

  http.post('*/api/v1/auth/refresh', async ({ request }) => {
    const body = (await request.json().catch(() => null)) as { refreshToken?: string } | null
    if (!body?.refreshToken || body.refreshToken !== activeRefreshToken) {
      return authError(401, 'SESSION_EXPIRED', 'Sessão expirada. Faça login novamente.')
    }
    return HttpResponse.json(issueSession())
  }),

  http.post('*/api/v1/auth/logout', () => {
    activeRefreshToken = null
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('*/api/v1/users/me', ({ request }) => {
    const authorization = request.headers.get('authorization')
    if (!authorization?.startsWith('Bearer ')) {
      return authError(401, 'UNAUTHORIZED', 'Autenticação obrigatória.')
    }
    return HttpResponse.json({ user: MOCK_USER })
  })
]
