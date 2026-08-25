import { beforeEach, describe, expect, it } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { SessionWatcher } from '../components/system/session-watcher.js'
import { useAuthStore } from '../stores/auth-store.js'

function renderWatcher(): void {
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<div>Home</div>} />
        <Route path="/login" element={<div>Login</div>} />
      </Routes>
      <SessionWatcher />
    </MemoryRouter>
  )
}

beforeEach(() => {
  cleanup()
  localStorage.clear()
  useAuthStore.setState({
    status: 'authenticated',
    accessToken: 'access',
    user: null,
    sessionEnd: null
  })
})

describe('SessionWatcher', () => {
  it('mostra modal de expiração e redireciona ao /login', () => {
    renderWatcher()

    act(() => {
      useAuthStore.getState().clearSession('expired')
    })

    expect(screen.getByRole('dialog')).toBeDefined()
    expect(screen.getByText('Sessão expirada')).toBeDefined()
    expect(screen.getByText('Login')).toBeDefined()
  })

  it('explica revogação remota e fecha ao confirmar', () => {
    renderWatcher()

    act(() => {
      useAuthStore.getState().clearSession('revoked')
    })

    expect(screen.getByText('Sessão encerrada')).toBeDefined()

    const confirm = screen.getByRole('button', { name: 'Entrar novamente' })
    fireEvent.click(confirm)

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(useAuthStore.getState().sessionEnd).toBeNull()
  })

  it('logout voluntário navega sem modal', () => {
    renderWatcher()

    act(() => {
      useAuthStore.getState().clearSession('logout')
    })

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByText('Login')).toBeDefined()
  })
})
