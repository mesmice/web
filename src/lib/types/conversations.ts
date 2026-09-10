import type { UserSummary } from './api.js';

export type ConversationType = 'DM' | 'GROUP_DM';

interface MemberOverwrite {
  memberId: string;
  allow: string;
  deny: string;
}

interface PrivateChannelPermissions {
  default: string;
  memberOverwrites: MemberOverwrite[];
}

interface ConversationBase {
  id: string;
  ownerId: string;
  createdAt: string;
  lastMessageAt: string | null;
  permissions: PrivateChannelPermissions;
}

export interface DirectMessageChannel extends ConversationBase {
  type: 'DM';
  name: null;
  participantIds: [string, string];
}

export interface GroupDirectMessageChannel extends ConversationBase {
  type: 'GROUP_DM';
  name: string | null;
  participantIds: string[];
}

export type ConversationChannel = DirectMessageChannel | GroupDirectMessageChannel;

interface ConversationSummaryFields {
  unreadCount: number;
}

export type DirectMessageSummary = DirectMessageChannel &
  ConversationSummaryFields & {
    participants: [UserSummary, UserSummary];
  };

export type GroupDirectMessageSummary = GroupDirectMessageChannel &
  ConversationSummaryFields & {
    participants: UserSummary[];
  };

export type ConversationSummary = DirectMessageSummary | GroupDirectMessageSummary;

export interface ConversationListResponse {
  items: ConversationSummary[];
}

export interface CreateDirectMessageRequest {
  type: 'DM';
  recipientId: string;
}

export interface CreateDirectMessageResponse {
  channel: DirectMessageChannel;
}
