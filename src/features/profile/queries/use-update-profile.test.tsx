import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { PropsWithChildren } from 'react'
import { describe, expect, it } from 'vitest'
import { MOCK_USER } from '../../../mocks/test-handlers.js'
import { server } from '../../../mocks/node.js'
import { useAuthStore } from '../../../stores/auth-store.js'
import type { UpdateProfilePayload } from '../api/profile-endpoints.js'
import { profileKeys } from '../api/profile-query-keys.js'
import { useUpdateProfile } from './use-update-profile.js'

function setupMutation() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } }
  })
  queryClient.setQueryData(profileKeys.me(), MOCK_USER)
  useAuthStore.getState().setSession('profile-access', MOCK_USER)

  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  const mutation = renderHook(() => useUpdateProfile(), { wrapper })
  return { mutation, queryClient }
}

describe('useUpdateProfile', () => {
  it('envia somente o payload parcial para PATCH /users/me e atualiza o cache canônico', async () => {
    let receivedBody: unknown
    const canonicalUser = { ...MOCK_USER, displayName: 'Maria Atualizada', bio: 'Nova bio' }
    server.use(
      http.patch('*/api/v1/users/me', async ({ request }) => {
        receivedBody = await request.json()
        return HttpResponse.json({ user: canonicalUser })
      })
    )
    const { mutation, queryClient } = setupMutation()
    const payload: UpdateProfilePayload = { displayName: 'Maria Atualizada', bio: 'Nova bio' }

    await act(async () => mutation.result.current.mutateAsync(payload))

    expect(receivedBody).toEqual(payload)
    expect(queryClient.getQueryData(profileKeys.me())).toEqual(canonicalUser)
  })

  it('preserva o snapshot anterior quando a mutation falha', async () => {
    server.use(
      http.patch('*/api/v1/users/me', () =>
        HttpResponse.json({ error: { code: 'INTERNAL', message: 'Falha.' } }, { status: 500 })
      )
    )
    const { mutation, queryClient } = setupMutation()

    act(() => mutation.result.current.mutate({ bio: 'Não deve entrar no cache' }))
    await waitFor(() => expect(mutation.result.current.isError).toBe(true))

    expect(queryClient.getQueryData(profileKeys.me())).toEqual(MOCK_USER)
  })

  it('aceita username como campo opcional do payload', () => {
    const accepted: UpdateProfilePayload = { bio: null, presence: 'idle', username: 'novo_username' }

    expect(accepted).toEqual({ bio: null, presence: 'idle', username: 'novo_username' })
  })
})
