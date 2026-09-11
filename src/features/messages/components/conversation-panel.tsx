import { useQuery } from '@tanstack/react-query';
import { LoaderCircle, MessageCircle, X } from 'lucide-react';
import { createDirectMessage, getConversations } from '../api/conversation-endpoints.js';
import type { DirectMessageChannel } from '../../../lib/types/conversations.js';
import type { FriendListItem } from '../../social/components/friend-list.js';
import { DirectConversationHistory } from './direct-conversation-history.js';
import type { MentionableUser } from './mention-utils.js';

interface ConversationPanelProps {
  friend: FriendListItem;
  currentUserId?: string;
  onClose: () => void;
}

async function findOrCreateDirectMessage(recipientId: string): Promise<DirectMessageChannel> {
  const conversations = await getConversations();
  const existing = conversations.items.find(
    (channel) => channel.type === 'DM' && channel.participantIds.includes(recipientId)
  );
  if (existing?.type === 'DM') return existing;
  const response = await createDirectMessage(recipientId);
  return response.channel;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Não foi possível carregar a conversa.';
}

export function ConversationPanel({ friend, currentUserId, onClose }: ConversationPanelProps) {
  const channelQuery = useQuery({
    queryKey: ['direct-message-channel', friend.id],
    queryFn: () => findOrCreateDirectMessage(friend.id)
  });
  const mentionUsers: MentionableUser[] = [
    {
      id: friend.id,
      username: friend.username ?? friend.displayName.toLowerCase().replace(/\s+/g, '.'),
      displayName: friend.displayName,
      avatarUrl: friend.avatarUrl
    }
  ];

  return (
    <section className="flex h-[min(720px,calc(100vh-5rem))] w-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-primary)] shadow-lg">
      <header className="flex items-center gap-3 border-b border-[color:var(--color-border-default)] px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand-primary)]">
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold text-[color:var(--color-text-primary)]">
            {friend.displayName}
          </h2>
          <p className="truncate text-xs text-[color:var(--color-text-muted)]">
            @{friend.username ?? 'usuário'}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-secondary)] hover:text-[color:var(--color-text-primary)]"
          aria-label="Fechar conversa"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </header>

      {channelQuery.isLoading ? (
        <div
          className="flex min-h-40 flex-1 items-center justify-center text-sm text-[color:var(--color-text-muted)]"
          role="status"
        >
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          Carregando conversa...
        </div>
      ) : channelQuery.isError ? (
        <p
          className="m-4 rounded-[var(--radius-md)] bg-[color:var(--color-danger-soft)] p-4 text-sm text-[color:var(--color-danger)]"
          role="alert"
        >
          {getErrorMessage(channelQuery.error)}
        </p>
      ) : channelQuery.data ? (
        <DirectConversationHistory
          channelId={channelQuery.data.id}
          currentUserId={currentUserId}
          mentionUsers={mentionUsers}
          markAsRead
        />
      ) : null}
    </section>
  );
}
