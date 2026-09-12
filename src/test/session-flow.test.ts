import { beforeEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/node.js'
import { apiFetch } from '../lib/api/client.js'
import { signOut } from '../lib/auth/session.js'
import { useAuthStore } from '../stores/auth-store.js'
import { getSavedRefreshToken, saveRefreshToken } from '../lib/auth/session-persistence.js'

const REFRESH_KEY = 'mesmice.refresh'

function authenticate(): void {
  saveRefreshToken('current-refresh')
  useAuthStore.setState({
    status: 'authenticated',
    accessToken: 'stale-access',
    user: null,
    sessionEnd: null
  })
}

function unauthorizedOnceThenOk(payload: { ok: boolean }): void {
  server.use(
    http.get(
      '*/api/v1/secure',
      () =>
        HttpResponse.json(
          {
            error: { code: 'TOKEN_INVALID', message: 'Access token inválido ou expirado.' }
          },
          { status: 401 }
        ),
      { once: true }
    ),
    http.get('*/api/v1/secure', () => HttpResponse.json(payload))
  )
}

beforeEach(() => {
  localStorage.clear()
  useAuthStore.setState({ status: 'booting', accessToken: null, user: null, sessionEnd: null })
})

describe('refresh silencioso do apiFetch', () => {
  it('renova o token e repete a requisição após o primeiro 401', async () => {
    authenticate()
    unauthorizedOnceThenOk({ ok: true })
    server.use(
      http.post('*/api/v1/auth/refresh', () =>
        HttpResponse.json({ accessToken: 'fresh-access', refreshToken: 'rotated-refresh' })
      )
    )

    const result = await apiFetch<{ ok: boolean }>('/secure')

    expect(result).toEqual({ ok: true })
    expect(useAuthStore.getState().accessToken).toBe('fresh-access')
    expect(getSavedRefreshToken()).toBe('rotated-refresh')
    expect(useAuthStore.getState().status).toBe('authenticated')
    expect(useAuthStore.getState().sessionEnd).toBeNull()
  })

  it('encerra a sessão com motivo "expired" quando o refresh falha', async () => {
    authenticate()
    server.use(
      http.get(
        '*/api/v1/secure',
        () =>
          HttpResponse.json(
            { error: { code: 'UNAUTHORIZED', message: 'Autenticação obrigatória.' } },
            { status: 401 }
          ),
        { once: true }
      ),
      http.get('*/api/v1/secure', () => HttpResponse.json({ ok: true })),
      http.post('*/api/v1/auth/refresh', () =>
        HttpResponse.json(
          { error: { code: 'SESSION_EXPIRED', message: 'Sessão expirada.' } },
          { status: 401 }
        )
      )
    )

    await expect(apiFetch('/secure')).rejects.toMatchObject({ code: 'UNAUTHORIZED' })

    const state = useAuthStore.getState()
    expect(state.status).toBe('anonymous')
    expect(state.sessionEnd).toBe('expired')
    expect(localStorage.getItem(REFRESH_KEY)).toBeNull()
  })

  it('marca motivo "revoked" quando o retry retorna SESSION_REVOKED', async () => {
    authenticate()
    unauthorizedOnceThenOk({ ok: true })
    server.use(
      http.get('*/api/v1/secure', () =>
        HttpResponse.json(
          {
            error: { code: 'SESSION_REVOKED', message: 'Reuso de refresh token detectado.' }
          },
          { status: 401 }
        )
      ),
      http.post('*/api/v1/auth/refresh', () =>
        HttpResponse.json({ accessToken: 'fresh-access', refreshToken: 'rotated-refresh' })
      )
    )

    await expect(apiFetch('/secure')).rejects.toMatchObject({ code: 'SESSION_REVOKED' })

    const state = useAuthStore.getState()
    expect(state.status).toBe('anonymous')
    expect(state.sessionEnd).toBe('revoked')
    expect(localStorage.getItem(REFRESH_KEY)).toBeNull()
  })

  it('não sobrescreve o motivo quando um 401 tardio chega após limpeza', async () => {
    useAuthStore.setState({
      status: 'anonymous',
      accessToken: null,
      user: null,
      sessionEnd: 'logout'
    })

    await expect(apiFetch('/users/me')).rejects.toBeDefined()

    const state = useAuthStore.getState()
    expect(state.sessionEnd).toBe('logout')
    expect(state.status).toBe('anonymous')
  })
})

describe('signOut', () => {
  it('revoga no servidor e registra motivo "logout"', async () => {
    authenticate()
    let logoutCalled = false
    server.use(
      http.post('*/api/v1/auth/logout', () => {
        logoutCalled = true
        return new HttpResponse(null, { status: 204 })
      })
    )

    await signOut()

    expect(logoutCalled).toBe(true)
    const state = useAuthStore.getState()
    expect(state.status).toBe('anonymous')
    expect(state.accessToken).toBeNull()
    expect(state.sessionEnd).toBe('logout')
    expect(localStorage.getItem(REFRESH_KEY)).toBeNull()
  })

  it('limpa a sessão local mesmo se a API estiver indisponível', async () => {
    authenticate()
    server.use(http.post('*/api/v1/auth/logout', () => HttpResponse.error()))

    await signOut()

    const state = useAuthStore.getState()
    expect(state.status).toBe('anonymous')
    expect(state.sessionEnd).toBe('logout')
    expect(localStorage.getItem(REFRESH_KEY)).toBeNull()
  })
})
