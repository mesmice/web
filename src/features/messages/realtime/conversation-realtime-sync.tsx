import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { gateway } from '../../../lib/ws/socket.js';
import { insertConversationCreated } from './conversation-cache.js';

export function ConversationRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(
    () =>
      gateway.onMessage((event) => {
        if (event.type === 'conversation.created') {
          insertConversationCreated(queryClient, event.payload);
        }
      }),
    [queryClient]
  );

  return null;
}
