import type { BlockedListItem } from './blocked-list.js';

interface BlockedApiShape {
  id?: string | number | null;
  displayName?: string | null;
  name?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  accentColor?: string | null;
  isBlocked?: boolean | null;
}

export function mapBlockedListItemFromApi(rawPerson: BlockedApiShape): BlockedListItem {
  const displayName = rawPerson.displayName ?? rawPerson.name ?? 'Pessoa';

  return {
    id: String(rawPerson.id ?? displayName),
    displayName,
    username: rawPerson.username ?? null,
    avatarUrl: rawPerson.avatarUrl ?? null,
    accentColor: rawPerson.accentColor ?? null,
    isBlocked: rawPerson.isBlocked ?? true
  };
}
