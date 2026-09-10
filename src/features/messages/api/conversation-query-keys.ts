import { DEFAULT_CONVERSATION_LIMIT } from './conversation-endpoints.js';

export const conversationKeys = {
  all: ['conversations'] as const,
  lists: () => [...conversationKeys.all, 'list'] as const,
  list: (limit = DEFAULT_CONVERSATION_LIMIT) => [...conversationKeys.lists(), { limit }] as const
};
