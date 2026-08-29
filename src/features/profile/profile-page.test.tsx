import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { delay, http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { server } from '../../mocks/node.js'
import { MOCK_USER } from '../../mocks/test-handlers.js'
import { ProfilePage } from './profile-page.js'
import { profileQueryKeys } from './queries/use-my-profile.js'

function renderProfile(): QueryClient {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })
  render(
    <QueryClientProvider client={queryClient}>
      <ProfilePage />
    </QueryClientProvider>
  )
  return queryClient
}

beforeEach(() => cleanup())

describe('ProfilePage', () => {
  it('usa a query key estável e mostra loading enquanto busca o perfil', () => {
    server.use(
      http.get('*/api/v1/users/me', async () => {
        await delay('infinite')
        return HttpResponse.json({ user: MOCK_USER })
      })
    )

    const queryClient = renderProfile()

    expect(screen.getByRole('status', { name: 'Carregando perfil' })).toBeDefined()
    expect(queryClient.getQueryCache().find({ queryKey: profileQueryKeys.me() })).toBeDefined()
  })

  it('compõe header, identidade, bio e links com os dados do usuário', async () => {
    server.use(
      http.get('*/api/v1/users/me', () =>
        HttpResponse.json({
          user: {
            ...MOCK_USER,
            bio: 'Construindo comunidades com cuidado.',
            avatarUrl: 'https://cdn.example.com/avatar.png',
            bannerUrl: 'https://cdn.example.com/banner.png',
            externalLinks: [{ label: 'Site pessoal', url: 'https://example.com' }]
          }
        })
      )
    )
    renderProfile()

    expect(await screen.findByRole('heading', { level: 1, name: 'Maria Souza' })).toBeDefined()
    expect(screen.getByText('@maria')).toBeDefined()
    expect(screen.getByRole('heading', { name: 'Sobre' })).toBeDefined()
    expect(screen.getByText('Construindo comunidades com cuidado.')).toBeDefined()
    expect(screen.getByRole('heading', { name: 'Links' })).toBeDefined()
    expect(screen.getByRole('link', { name: 'Site pessoal' })).toBeDefined()
    expect(screen.getByRole('img', { name: 'Avatar de Maria Souza' })).toBeDefined()
  })

  it('trata campos opcionais ausentes sem quebrar a composição', async () => {
    server.use(http.get('*/api/v1/users/me', () => HttpResponse.json({ user: MOCK_USER })))
    renderProfile()

    await screen.findByRole('heading', { level: 1, name: 'Maria Souza' })
    expect(screen.getByLabelText('Avatar de Maria Souza').textContent).toBe('M')
    expect(screen.getByText('Nenhuma bio adicionada.')).toBeDefined()
    expect(screen.getByText('Nenhum link adicionado.')).toBeDefined()
    expect(screen.queryByRole('img')).toBeNull()
  })

  it('mostra erro e refaz apenas a query ao tentar novamente', async () => {
    let requests = 0
    server.use(
      http.get('*/api/v1/users/me', () => {
        requests += 1
        if (requests === 1) {
          return HttpResponse.json(
            { error: { code: 'INTERNAL', message: 'Falha temporária.' } },
            { status: 500 }
          )
        }
        return HttpResponse.json({ user: MOCK_USER })
      })
    )
    renderProfile()

    const retryButton = await screen.findByRole('button', { name: 'Tentar novamente' })
    fireEvent.click(retryButton)

    expect(await screen.findByRole('heading', { level: 1, name: 'Maria Souza' })).toBeDefined()
    expect(requests).toBe(2)
  })
})
