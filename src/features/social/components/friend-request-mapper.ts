import type { FriendRequestItem, FriendRequestStatus } from './friend-requests.js';

interface FriendRequestApiShape {
  id?: string | number | null;
  userId?: string | null;
  displayName?: string | null;
  name?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  status?: FriendRequestStatus | string | null;
  mutualFriends?: number | null;
  message?: string | null;
  requestedAtLabel?: string | null;
  accentColor?: string | null;
}

function safeStatus(value?: FriendRequestStatus | string | null): FriendRequestStatus {
  if (value === 'pending' || value === 'accepted' || value === 'declined') return value;
  return 'pending';
}

export function mapFriendRequestFromApi(raw: FriendRequestApiShape): FriendRequestItem {
  const displayName = raw.displayName ?? raw.name ?? 'Nova solicitação';

  return {
    id: String(raw.id ?? displayName),
    userId: raw.userId ?? undefined,
    displayName,
    username: raw.username ?? null,
    avatarUrl: raw.avatarUrl ?? null,
    status: safeStatus(raw.status),
    mutualFriends: raw.mutualFriends ?? null,
    message: raw.message ?? null,
    requestedAtLabel: raw.requestedAtLabel ?? null,
    accentColor: raw.accentColor ?? null
  };
}
