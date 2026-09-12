import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { MOCK_USER } from '../../mocks/test-handlers.js'
import { useAuthStore } from '../../stores/auth-store.js'
import { RequireAuth } from './require-auth.js'

function renderProtectedRoute(): void {
  render(
    <MemoryRouter initialEntries={['/private']}>
      <Routes>
        <Route element={<RequireAuth />}>
          <Route path="/private" element={<div>Área protegida</div>} />
        </Route>
        <Route path="/login" element={<div>Login</div>} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  cleanup()
  useAuthStore.setState({ status: 'booting', accessToken: null, user: null, sessionEnd: null })
})

describe('RequireAuth', () => {
  it('mantém o loading durante a restauração da sessão', () => {
    renderProtectedRoute()

    expect(screen.getByRole('status', { name: 'Restaurando sessão' })).toBeDefined()
    expect(screen.queryByText('Login')).toBeNull()
  })

  it('reconhece imediatamente uma sessão autenticada', () => {
    useAuthStore.getState().setSession('access', MOCK_USER)
    renderProtectedRoute()

    expect(screen.getByText('Área protegida')).toBeDefined()
  })

  it('redireciona uma sessão anônima ao login', () => {
    useAuthStore.getState().clearSession()
    renderProtectedRoute()

    expect(screen.getByText('Login')).toBeDefined()
  })
})
