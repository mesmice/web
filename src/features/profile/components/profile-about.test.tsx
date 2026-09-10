import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProfileAbout } from './profile-about.js'

afterEach(() => { cleanup(); vi.useRealTimers() })

describe('ProfileAbout', () => {
  it('limita a bio ao contrato de 190 caracteres', () => {
    render(<ProfileAbout bio={null} isOwner onSave={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /Nenhuma bio adicionada/i }))

    const textarea = screen.getByRole('textbox', { name: 'Bio' })
    fireEvent.change(textarea, { target: { value: 'a'.repeat(240) } })

    expect((textarea as HTMLTextAreaElement).value).toBe('a'.repeat(190))
    expect(screen.getByText('190/190')).toBeDefined()
  })

  it('envia null quando a bio é esvaziada', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(<ProfileAbout bio="Bio existente" isOwner onSave={onSave} />)
    fireEvent.click(screen.getByRole('button', { name: /Bio existente/i }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Bio' }), { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar bio' }))

    await waitFor(() => expect(onSave).toHaveBeenCalledWith(null))
    expect(screen.queryByRole('textbox', { name: 'Bio' })).toBeNull()
  })

  it('desabilita ações enquanto o salvamento está pendente', async () => {
    let resolveSave!: () => void
    const onSave = vi.fn(() => new Promise<void>((resolve) => { resolveSave = resolve }))
    render(<ProfileAbout bio="Bio existente" isOwner onSave={onSave} />)
    fireEvent.click(screen.getByRole('button', { name: /Bio existente/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Salvar bio' }))

    expect(screen.getByRole('button', { name: 'Salvar bio' }).textContent).toContain('Salvando...')
    expect(screen.getByRole('button', { name: 'Salvar bio' }).hasAttribute('disabled')).toBe(true)
    expect(screen.getByRole('button', { name: 'Cancelar' }).hasAttribute('disabled')).toBe(true)
    resolveSave()
    await waitFor(() => expect(screen.queryByRole('textbox', { name: 'Bio' })).toBeNull())
  })

  it('mostra feedback acessível por cinco segundos e reinicia o timer', async () => {
    vi.useFakeTimers()
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(<ProfileAbout bio="Bio existente" isOwner onSave={onSave} />)
    fireEvent.click(screen.getByRole('button', { name: /Bio existente/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Salvar bio' }))
    await vi.waitFor(() => expect(screen.getByRole('status').textContent).toContain('Bio salva'))
    act(() => vi.advanceTimersByTime(5000))
    expect(screen.queryByRole('status')).toBeNull()
  })
})
