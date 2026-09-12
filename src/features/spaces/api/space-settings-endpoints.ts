import { apiFetch } from '../../../lib/api/client.js';
import type { TextChannelResponse } from '../../../lib/api/endpoints.js';

export type SpaceMemberRole = 'OWNER' | 'ADMIN' | 'MOD' | 'MEMBER';

export interface SpaceMemberResponse {
  userId: string;
  role: SpaceMemberRole;
  roleIds: string[];
  nickname: string | null;
  timeoutUntil: string | null;
  joinedAt: string;
}

export interface SpaceRoleResponse {
  id: string;
  spaceId: string;
  name: string;
  permissions: string;
  position: number;
  createdAt: string;
}

export interface SpaceRoleInput {
  name: string;
  permissions?: string;
  position?: number;
}

export interface ChannelPermissionsInput {
  roleOverwrites: Array<{ roleId: string; allow: string; deny: string }>;
  memberOverwrites: Array<{ userId: string; allow: string; deny: string }>;
  isPrivate?: boolean;
  allowedRoleIds?: string[];
  allowedUserIds?: string[];
}

export function getSpaceMembers(spaceId: string): Promise<{ items: SpaceMemberResponse[] }> {
  return apiFetch(`/spaces/${encodeURIComponent(spaceId)}/members`);
}

export function updateMySpaceNickname(
  spaceId: string,
  nickname: string | null
): Promise<SpaceMemberResponse> {
  return apiFetch(`/spaces/${encodeURIComponent(spaceId)}/members/me`, {
    method: 'PATCH',
    body: { nickname }
  });
}

export function getSpaceRoles(spaceId: string): Promise<{ items: SpaceRoleResponse[] }> {
  return apiFetch(`/spaces/${encodeURIComponent(spaceId)}/roles`);
}

export function createSpaceRole(
  spaceId: string,
  input: SpaceRoleInput
): Promise<{ role: SpaceRoleResponse }> {
  return apiFetch(`/spaces/${encodeURIComponent(spaceId)}/roles`, {
    method: 'POST',
    body: { name: input.name, permissions: input.permissions ?? '0', position: input.position ?? 0 }
  });
}

export function assignSpaceRole(
  spaceId: string,
  userId: string,
  roleId: string
): Promise<SpaceMemberResponse> {
  return apiFetch(
    `/spaces/${encodeURIComponent(spaceId)}/members/${encodeURIComponent(userId)}/roles/${encodeURIComponent(roleId)}`,
    { method: 'PUT' }
  );
}

export function removeSpaceRole(
  spaceId: string,
  userId: string,
  roleId: string
): Promise<SpaceMemberResponse> {
  return apiFetch(
    `/spaces/${encodeURIComponent(spaceId)}/members/${encodeURIComponent(userId)}/roles/${encodeURIComponent(roleId)}`,
    { method: 'DELETE' }
  );
}

export function updateChannelPermissions(
  channelId: string,
  input: ChannelPermissionsInput
): Promise<{ channel: TextChannelResponse }> {
  return apiFetch(`/channels/${encodeURIComponent(channelId)}/permissions`, {
    method: 'PATCH',
    body: input
  });
}
