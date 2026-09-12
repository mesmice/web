import type { ComputedPresence, PrivateUser, PublicUser, TokenPair } from './auth.js';
import type { ConversationSummary } from './conversations.js';
export type { ComputedPresence, PrivateUser, PublicUser, UserPresence } from './auth.js';

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'EMAIL_TAKEN'
  | 'USERNAME_TAKEN'
  | 'INVALID_CREDENTIALS'
  | 'ACCOUNT_LOCKED'
  | 'EMAIL_NOT_VERIFIED'
  | 'TOKEN_INVALID'
  | 'SESSION_EXPIRED'
  | 'SESSION_REVOKED'
  | 'PAYLOAD_TOO_LARGE'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'RATE_LIMITED'
  | 'MAINTENANCE'
  | 'INTERNAL';

export interface ErrorEnvelope {
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type PresenceStatus = ComputedPresence;

export interface UserSummary {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  presence: PresenceStatus;
}

export interface CursorPageMeta {
  nextCursor: string | null;
}

export interface CursorPage<T> {
  items: T[];
  meta: CursorPageMeta;
}

export interface FriendRequest {
  id: string;
  requesterId: string;
  addresseeId: string;
  createdAt: string;
}

export interface FriendSummary {
  user: PublicUser;
  since: string;
}

export interface IncomingFriendRequest {
  request: FriendRequest;
  requester: PublicUser;
}

export type FriendsResponse = CursorPage<FriendSummary>;

export interface FriendRequestsResponse {
  items: IncomingFriendRequest[];
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
  sent: true;
}

export type ServerMessage =
  | { type: 'pong'; sentAt?: number }
  | { type: 'ready'; userId: string }
  | {
      type: 'conversation.created';
      payload: ConversationSummary;
    }
  | {
      type: 'message.created';
      payload: {
        id: string;
        containerId: string;
        containerType: 'conversation' | 'channel';
        authorId: string;
        content: string;
        createdAt: string;
        mentions: string[];
        mentionsEveryone: boolean;
        attachments: Array<{
          id: string;
          objectKey: string;
          fileName: string;
          contentType: string;
          size: number;
          width: number | null;
          height: number | null;
        }>;
        notify: boolean;
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
  | { type: 'session.revoked'; payload: { sessionId: string } }
  | {
      type: 'channel.created';
      payload: {
        spaceId: string;
        channelId: string;
        channelType: 'TEXT' | 'CATEGORY' | 'VOICE';
        name: string | null;
      };
    }
  | { type: 'channel.deleted'; payload: { spaceId: string; channelId: string } };

export type ClientMessage = { type: 'ping'; sentAt?: number } | { type: 'identify'; token: string };

export const GATEWAY_PATH = '/gateway';
export const HEARTBEAT_INTERVAL_MS = 30_000;

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
