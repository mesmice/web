import type { QueryClient } from '@tanstack/react-query';
import { conversationKeys } from '../api/conversation-query-keys.js';
import type {
  ConversationListResponse,
  ConversationSummary
} from '../../../lib/types/conversations.js';

export function insertConversationCreated(
  queryClient: QueryClient,
  conversation: ConversationSummary
): void {
  queryClient.setQueriesData<ConversationListResponse>(
    { queryKey: conversationKeys.lists() },
    (current) => {
      if (!current || current.items.some((item) => item.id === conversation.id)) return current;
      return { ...current, items: [conversation, ...current.items] };
    }
  );
}
