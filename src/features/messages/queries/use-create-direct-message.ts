import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createDirectMessage } from '../api/conversation-endpoints.js';
import { conversationKeys } from '../api/conversation-query-keys.js';

export function useCreateDirectMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDirectMessage,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: conversationKeys.lists() })
  });
}
