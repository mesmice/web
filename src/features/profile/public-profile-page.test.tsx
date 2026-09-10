import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { MOCK_USER } from '../../mocks/test-handlers.js'
import { server } from '../../mocks/node.js'
import { profileKeys } from './api/profile-query-keys.js'
import { PublicProfilePage } from './profile-page.js'

afterEach(() => cleanup())

function renderPage(userId = 'public-user') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <PublicProfilePage userId={userId} />
    </QueryClientProvider>
  )
  return queryClient
}

describe('PublicProfilePage', () => {
  it('loads GET /users/:userId into profileKeys.public and renders read-only data', async () => {
    const publicUser = {
      ...MOCK_USER,
      id: 'public-user',
      displayName: 'Utilizador Público',
      username: 'publico',
      presence: 'offline' as const,
      bio: null,
      avatarFrameUrl: 'https://cdn.example.com/frame.png',
      externalLinks: [{ label: 'Site', url: 'https://example.com' }]
    }
    server.use(
      http.get('*/api/v1/users/public-user', () => HttpResponse.json({ user: publicUser }))
    )
    const queryClient = renderPage()

    expect(await screen.findByRole('heading', { name: 'Utilizador Público' })).toBeDefined()
    expect(screen.getByText('@publico')).toBeDefined()
    expect(screen.getByText('Sem bio no momento.')).toBeDefined()
    expect(screen.getByRole('link', { name: /Site/ })).toBeDefined()
    expect(screen.getByLabelText('Presença: offline')).toBeDefined()
    expect(screen.queryByText('Personalizar perfil')).toBeNull()
    expect(screen.queryByRole('button', { name: /Alterar avatar|Alterar banner|Salvar bio/ })).toBeNull()
    expect(queryClient.getQueryData(profileKeys.public('public-user'))).toEqual(publicUser)
  })

  it('renders loading and recovers from a transient error with retry', async () => {
    let attempts = 0
    server.use(
      http.get('*/api/v1/users/retry-user', () => {
        attempts += 1
        return attempts === 1
          ? HttpResponse.json({ error: { code: 'INTERNAL', message: 'Falha.' } }, { status: 500 })
          : HttpResponse.json({ user: { ...MOCK_USER, id: 'retry-user', displayName: 'Recuperado' } })
      })
    )
    renderPage('retry-user')

    expect(await screen.findByRole('heading', { name: 'Não foi possível carregar o perfil' })).toBeDefined()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeDefined())
    screen.getByRole('button', { name: 'Tentar novamente' }).click()
    expect(await screen.findByRole('heading', { name: 'Recuperado' })).toBeDefined()
  })

  it('renders a dedicated not-found state for 404', async () => {
    server.use(
      http.get('*/api/v1/users/missing-user', () =>
        HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Não encontrado.' } }, { status: 404 })
      )
    )
    renderPage('missing-user')

    expect(await screen.findByRole('heading', { name: 'Perfil não encontrado' })).toBeDefined()
    expect(screen.getByText(/não existe ou não está disponível/i)).toBeDefined()
  })
})
