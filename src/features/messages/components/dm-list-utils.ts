import type { UserSummary } from '../../../lib/types/api.js';
import type { ConversationSummary } from '../../../lib/types/conversations.js';

export function getOtherParticipants(
  conversation: ConversationSummary,
  currentUserId: string
): UserSummary[] {
  const others = conversation.participants.filter(
    (participant) => participant.id !== currentUserId
  );
  return others.length > 0 ? others : conversation.participants;
}

export function getConversationLabel(
  conversation: ConversationSummary,
  currentUserId: string
): string {
  if (conversation.type === 'DM') {
    return getOtherParticipants(conversation, currentUserId)[0]?.displayName || 'Conversa direta';
  }

  const explicitName = conversation.name?.trim();
  if (explicitName) return explicitName;

  const participantNames = getOtherParticipants(conversation, currentUserId)
    .map((participant) => participant.displayName.trim())
    .filter(Boolean);
  return participantNames.length > 0 ? participantNames.join(', ') : 'Conversa em grupo';
}
