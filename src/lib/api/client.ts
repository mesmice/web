import type { ErrorEnvelope } from '../types/api.js'

export class ApiRequestError extends Error {
  readonly code: string
  readonly status: number
  readonly details?: Record<string, unknown>

  constructor(status: number, code: string, message: string, details?: Record<string, unknown>) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.code = code
    this.details = details
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal } = options

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal
    })
  } catch (cause) {
    throw new ApiRequestError(0, 'NETWORK_ERROR', 'Falha de conexão com a API.', {
      cause: String(cause)
    })
  }

  if (!response.ok) {
    let envelope: ErrorEnvelope
    try {
      envelope = (await response.json()) as ErrorEnvelope
    } catch {
      throw new ApiRequestError(response.status, 'INTERNAL', `Erro HTTP ${response.status}.`)
    }
    if (envelope?.error) {
      throw new ApiRequestError(
        response.status,
        envelope.error.code,
        envelope.error.message,
        envelope.error.details
      )
    }
    throw new ApiRequestError(response.status, 'INTERNAL', `Erro HTTP ${response.status}.`)
  }

  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}
