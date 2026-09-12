import { apiFetch } from '../../../lib/api/client.js';
import type {
  ConversationListResponse,
  CreateDirectMessageRequest,
  CreateDirectMessageResponse
} from '../../../lib/types/conversations.js';

export const DEFAULT_CONVERSATION_LIMIT = 50;

export function getConversations(
  limit = DEFAULT_CONVERSATION_LIMIT,
  signal?: AbortSignal
): Promise<ConversationListResponse> {
  const params = new URLSearchParams({ limit: String(limit) });
  return apiFetch(`/channels?${params.toString()}`, { signal });
}

export function createDirectMessage(recipientId: string): Promise<CreateDirectMessageResponse> {
  const body: CreateDirectMessageRequest = { type: 'DM', recipientId };
  return apiFetch('/channels', { method: 'POST', body });
}
