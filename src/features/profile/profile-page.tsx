import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '../../components/ui/button.js';
import type { PublicUser } from '../../lib/types/auth.js';
import { useAuthStore } from '../../stores/auth-store.js';
import { ProfileAbout } from './components/profile-about.js';
import { ProfileCustomizer } from './components/profile-customizer.js';
import { ProfileHeader } from './components/profile-header.js';
import { ProfileHighlight, type ProfileHighlightData } from './components/profile-highlight.js';
import { ProfileIdentity } from './components/profile-identity.js';
import { ProfileLinks } from './components/profile-links.js';
import { ProfileMeta } from './components/profile-meta.js';
import { ProfileError, ProfileLoading } from './components/profile-query-state.js';
import { ProfileShell } from './components/profile-shell.js';
import { useMyProfile } from './queries/use-my-profile.js';
import { usePublicProfile } from './queries/use-public-profile.js';
import { useUpdateProfile } from './queries/use-update-profile.js';
import { useUploadProfileMedia } from './queries/use-upload-profile-media.js';
import type { ProfileMediaKind } from './api/profile-media-endpoints.js';
import { checkUsernameAvailability, type UpdateProfilePayload } from './api/profile-endpoints.js';
import type { ProcessedProfileMedia } from './media/image-processing.js';
import './profile-page.css';
import {
  DEFAULT_NICK_THEME,
  DEFAULT_PROFILE_THEME,
  getReadableProfileColors,
  type NicknameTheme,
  type ProfileThemeColors
} from './profile-theme.js';

export interface ProfileExperienceProps {
  profile: PublicUser;
  isOwner?: boolean;
  onSaveIdentity?: (patch: { displayName?: string; username?: string }) => Promise<void>;
  onSaveBio?: (bio: string | null) => Promise<void>;
  onSaveCustomization?: (
    profile: Pick<UpdateProfilePayload, 'displayName' | 'bio' | 'profileColor'>
  ) => Promise<void>;
  onSaveLinks?: (links: PublicUser['externalLinks']) => Promise<void>;
  onUploadMedia?: (kind: ProfileMediaKind, media: ProcessedProfileMedia) => Promise<void>;
  friendsCount?: number | null;
  tagline?: string | null;
  highlight?: ProfileHighlightData | null;
}

export function ProfileExperience({
  profile,
  isOwner = false,
  onSaveIdentity,
  onSaveBio,
  onSaveCustomization,
  onSaveLinks,
  onUploadMedia,
  friendsCount = null,
  tagline = null,
  highlight = null
}: ProfileExperienceProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [previewDisplayName, setPreviewDisplayName] = useState(profile.displayName);
  const [previewBio, setPreviewBio] = useState(profile.bio ?? '');
  const [editingMedia, setEditingMedia] = useState<ProfileMediaKind | null>(null);
  const [isSavingCustomization, setIsSavingCustomization] = useState(false);
  const [customizationError, setCustomizationError] = useState<string | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const defaultProfileTheme = {
    ...DEFAULT_PROFILE_THEME,
    primary: profile.profileColor?.toUpperCase() ?? DEFAULT_PROFILE_THEME.primary
  };
  const [profileTheme, setProfileTheme] = useState<ProfileThemeColors>(defaultProfileTheme);
  const [confirmedProfileTheme, setConfirmedProfileTheme] =
    useState<ProfileThemeColors>(defaultProfileTheme);
  const [nicknameTheme, setNicknameTheme] = useState<NicknameTheme>(DEFAULT_NICK_THEME);
  const [confirmedNicknameTheme, setConfirmedNicknameTheme] =
    useState<NicknameTheme>(DEFAULT_NICK_THEME);
  const readableColors = getReadableProfileColors(profileTheme.primary, profileTheme.secondary);

  useEffect(
    () => () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    },
    []
  );

  function showSaveFeedback(message: string) {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setSaveFeedback(message);
    feedbackTimerRef.current = setTimeout(() => {
      setSaveFeedback(null);
      feedbackTimerRef.current = null;
    }, 5000);
  }

  async function saveIdentity(patch: { displayName?: string; username?: string }) {
    if (!onSaveIdentity) return;
    await onSaveIdentity(patch);
    if (patch.displayName !== undefined) setPreviewDisplayName(patch.displayName);
  }

  function resetCustomization() {
    setPreviewDisplayName(profile.displayName);
    setPreviewBio(profile.bio ?? '');
    setProfileTheme(defaultProfileTheme);
    setConfirmedProfileTheme(defaultProfileTheme);
    setNicknameTheme(DEFAULT_NICK_THEME);
    setConfirmedNicknameTheme(DEFAULT_NICK_THEME);
  }

  function cancelCustomization() {
    resetCustomization();
    setCustomizationError(null);
    setSaveFeedback(null);
    setIsEditing(false);
  }

  async function saveCustomization() {
    setIsSavingCustomization(true);
    setCustomizationError(null);

    try {
      const normalizedBio = previewBio.trim() || null;
      const bioChanged = normalizedBio !== profile.bio;
      const normalizedDisplayName = previewDisplayName.trim();
      const normalizedProfileColor = confirmedProfileTheme.primary;
      const changes: Pick<UpdateProfilePayload, 'displayName' | 'bio' | 'profileColor'> = {};

      if (normalizedDisplayName !== profile.displayName) {
        changes.displayName = normalizedDisplayName;
      }
      if (bioChanged) {
        changes.bio = normalizedBio;
      }
      if (normalizedProfileColor !== defaultProfileTheme.primary) {
        changes.profileColor = normalizedProfileColor;
      }

      if (onSaveCustomization && Object.keys(changes).length > 0) {
        await onSaveCustomization(changes);
      } else if (onSaveBio && normalizedBio !== profile.bio) {
        await onSaveBio(normalizedBio);
      }
      setPreviewDisplayName(normalizedDisplayName);
      setProfileTheme(confirmedProfileTheme);
      setNicknameTheme(confirmedNicknameTheme);
      setIsEditing(false);
      if (bioChanged) showSaveFeedback('Bio salva com sucesso.');
    } catch {
      setCustomizationError('Não foi possível guardar as alterações. Tente novamente.');
    } finally {
      setIsSavingCustomization(false);
    }
  }

  return (
    <div
      className={`profile-page-experience${isEditing ? ' profile-page-experience--editing' : ''}`}
    >
      {!isEditing && isOwner ? (
        <div className="profile-page-experience__actions">
          {saveFeedback ? (
            <p
              className="profile-feedback profile-feedback--success profile-page-experience__feedback"
              role="status"
              aria-live="polite"
            >
              {saveFeedback}
            </p>
          ) : null}
          <Button type="button" variant="secondary" onClick={() => setIsEditing(true)}>
            Editar perfil
          </Button>
        </div>
      ) : null}
      <div className="profile-preview">
        {isEditing ? (
          <header className="profile-preview__heading">
            <div>
              <h2>Pré-visualização</h2>
              <p>Veja como o seu perfil ficará</p>
            </div>
            <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>
              Ver perfil
            </Button>
          </header>
        ) : null}
        <ProfileShell
          profileColorPrimary={profileTheme.primary}
          profileColorSecondary={profileTheme.secondary}
          profileForeground={readableColors.foreground}
          profileMuted={readableColors.muted}
          profileNeutral={readableColors.neutral}
          profilePrimarySurface={readableColors.primarySurface}
          profileSecondarySurface={readableColors.secondarySurface}
          profileSecondaryGlass={readableColors.secondaryGlass}
          profileButtonBackground={readableColors.buttonBackground}
          profileButtonHover={readableColors.buttonHover}
          profileButtonForeground={readableColors.buttonForeground}
          nicknameMode={nicknameTheme.mode}
          nicknameColorPrimary={nicknameTheme.primary}
          nicknameColorSecondary={nicknameTheme.secondary}
        >
          <ProfileHeader
            avatarUrl={profile.avatarUrl}
            avatarThumbUrl={profile.avatarThumbUrl}
            bannerUrl={profile.bannerUrl}
            displayName={previewDisplayName}
            isOwner={isOwner && isEditing}
            onUploadMedia={onUploadMedia}
            requestedEditing={editingMedia}
            onRequestedEditingChange={setEditingMedia}
          />
          <div className="profile-shell__content">
            <div className="profile-shell__main-grid">
              <div className="profile-shell__identity-region">
                <ProfileIdentity
                  displayName={previewDisplayName}
                  username={profile.username}
                  presence={profile.presence}
                  isOwner={isOwner && !isEditing}
                  onSave={onSaveIdentity ? saveIdentity : undefined}
                  onCheckUsername={isOwner ? checkUsernameAvailability : undefined}
                />
                {tagline ? <p className="profile-shell__tagline">“{tagline}”</p> : null}
                <div className="profile-page__about profile-mobile-card">
                  <ProfileAbout bio={previewBio} isOwner={false} />
                </div>
              </div>
              <ProfileLinks links={profile.externalLinks} />
              <ProfileHighlight highlight={highlight} />
            </div>
            <div className="profile-shell__footer">
              <ProfileMeta
                createdAt={profile.createdAt}
                badges={profile.badges}
                friendsCount={friendsCount}
              />
              <Button type="button" disabled className="profile-shell__message-button">
                Enviar mensagem
              </Button>
            </div>
          </div>
        </ProfileShell>
      </div>
      {isOwner && isEditing ? (
        <ProfileCustomizer
          displayName={previewDisplayName}
          bio={previewBio}
          links={profile.externalLinks}
          isSaving={isSavingCustomization}
          saveError={customizationError}
          onDisplayNameChange={setPreviewDisplayName}
          onBioChange={setPreviewBio}
          profileTheme={profileTheme}
          confirmedProfileTheme={confirmedProfileTheme}
          nicknameTheme={nicknameTheme}
          confirmedNicknameTheme={confirmedNicknameTheme}
          onProfileThemeChange={setProfileTheme}
          onProfileThemeConfirm={setConfirmedProfileTheme}
          onNicknameThemeChange={setNicknameTheme}
          onNicknameThemeConfirm={setConfirmedNicknameTheme}
          onSaveLinks={onSaveLinks}
          onEditMedia={onUploadMedia ? setEditingMedia : undefined}
          onReset={resetCustomization}
          onCancel={cancelCustomization}
          onSave={() => void saveCustomization()}
        />
      ) : null}
    </div>
  );
}

function AuthenticatedProfilePage() {
  const profileQuery = useMyProfile();
  const updateProfile = useUpdateProfile();
  const uploadProfileMedia = useUploadProfileMedia();

  if (profileQuery.isPending) return <ProfileLoading />;
  if (profileQuery.isError) {
    return (
      <ProfileError
        onRetry={() => void profileQuery.refetch()}
        retrying={profileQuery.isFetching}
      />
    );
  }

  return (
    <ProfileExperience
      profile={profileQuery.data}
      isOwner
      onSaveIdentity={async (patch) => {
        await updateProfile.mutateAsync(patch);
      }}
      onSaveBio={async (bio) => {
        await updateProfile.mutateAsync({ bio });
      }}
      onSaveCustomization={async (changes) => {
        await updateProfile.mutateAsync(changes);
      }}
      onUploadMedia={async (kind, media) => {
        await uploadProfileMedia.mutateAsync({ kind, media });
      }}
      onSaveLinks={async (externalLinks) => {
        await updateProfile.mutateAsync({ externalLinks });
      }}
    />
  );
}

export function ProfilePage() {
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');

  return isAuthenticated ? <AuthenticatedProfilePage /> : null;
}

interface PublicProfilePageProps {
  userId: string;
}

export function PublicProfilePage({ userId }: PublicProfilePageProps) {
  const profileQuery = usePublicProfile(userId);

  if (profileQuery.isPending) return <ProfileLoading />;
  if (profileQuery.isError) {
    return (
      <ProfileError
        notFound={
          profileQuery.error instanceof Error &&
          'status' in profileQuery.error &&
          profileQuery.error.status === 404
        }
        onRetry={() => void profileQuery.refetch()}
        retrying={profileQuery.isFetching}
      />
    );
  }

  return <ProfileExperience profile={profileQuery.data} />;
}

export function PublicProfileRoute() {
  const { userId = '' } = useParams();
  return <PublicProfilePage userId={userId} />;
}
