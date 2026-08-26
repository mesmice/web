import type { ErrorEnvelope } from '../types/api.js';
import { isAuthErrorCode, type TokenPair } from '../types/auth.js';
import { useAuthStore } from '../../stores/auth-store.js';
import {
  clearPersistedSession,
  getSavedRefreshToken,
  saveRefreshToken
} from '../auth/session-persistence.js';

export class ApiRequestError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(status: number, code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
};

const AUTH_BYPASS_PATHS = new Set([
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/logout'
]);
let refreshInFlight: Promise<boolean> | null = null;

export function refreshSession(): Promise<boolean> {
  refreshInFlight ??= performRefresh().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

async function performRefresh(): Promise<boolean> {
  const refreshToken = getSavedRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    if (!response.ok) return false;

    const pair = (await response.json()) as TokenPair;
    saveRefreshToken(pair.refreshToken);
    useAuthStore.getState().setAccessToken(pair.accessToken);
    return true;
  } catch {
    return false;
  }
}

function handleDeadSession(code: string): void {
  clearPersistedSession();
  const { status, clearSession } = useAuthStore.getState();
  if (status === 'anonymous') return;
  clearSession(code === 'SESSION_REVOKED' ? 'revoked' : 'expired');
}

async function parseErrorResponse(response: Response): Promise<ApiRequestError> {
  try {
    const envelope = (await response.json()) as ErrorEnvelope;
    if (envelope?.error) {
      return new ApiRequestError(
        response.status,
        envelope.error.code,
        envelope.error.message,
        envelope.error.details
      );
    }
  } catch {
    // corpo não-JSON ou vazio — cai no fallback abaixo
  }

  return new ApiRequestError(response.status, 'INTERNAL', `Erro HTTP ${response.status}.`);
}

async function execute(path: string, options: RequestOptions): Promise<Response> {
  const { method = 'GET', body, signal } = options;
  const accessToken = useAuthStore.getState().accessToken;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  try {
    return await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: 'include',
      signal
    });
  } catch (cause) {
    throw new ApiRequestError(0, 'NETWORK_ERROR', 'Falha de conexão com a API.', {
      cause: String(cause)
    });
  }
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response = await execute(path, options);

  if (response.status === 401 && !AUTH_BYPASS_PATHS.has(path)) {
    const initialError = await parseErrorResponse(response);

    if (!(await refreshSession())) {
      handleDeadSession(initialError.code);
      throw initialError;
    }

    response = await execute(path, options);
    if (response.status === 401) {
      const retriedError = await parseErrorResponse(response);
      if (isAuthErrorCode(retriedError.code)) handleDeadSession(retriedError.code);
      throw retriedError;
    }
  }

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }
  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
