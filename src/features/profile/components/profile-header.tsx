import { Pencil } from 'lucide-react';
import { Button } from '../../../components/ui/button.js';
import type { PrivateUser } from '../../../lib/types/auth.js';
import './profile-header.css';

type ProfileHeaderProps = Pick<PrivateUser, 'avatarUrl' | 'bannerUrl' | 'displayName'>;

function getAvatarFallback(displayName: string): string {
  return displayName.trim().charAt(0).toLocaleUpperCase() || '?';
}

export function ProfileHeader({ avatarUrl, bannerUrl, displayName }: ProfileHeaderProps) {
  return (
    <header className="profile-header">
      <div className="profile-header__banner">
        {bannerUrl ? <img src={bannerUrl} alt="" className="profile-header__banner-image" /> : null}
      </div>
      <div className="profile-header__avatar">
        {avatarUrl ? (
          <img src={avatarUrl} alt={`Avatar de ${displayName}`} />
        ) : (
          <span aria-label={`Avatar de ${displayName}`}>{getAvatarFallback(displayName)}</span>
        )}
      </div>
      <Button
        type="button"
        className="profile-header__edit"
        disabled
        title="Edição de perfil ainda não disponível"
      >
        <Pencil size={15} aria-hidden="true" />
        Editar perfil
      </Button>
    </header>
  );
}
