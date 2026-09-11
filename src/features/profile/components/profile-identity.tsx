import type { PublicUser } from '../../../lib/types/auth.js';
import './profile-section.css';

type ProfileIdentityProps = Pick<PublicUser, 'displayName' | 'username' | 'presence'>;

const PRESENCE_LABEL: Record<PublicUser['presence'], string> = {
  online: 'Online',
  idle: 'Ausente',
  dnd: 'Não incomodar',
  invisible: 'Invisível',
  offline: 'Offline'
};

export function ProfileIdentity({ displayName, username, presence }: ProfileIdentityProps) {
  return (
    <section className="profile-section profile-identity" aria-labelledby="profile-title">
      <h1 id="profile-title">{displayName}</h1>
      <div className="profile-identity__meta">
        <p className="profile-identity__username">@{username}</p>
        <p className="profile-identity__presence" aria-label={`Presença: ${presence}`}>
          <span
            className={`profile-identity__presence-dot profile-identity__presence-dot--${presence}`}
            aria-hidden="true"
          />
          <span>{PRESENCE_LABEL[presence]}</span>
        </p>
      </div>
    </section>
  );
}
