import { expect, describe, it } from 'vitest'
import { ApiRequestError, apiFetch } from '../lib/api/client.js'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/node.js'

describe('apiFetch', () => {
  it('retorna JSON em respostas 2xx', async () => {
    const result = await apiFetch<{ status: string }>('/health/live')
    expect(result).toEqual({ status: 'ok' })
  })

  it('lança ApiRequestError com envelope em erros da API', async () => {
    server.use(
      http.get('*/api/v1/health/live', () =>
        HttpResponse.json(
          { error: { code: 'RATE_LIMITED', message: 'Muitas requisições.' } },
          { status: 429 }
        )
      )
    )

    try {
      await apiFetch('/health/live')
      expect.unreachable()
    } catch (err) {
      expect(err).toBeInstanceOf(ApiRequestError)
      const error = err as ApiRequestError
      expect(error.status).toBe(429)
      expect(error.code).toBe('RATE_LIMITED')
      expect(error.message).toBe('Muitas requisições.')
    }
  })

  it('não vaza corpo inesperado em erro sem envelope', async () => {
    server.use(http.get('*/api/v1/health/live', () => new HttpResponse(null, { status: 500 })))

    try {
      await apiFetch('/health/live')
      expect.unreachable()
    } catch (err) {
      const error = err as ApiRequestError
      expect(error.code).toBe('INTERNAL')
      expect(error.message).not.toMatch(/stack/i)
    }
  })
})
