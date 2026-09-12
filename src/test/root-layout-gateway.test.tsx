import { act, cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { queryClient } from '../lib/query-client.js'
import { gateway } from '../lib/ws/socket.js'
import { saveRefreshToken } from '../lib/auth/session-persistence.js'
import { RootLayout } from '../routes/root-layout.js'
import { useAuthStore } from '../stores/auth-store.js'
import { server } from '../mocks/node.js'

interface SocketEvent {
  code?: number
  data?: string
}

class FakeWebSocket {
  static readonly OPEN = 1
  static instances: FakeWebSocket[] = []

  readonly sent: string[] = []
  readyState = 0
  private listeners = new Map<string, Array<(event: SocketEvent) => void>>()

  constructor() {
    FakeWebSocket.instances.push(this)
  }

  addEventListener(type: string, listener: (event: SocketEvent) => void): void {
    const list = this.listeners.get(type) ?? []
    list.push(listener)
    this.listeners.set(type, list)
  }

  send(message: string): void {
    this.sent.push(message)
  }

  close(): void {
    this.readyState = 3
  }

  serverOpen(): void {
    this.readyState = FakeWebSocket.OPEN
    this.dispatch('open', {})
  }

  serverMessage(message: unknown): void {
    this.dispatch('message', { data: JSON.stringify(message) })
  }

  serverClose(code: number): void {
    this.readyState = 3
    this.dispatch('close', { code })
  }

  private dispatch(type: string, event: SocketEvent): void {
    for (const listener of this.listeners.get(type) ?? []) listener(event)
  }
}

beforeEach(() => {
  gateway.disconnect()
  FakeWebSocket.instances = []
  vi.stubGlobal('WebSocket', FakeWebSocket)
  localStorage.clear()
  saveRefreshToken('refresh-token')
  useAuthStore.setState({
    status: 'authenticated',
    accessToken: 'access-token',
    user: null,
    sessionEnd: null
  })
})

afterEach(() => {
  cleanup()
  gateway.disconnect()
  vi.unstubAllGlobals()
})

describe('RootLayout gateway session integration', () => {
  it('encaminha session.revoked para a store canônica e remove o refresh token', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route element={<RootLayout />}>
              <Route index element={<div>Home</div>} />
            </Route>
            <Route path="/login" element={<div>Login</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )

    expect(FakeWebSocket.instances).toHaveLength(1)
    act(() => {
      FakeWebSocket.instances[0].serverOpen()
      FakeWebSocket.instances[0].serverMessage({
        type: 'session.revoked',
        payload: { sessionId: 'session-1' }
      })
    })

    await waitFor(() => {
      expect(useAuthStore.getState()).toMatchObject({
        status: 'anonymous',
        accessToken: null,
        sessionEnd: 'revoked'
      })
    })
    expect(localStorage.getItem('mesmice.refresh')).toBeNull()
  })

  it('renova o access token após 4401 e identifica o novo socket com o valor atual', async () => {
    server.use(
      http.post('*/api/v1/auth/refresh', () =>
        HttpResponse.json({ accessToken: 'access-renovado', refreshToken: 'refresh-rotacionado' })
      )
    )
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route element={<RootLayout />}>
              <Route index element={<div>Home</div>} />
            </Route>
            <Route path="/login" element={<div>Login</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )

    act(() => {
      FakeWebSocket.instances[0].serverOpen()
      FakeWebSocket.instances[0].serverClose(4401)
    })

    await waitFor(() => expect(FakeWebSocket.instances).toHaveLength(2))
    act(() => FakeWebSocket.instances[1].serverOpen())

    expect(FakeWebSocket.instances[1].sent).toEqual([
      JSON.stringify({ type: 'identify', token: 'access-renovado' })
    ])
    expect(useAuthStore.getState().accessToken).toBe('access-renovado')
    expect(localStorage.getItem('mesmice.refresh')).toBe('refresh-rotacionado')
  })
})
