export interface MentionableUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
}

interface MentionQuery {
  query: string;
  start: number;
}

export function getMentionQuery(value: string, cursorPosition: number): MentionQuery | null {
  const textBeforeCursor = value.slice(0, cursorPosition);
  const match = textBeforeCursor.match(/(?:^|\s)@([a-zA-Z0-9._-]*)$/);

  if (!match || match.index === undefined) return null;

  return {
    query: match[1] ?? '',
    start: match.index + match[0].indexOf('@')
  };
}

export function insertMention(
  value: string,
  cursorPosition: number,
  user: MentionableUser
): { value: string; cursorPosition: number } {
  const mentionQuery = getMentionQuery(value, cursorPosition);
  if (!mentionQuery) return { value, cursorPosition };

  const mention = `@${user.username} `;
  const nextValue = `${value.slice(0, mentionQuery.start)}${mention}${value.slice(cursorPosition)}`;

  return {
    value: nextValue,
    cursorPosition: mentionQuery.start + mention.length
  };
}
