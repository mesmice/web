import { apiFetch } from './client.js';
import type {
  AuthSession,
  LoginPayload,
  PasswordResetPayload,
  PasswordResetRequestPayload,
  PasswordResetRequestResponse,
  ReadinessReport,
  RegisterPayload
} from '../types/api.js';
import type { PrivateUser } from '../types/auth.js';

export function getLiveness(): Promise<{ status: 'ok' }> {
  return apiFetch('/health/live');
}

export function getReadiness(): Promise<ReadinessReport> {
  return apiFetch('/health/ready');
}

export function login(payload: LoginPayload): Promise<AuthSession> {
  return apiFetch('/auth/login', { method: 'POST', body: payload });
}

export function register(payload: RegisterPayload): Promise<AuthSession> {
  return apiFetch('/auth/register', { method: 'POST', body: payload });
}

export function requestPasswordReset(
  payload: PasswordResetRequestPayload
): Promise<PasswordResetRequestResponse> {
  return apiFetch('/auth/forgot-password', { method: 'POST', body: payload });
}

export function resetPassword(
  payload: PasswordResetPayload
): Promise<PasswordResetRequestResponse> {
  return apiFetch('/auth/reset-password', { method: 'POST', body: payload });
}

export function getMe(): Promise<{ user: PrivateUser }> {
  return apiFetch('/users/me');
}

export function logout(): Promise<void> {
  return apiFetch('/auth/logout', { method: 'POST' });
}
