import { Camera, Pencil } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../../components/ui/button.js';
import type { PrivateUser } from '../../../lib/types/auth.js';
import type { ProfileMediaKind } from '../api/profile-media-endpoints.js';
import type { ProcessedProfileMedia } from '../media/image-processing.js';
import { ProfileMediaEditor } from '../media/profile-media-editor.js';
import './profile-header.css';

type ProfileHeaderProps = Pick<PrivateUser, 'avatarUrl' | 'avatarThumbUrl' | 'bannerUrl' | 'displayName'> & {
  isOwner?: boolean;
  onUploadMedia?: (kind: ProfileMediaKind, media: ProcessedProfileMedia) => Promise<void>;
};

function getAvatarFallback(displayName: string): string {
  return displayName.trim().charAt(0).toLocaleUpperCase() || '?';
}

export function ProfileHeader({
  avatarUrl,
  avatarThumbUrl,
  bannerUrl,
  displayName,
  isOwner = false,
  onUploadMedia
}: ProfileHeaderProps) {
  const [editing, setEditing] = useState<ProfileMediaKind | null>(null);
  const canEdit = isOwner && onUploadMedia;

  return (
    <header className="profile-header">
      <div
        className={`profile-header__banner${canEdit ? ' profile-header__banner--editable' : ''}`}
        role={canEdit ? 'button' : undefined}
        tabIndex={canEdit ? 0 : undefined}
        aria-label={canEdit ? 'Alterar banner' : undefined}
        onClick={canEdit ? () => setEditing('banner') : undefined}
        onKeyDown={
          canEdit
            ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setEditing('banner');
                }
              }
            : undefined
        }
      >
        {bannerUrl ? <img src={bannerUrl} alt="" className="profile-header__banner-image" /> : null}
        {canEdit ? (
          <span className="profile-header__banner-action" aria-hidden="true">
            <Camera size={18} />
            Alterar banner
          </span>
        ) : null}
      </div>
      <div
        className={`profile-header__avatar${canEdit ? ' profile-header__avatar--editable' : ''}`}
        role={canEdit ? 'button' : undefined}
        tabIndex={canEdit ? 0 : undefined}
        aria-label={canEdit ? 'Alterar avatar' : undefined}
        onClick={canEdit ? () => setEditing('avatar') : undefined}
        onKeyDown={
          canEdit
            ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setEditing('avatar');
                }
              }
            : undefined
        }
      >
        {avatarThumbUrl ?? avatarUrl ? (
          <img src={avatarThumbUrl ?? avatarUrl ?? undefined} alt={`Avatar de ${displayName}`} />
        ) : (
          <span aria-label={`Avatar de ${displayName}`}>{getAvatarFallback(displayName)}</span>
        )}
        {canEdit ? (
          <Button
            type="button"
            variant="secondary"
            className="profile-header__media-edit profile-header__media-edit--avatar"
            aria-label="Alterar avatar"
            title="Alterar avatar"
            onClick={(event) => {
              event.stopPropagation();
              setEditing('avatar');
            }}
          >
            <Camera size={17} aria-hidden="true" />
          </Button>
        ) : null}
      </div>
      {!canEdit ? (
        <Button
          type="button"
          className="profile-header__edit"
          disabled
          title="Edição de perfil ainda não disponível"
        >
          <Pencil size={15} aria-hidden="true" />
          Editar perfil
        </Button>
      ) : null}
      {editing ? (
        <ProfileMediaEditor
          aspectRatio={editing === 'avatar' ? 1 : 4}
          outputWidth={editing === 'avatar' ? 512 : 1600}
          outputHeight={editing === 'avatar' ? 512 : 400}
          outputMimeType="image/webp"
          quality={0.9}
          viewportShape={editing === 'avatar' ? 'circle' : 'rectangle'}
          labels={{ title: editing === 'avatar' ? 'Editar avatar' : 'Editar banner' }}
          onCancel={() => setEditing(null)}
          onConfirm={async (media) => {
            await onUploadMedia?.(editing, media);
            setEditing(null);
          }}
        />
      ) : null}
    </header>
  );
}
