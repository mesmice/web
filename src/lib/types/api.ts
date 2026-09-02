export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL';

export interface ErrorEnvelope {
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type PresenceStatus = 'online' | 'idle' | 'do_not_disturb' | 'offline';

export interface ReadinessReport {
  status: 'ok' | 'degraded';
  checks: Array<{ name: 'mongo' | 'redis'; ok: boolean }>;
}

export interface LoginPayload {
  identifier: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterPayload {
  email: string;
  username: string;
  displayName?: string;
  password: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  user: {
    id: string;
    name: string;
    username: string;
  };
}

export interface PasswordResetRequestPayload {
  identifier: string;
}

export interface PasswordResetPayload {
  token: string;
  password: string;
}

export interface PasswordResetRequestResponse {
  message: string;
}

export type ServerMessage =
  | { type: 'pong'; sentAt?: number }
  | { type: 'ready'; userId: string | null }
  | {
      type: 'message.created';
      payload: {
        id: string;
        containerId: string;
        containerType: 'conversation' | 'channel';
        authorId: string;
        content: string;
        createdAt: string;
      };
    }
  | {
      type: 'message.updated';
      payload: {
        id: string;
        containerId: string;
        containerType: 'conversation' | 'channel';
        authorId: string;
        content: string;
        editedAt: string;
      };
    }
  | {
      type: 'message.deleted';
      payload: { id: string; containerId: string; containerType: 'conversation' | 'channel' };
    }
  | {
      type: 'presence.update';
      payload: { userId: string; status: PresenceStatus };
    };

export type ClientMessage = { type: 'ping'; sentAt?: number } | { type: 'identify'; token: string };

export const GATEWAY_PATH = '/gateway';

/**
 * Close code enviado pelo gateway ao revogar a sessão
 * (espelha `WS_CLOSE_CODES.SESSION_REVOKED` de @mesmice/contracts).
 */
export const WS_SESSION_REVOKED_CLOSE_CODE = 4402;
