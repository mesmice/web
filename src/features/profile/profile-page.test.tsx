import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { delay, http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { server } from '../../mocks/node.js'
import { MOCK_USER } from '../../mocks/test-handlers.js'
import { ProfilePage } from './profile-page.js'
import { profileKeys } from './api/profile-query-keys.js'

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
    expect(queryClient.getQueryCache().find({ queryKey: profileKeys.me() })).toBeDefined()
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
    expect(document.querySelector<HTMLImageElement>('.profile-header__banner-image')?.src).toBe(
      'https://cdn.example.com/banner.png'
    )
  })

  it('trata campos opcionais ausentes sem quebrar a composição', async () => {
    server.use(http.get('*/api/v1/users/me', () => HttpResponse.json({ user: MOCK_USER })))
    renderProfile()

    await screen.findByRole('heading', { level: 1, name: 'Maria Souza' })
    expect(screen.getByLabelText('Avatar de Maria Souza').textContent).toBe('M')
    expect(screen.getByText('Nenhuma bio adicionada.')).toBeDefined()
    expect(screen.getByText('Nenhum link adicionado.')).toBeDefined()
    expect(screen.queryByRole('img')).toBeNull()
    expect(document.querySelector('.profile-header__banner')).not.toBeNull()
    expect(document.querySelector('.profile-header__banner-image')).toBeNull()
  })

  it.each([null, '', '   '])('mostra o fallback quando a bio é %j', async (bio) => {
    server.use(
      http.get('*/api/v1/users/me', () =>
        HttpResponse.json({ user: { ...MOCK_USER, bio } })
      )
    )
    renderProfile()

    expect(await screen.findByText('Nenhuma bio adicionada.')).toBeDefined()
  })

  it('mostra o conteúdo de uma bio real', async () => {
    server.use(
      http.get('*/api/v1/users/me', () =>
        HttpResponse.json({ user: { ...MOCK_USER, bio: '  Uma bio real.  ' } })
      )
    )
    renderProfile()

    expect(await screen.findByText('Uma bio real.')).toBeDefined()
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

  it('edita o nome de exibição via PATCH /users/me mantendo o username', async () => {
    let receivedBody: unknown
    const updatedUser = { ...MOCK_USER, displayName: 'Lidia Check' }
    server.use(
      http.get('*/api/v1/users/me', () => HttpResponse.json({ user: MOCK_USER })),
      http.patch('*/api/v1/users/me', async ({ request }) => {
        receivedBody = await request.json()
        return HttpResponse.json({ user: updatedUser })
      })
    )
    renderProfile()
    await screen.findByRole('heading', { level: 1, name: 'Maria Souza' })

    fireEvent.click(screen.getByRole('button', { name: 'Editar perfil' }))
    const nameInput = screen.getByLabelText('Nome de exibição') as HTMLInputElement
    const usernameInput = screen.getByLabelText('Username') as HTMLInputElement

    expect(usernameInput.value).toBe('maria')

    fireEvent.change(nameInput, { target: { value: 'Lidia Check' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Lidia Check' })).toBeDefined()
    expect(receivedBody).toEqual({ displayName: 'Lidia Check' })
    expect(screen.getByText('@maria')).toBeDefined()
    expect(screen.queryByRole('button', { name: 'Cancelar' })).toBeNull()
  })

  it('edita o username via PATCH /users/me após confirmar disponibilidade', async () => {
    let receivedBody: unknown
    const updatedUser = { ...MOCK_USER, username: 'lidia_check' }
    server.use(
      http.get('*/api/v1/users/me', () => HttpResponse.json({ user: MOCK_USER })),
      http.get('*/api/v1/users/username-available', ({ request }) => {
        const value = new URL(request.url).searchParams.get('value')
        return HttpResponse.json({ available: value === 'lidia_check' })
      }),
      http.patch('*/api/v1/users/me', async ({ request }) => {
        receivedBody = await request.json()
        return HttpResponse.json({ user: updatedUser })
      })
    )
    renderProfile()
    await screen.findByRole('heading', { level: 1, name: 'Maria Souza' })

    fireEvent.click(screen.getByRole('button', { name: 'Editar perfil' }))
    const usernameInput = screen.getByLabelText('Username') as HTMLInputElement

    fireEvent.change(usernameInput, { target: { value: 'lidia_check' } })
    await screen.findByText('Username disponível!')

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    await screen.findByText('@lidia_check')
    expect(receivedBody).toEqual({ username: 'lidia_check' })
  })

  it('bloqueia o envio quando o username já está em uso', async () => {
    server.use(
      http.get('*/api/v1/users/me', () => HttpResponse.json({ user: MOCK_USER })),
      http.get('*/api/v1/users/username-available', () => HttpResponse.json({ available: false }))
    )
    renderProfile()
    await screen.findByRole('heading', { level: 1, name: 'Maria Souza' })

    fireEvent.click(screen.getByRole('button', { name: 'Editar perfil' }))
    const usernameInput = screen.getByLabelText('Username') as HTMLInputElement

    fireEvent.change(usernameInput, { target: { value: 'ocupado' } })
    await screen.findByText('Este username já está em uso.')

    expect((screen.getByRole('button', { name: 'Salvar' }) as HTMLButtonElement).disabled).toBe(
      true
    )
  })
})
