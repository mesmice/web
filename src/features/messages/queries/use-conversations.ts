import { useQuery } from '@tanstack/react-query';
import { DEFAULT_CONVERSATION_LIMIT, getConversations } from '../api/conversation-endpoints.js';
import { conversationKeys } from '../api/conversation-query-keys.js';

export function useConversations(limit = DEFAULT_CONVERSATION_LIMIT) {
  return useQuery({
    queryKey: conversationKeys.list(limit),
    queryFn: ({ signal }) => getConversations(limit, signal)
  });
}
