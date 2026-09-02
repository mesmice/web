import type { PrivateUser } from '../../../lib/types/auth.js';
import './profile-section.css';

type ProfileMetaProps = Pick<PrivateUser, 'createdAt' | 'badges'> & {
  friendsCount?: number | null;
};

function formatMemberSince(createdAt: string): string | null {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric'
  }).format(date);
}

export function ProfileMeta({ createdAt, badges, friendsCount }: ProfileMetaProps) {
  const memberSince = formatMemberSince(createdAt);
  const hasFriendsCount = typeof friendsCount === 'number' && friendsCount >= 0;
  if (!hasFriendsCount && !memberSince && badges.length === 0) return null;

  return (
    <div className="profile-meta" aria-label="Informações do perfil">
      {hasFriendsCount || memberSince ? (
        <p className="profile-meta__summary">
          {hasFriendsCount ? (
            <span>
              {friendsCount} {friendsCount === 1 ? 'amigo' : 'amigos'}
            </span>
          ) : null}
          {hasFriendsCount && memberSince ? (
            <span className="profile-meta__separator" aria-hidden="true">
              •
            </span>
          ) : null}
          {memberSince ? <span>Membro desde {memberSince}</span> : null}
        </p>
      ) : null}
      {badges.length > 0 ? (
        <ul className="profile-badges" aria-label="Badges do perfil">
          {badges.map((badge) => (
            <li key={badge.code}>{badge.name}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
