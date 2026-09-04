import type { FriendListItem, FriendStatus } from './friend-list.js';

interface FriendApiShape {
  id?: string | number | null;
  displayName?: string | null;
  name?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  status?: FriendStatus | string | null;
  bio?: string | null;
  mutualFriends?: number | null;
  isFollowing?: boolean | null;
  lastActiveLabel?: string | null;
  accentColor?: string | null;
}

function safeStatus(status?: FriendStatus | string | null): FriendStatus {
  if (status === 'online' || status === 'away' || status === 'busy' || status === 'offline') {
    return status;
  }

  return 'offline';
}

export function mapFriendFromApi(rawFriend: FriendApiShape): FriendListItem {
  const displayName = rawFriend.displayName ?? rawFriend.name ?? 'Amigo';

  return {
    id: String(rawFriend.id ?? displayName),
    displayName,
    username: rawFriend.username ?? null,
    avatarUrl: rawFriend.avatarUrl ?? null,
    status: safeStatus(rawFriend.status),
    bio: rawFriend.bio ?? null,
    mutualFriends: rawFriend.mutualFriends ?? null,
    isFollowing: rawFriend.isFollowing ?? false,
    lastActiveLabel: rawFriend.lastActiveLabel ?? null,
    accentColor: rawFriend.accentColor ?? null
  };
}
