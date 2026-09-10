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
import type {
  FriendRequest,
  FriendRequestsResponse,
  FriendSummary,
  FriendsResponse,
  IncomingFriendRequest,
  PublicUser,
  CursorPage
} from '../types/api.js';

export type SocialUser = PublicUser;
export type FriendSummaryResponse = FriendSummary;
export type FriendRequestResponse = FriendRequest;
export type IncomingFriendRequestResponse = IncomingFriendRequest;

export interface DirectMessageChannel {
  id: string;
  type: 'DM';
  name: null;
  participantIds: [string, string];
  lastMessageAt: string | null;
  unreadCount?: number;
}

export interface SpaceResponse {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  visibility: 'PUBLIC' | 'PRIVATE';
  template: 'COMMUNITY' | 'FAMILY' | 'TEAM' | 'STUDY' | 'GAMING' | 'EVENT';
  memberCount: number;
  createdAt: string;
}

export interface TextChannelResponse {
  id: string;
  ownerId: string;
  type: 'TEXT';
  spaceId: string;
  name: string;
  description: string | null;
  isPrivate: boolean;
  allowedRoleIds: string[];
  allowedUserIds: string[];
  lastMessageAt: string | null;
  createdAt: string;
}

export interface SpaceListResponse {
  items: SpaceResponse[];
}
export interface SpaceChannelListResponse {
  items: TextChannelResponse[];
}

export interface ConversationListResponse {
  items: DirectMessageChannel[];
}

export interface MessageResponse {
  id: string;
  containerId: string;
  containerType: 'channel';
  authorId: string;
  content: string;
  replyToId: string | null;
  mentions: string[];
  mentionsEveryone: boolean;
  reactions: Array<{ emoji: string; userIds: string[] }>;
  attachments: Array<{
    id: string;
    objectKey: string;
    fileName: string;
    contentType: string;
    size: number;
    width: number | null;
    height: number | null;
  }>;
  pinnedAt: string | null;
  editedAt: string | null;
  createdAt: string;
}

export interface MessagePageResponse {
  items: MessageResponse[];
  meta: { nextCursor: string | null };
}

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

export function resetPassword(payload: PasswordResetPayload): Promise<void> {
  return apiFetch('/auth/reset-password', { method: 'POST', body: payload });
}

export function getMe(): Promise<{ user: PrivateUser }> {
  return apiFetch('/users/me');
}

export function getPublicProfile(userId: string): Promise<{ user: PublicUser }> {
  return apiFetch(`/users/${encodeURIComponent(userId)}`);
}

export interface SearchUsersOptions {
  limit?: number;
  cursor?: string;
}

export function searchUsers(
  query: string,
  options?: SearchUsersOptions
): Promise<CursorPage<PublicUser>> {
  const params = new URLSearchParams({ query });
  if (options?.limit !== undefined) params.set('limit', String(options.limit));
  if (options?.cursor) params.set('cursor', options.cursor);
  return apiFetch(`/users/search?${params.toString()}`);
}

export function getSpaces(): Promise<SpaceListResponse> {
  return apiFetch('/spaces');
}

export function getSpaceChannels(spaceId: string): Promise<SpaceChannelListResponse> {
  return apiFetch(`/spaces/${spaceId}/channels`);
}

export function createTextChannel(
  spaceId: string,
  name: string
): Promise<{ channel: TextChannelResponse }> {
  return apiFetch('/channels', { method: 'POST', body: { type: 'TEXT', spaceId, name } });
}

export function logout(): Promise<void> {
  return apiFetch('/auth/logout', { method: 'POST' });
}

export function getFriends(options?: {
  limit?: number;
  cursor?: string;
}): Promise<FriendsResponse> {
  const params = new URLSearchParams({ limit: String(options?.limit ?? 50) });
  if (options?.cursor) params.set('cursor', options.cursor);
  return apiFetch(`/friends?${params.toString()}`);
}

export function getFriendRequests(): Promise<FriendRequestsResponse> {
  return apiFetch('/friends/requests');
}

export function acceptFriendRequest(requestId: string): Promise<{ friend: FriendSummaryResponse }> {
  return apiFetch(`/friends/requests/${requestId}/accept`, { method: 'POST' });
}

export function sendFriendRequest(addresseeId: string): Promise<
  | { accepted: true; friend: FriendSummaryResponse }
  | { accepted: false; request: FriendRequestResponse }
> {
  return apiFetch('/friends/requests', { method: 'POST', body: { addresseeId } });
}

export function removeFriend(friendId: string): Promise<void> {
  return apiFetch(`/friends/${encodeURIComponent(friendId)}`, { method: 'DELETE' });
}

export function declineFriendRequest(requestId: string): Promise<void> {
  return apiFetch(`/friends/requests/${requestId}/decline`, { method: 'POST' });
}

export function getConversations(limit = 50): Promise<ConversationListResponse> {
  return apiFetch(`/channels?limit=${limit}`);
}

export function createDirectMessage(
  recipientId: string
): Promise<{ channel: DirectMessageChannel }> {
  return apiFetch('/channels', {
    method: 'POST',
    body: { type: 'DM', recipientId }
  });
}

export function getMessages(
  channelId: string,
  options?: { limit?: number; cursor?: string }
): Promise<MessagePageResponse> {
  const params = new URLSearchParams({ limit: String(options?.limit ?? 30) });
  if (options?.cursor) params.set('cursor', options.cursor);
  return apiFetch(`/channels/${channelId}/messages?${params.toString()}`);
}

export function sendMessage(
  channelId: string,
  payload: { content: string; replyToId?: string; nonce?: string }
): Promise<{ message: MessageResponse }> {
  return apiFetch(`/channels/${channelId}/messages`, { method: 'POST', body: payload });
}

export function markChannelRead(
  channelId: string,
  messageId?: string
): Promise<{ lastReadMessageId: string | null }> {
  return apiFetch(`/channels/${channelId}/read`, {
    method: 'POST',
    body: messageId ? { messageId } : {}
  });
}
