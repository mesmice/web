import { fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ForgotPasswordPage, ResetPasswordPage } from './password-recovery-page.js'

describe('password recovery', () => {
  function renderPage(children: React.ReactNode, initialEntries?: string[]) {
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>
        <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
      </QueryClientProvider>
    )
  }

  it('aceita apenas e-mail ou username como identificador', () => {
    renderPage(<ForgotPasswordPage />)

    expect(screen.getByLabelText('E-mail ou username')).toBeDefined()
    expect(screen.queryByText(/telefone/i)).toBeNull()
  })

  it('rejeita senha com 9 caracteres e aceita senha com 10', () => {
    renderPage(<ResetPasswordPage />, ['/reset-password?token=valid-token'])

    const password = screen.getByLabelText('Nova senha')
    const confirmation = screen.getByLabelText('Confirmar nova senha')
    fireEvent.change(password, { target: { value: '123456789' } })
    fireEvent.change(confirmation, { target: { value: '123456789' } })
    fireEvent.submit(password.closest('form')!)
    expect(screen.getByText('A senha precisa ter pelo menos 10 caracteres.')).toBeDefined()

    fireEvent.change(password, { target: { value: '1234567890' } })
    fireEvent.change(confirmation, { target: { value: '1234567890' } })
    expect(screen.queryByText('A senha precisa ter pelo menos 10 caracteres.')).toBeNull()
  })
})
