import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { server } from '../../mocks/node.js'
import { MOCK_USER } from '../../mocks/test-handlers.js'
import { getSavedRefreshToken } from '../../lib/auth/session-persistence.js'
import { useAuthStore } from '../../stores/auth-store.js'
import { LoginPage } from './login-page.js'

vi.mock('qrcode', () => ({
  default: { toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,mock') }
}))

function AuthenticatedHome() {
  const displayName = useAuthStore((state) => state.user?.displayName)
  return <div>Olá, {displayName}</div>
}

function renderLogin() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } }
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<AuthenticatedHome />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  cleanup()
  localStorage.clear()
  useAuthStore.setState({ status: 'anonymous', accessToken: null, user: null, sessionEnd: null })
})

describe('LoginPage', () => {
  it('aplica a sessão canônica antes de navegar após login bem-sucedido', async () => {
    let requestBody: unknown
    server.use(
      http.post('*/api/v1/auth/login', async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({
          user: MOCK_USER,
          accessToken: 'login-access',
          refreshToken: 'login-refresh'
        })
      })
    )
    renderLogin()

    fireEvent.change(screen.getByRole('textbox', { name: 'E-mail ou nome de usuário' }), {
      target: { value: ' maria@example.com ' }
    })
    fireEvent.change(screen.getByPlaceholderText('Sua senha'), {
      target: { value: 'senha-super-segura' }
    })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    await screen.findByText('Olá, Maria Souza')

    expect(requestBody).toEqual({
      identifier: 'maria@example.com',
      password: 'senha-super-segura'
    })
    expect(useAuthStore.getState()).toMatchObject({
      status: 'authenticated',
      accessToken: 'login-access',
      user: MOCK_USER
    })
    expect(getSavedRefreshToken()).toBe('login-refresh')
  })

  it('não cria sessão nem navega quando a API rejeita o login', async () => {
    server.use(
      http.post('*/api/v1/auth/login', () =>
        HttpResponse.json(
          { error: { code: 'INVALID_CREDENTIALS', message: 'Credenciais inválidas.' } },
          { status: 401 }
        )
      )
    )
    renderLogin()

    fireEvent.change(screen.getByRole('textbox', { name: 'E-mail ou nome de usuário' }), {
      target: { value: 'maria@example.com' }
    })
    fireEvent.change(screen.getByPlaceholderText('Sua senha'), { target: { value: 'errada' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    await screen.findByRole('alert')
    await waitFor(() => expect(useAuthStore.getState().status).toBe('anonymous'))
    expect(screen.getByText('Credenciais inválidas.')).toBeDefined()
    expect(getSavedRefreshToken()).toBeNull()
  })
})
