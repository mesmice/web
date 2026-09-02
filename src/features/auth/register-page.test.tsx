import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { getSavedRefreshToken } from '../../lib/auth/session-persistence.js'
import { server } from '../../mocks/node.js'
import { MOCK_USER } from '../../mocks/test-handlers.js'
import { useAuthStore } from '../../stores/auth-store.js'
import { RegisterPage } from './register-page.js'

function renderRegister() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } }
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/register']}>
        <RegisterPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

function completeRegistrationForm() {
  fireEvent.change(screen.getByLabelText('Como podemos chamar você?'), {
    target: { value: ' Maria Souza ' }
  })
  fireEvent.change(screen.getByLabelText('Nome de usuário'), {
    target: { value: 'Maria' }
  })
  fireEvent.change(screen.getByLabelText('Seu melhor e-mail'), {
    target: { value: ' maria@example.com ' }
  })
  fireEvent.change(screen.getByLabelText('Crie uma senha'), {
    target: { value: 'senha-super-segura' }
  })
  fireEvent.change(screen.getByLabelText('Confirme sua senha'), {
    target: { value: 'senha-super-segura' }
  })
  fireEvent.click(
    screen.getByRole('checkbox', {
      name: 'Concordo com os termos de uso e a política de privacidade.'
    })
  )
  fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }))

  fireEvent.change(screen.getByLabelText('Dia de nascimento'), { target: { value: '01' } })
  fireEvent.change(screen.getByLabelText('Mês de nascimento'), { target: { value: '01' } })
  fireEvent.change(screen.getByLabelText('Ano de nascimento'), { target: { value: '2000' } })
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
}

beforeEach(() => {
  cleanup()
  localStorage.clear()
  useAuthStore.setState({ status: 'anonymous', accessToken: null, user: null, sessionEnd: null })
})

describe('RegisterPage', () => {
  it('envia somente o contrato da API e aplica a sessão canônica após o cadastro', async () => {
    let requestBody: unknown
    server.use(
      http.post('*/api/v1/auth/register', async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({
          user: MOCK_USER,
          accessToken: 'register-access',
          refreshToken: 'register-refresh'
        })
      })
    )
    renderRegister()
    completeRegistrationForm()

    fireEvent.click(screen.getByRole('button', { name: 'Criar meu perfil' }))

    await screen.findByText('Seu perfil está pronto!')
    expect(requestBody).toEqual({
      email: 'maria@example.com',
      username: 'maria',
      displayName: 'Maria Souza',
      password: 'senha-super-segura'
    })
    expect(useAuthStore.getState()).toMatchObject({
      status: 'authenticated',
      accessToken: 'register-access',
      user: MOCK_USER
    })
    expect(getSavedRefreshToken()).toBe('register-refresh')
  })

  it('mantém o formulário após erro e permite tentar novamente', async () => {
    let attempts = 0
    server.use(
      http.post('*/api/v1/auth/register', () => {
        attempts += 1
        if (attempts === 1) {
          return HttpResponse.json(
            { error: { code: 'CONFLICT', message: 'Nome de usuário já está em uso.' } },
            { status: 409 }
          )
        }
        return HttpResponse.json({
          user: MOCK_USER,
          accessToken: 'retry-access',
          refreshToken: 'retry-refresh'
        })
      })
    )
    renderRegister()
    completeRegistrationForm()

    fireEvent.click(screen.getByRole('button', { name: 'Criar meu perfil' }))
    await screen.findByText('Nome de usuário já está em uso.')

    expect(useAuthStore.getState().status).toBe('anonymous')
    fireEvent.click(screen.getByRole('button', { name: 'Criar meu perfil' }))

    await screen.findByText('Seu perfil está pronto!')
    await waitFor(() => expect(useAuthStore.getState().status).toBe('authenticated'))
    expect(attempts).toBe(2)
  })
})
