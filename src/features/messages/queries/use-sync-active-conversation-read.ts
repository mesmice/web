import { useEffect } from 'react';
import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import { markChannelRead } from '../../../lib/api/endpoints.js';
import type { ConversationSummary } from '../../../lib/types/conversations.js';
import { setConversationUnreadCount } from '../realtime/conversation-cache.js';

const inFlightReads = new WeakMap<QueryClient, Map<string, Promise<void>>>();

function getInFlightReads(queryClient: QueryClient): Map<string, Promise<void>> {
  const existing = inFlightReads.get(queryClient);
  if (existing) return existing;
  const reads = new Map<string, Promise<void>>();
  inFlightReads.set(queryClient, reads);
  return reads;
}

export function syncConversationRead(
  queryClient: QueryClient,
  conversationId: string
): Promise<void> {
  const reads = getInFlightReads(queryClient);
  const existing = reads.get(conversationId);
  if (existing) return existing;

  const request = markChannelRead(conversationId)
    .then(() => setConversationUnreadCount(queryClient, conversationId, 0))
    .finally(() => reads.delete(conversationId));
  reads.set(conversationId, request);
  return request;
}

export function useSyncActiveConversationRead(
  conversation: ConversationSummary | undefined,
  conversationsUpdatedAt: number
): void {
  const queryClient = useQueryClient();
  const conversationId = conversation?.id;
  const unreadCount = conversation?.unreadCount ?? 0;

  useEffect(() => {
    if (!conversationId || unreadCount === 0) return;
    void syncConversationRead(queryClient, conversationId).catch(() => undefined);
  }, [conversationId, conversationsUpdatedAt, queryClient, unreadCount]);
}
