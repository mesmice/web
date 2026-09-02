import type { PrivateUser, TokenPair } from './auth.js';

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

export type PresenceStatus = 'online' | 'idle' | 'dnd' | 'invisible' | 'offline';

export type PublicUser = Omit<PrivateUser, 'email' | 'emailVerified' | 'presence'> & {
  presence: PresenceStatus;
};

export interface UserSummary {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  presence: PresenceStatus;
}

export interface ReadinessReport {
  status: 'ok' | 'degraded';
  checks: Array<{ name: 'mongo' | 'redis'; ok: boolean }>;
}

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  username: string;
  displayName?: string;
  password: string;
}

export interface AuthSession extends TokenPair {
  user: PrivateUser;
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
  | { type: 'ready'; userId: string }
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
        createdAt: string;
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
    }
  | {
      type: 'friend.request';
      payload: { requestId: string; requester: UserSummary; createdAt: string };
    }
  | {
      type: 'friend.accept';
      payload: { userId: string; user: UserSummary; since: string };
    }
  | {
      type: 'friend.remove';
      payload: { userId: string; user: UserSummary };
    }
  | { type: 'user.update'; payload: { user: PublicUser } }
  | { type: 'session.revoked'; payload: { sessionId: string } };

export type ClientMessage = { type: 'ping'; sentAt?: number } | { type: 'identify'; token: string };

export const GATEWAY_PATH = '/gateway';

/**
 * Códigos de fechamento do gateway, espelhando `WS_CLOSE_CODES`
 * de @mesmice/contracts.
 */
export const WS_CLOSE_CODES = {
  INVALID_JSON: 4400,
  UNAUTHORIZED: 4401,
  SESSION_REVOKED: 4402,
  IDENTIFY_TIMEOUT: 4403
} as const;
