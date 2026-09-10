import { useState } from 'react';
import { useParams } from 'react-router-dom';
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
import { checkUsernameAvailability } from './api/profile-endpoints.js';
import type { ProfileMediaKind } from './api/profile-media-endpoints.js';
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
  onSaveLinks,
  onUploadMedia,
  friendsCount = null,
  tagline = null,
  highlight = null
}: ProfileExperienceProps) {
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

  function resetCustomization() {
    setProfileTheme(defaultProfileTheme);
    setConfirmedProfileTheme(defaultProfileTheme);
    setNicknameTheme(DEFAULT_NICK_THEME);
    setConfirmedNicknameTheme(DEFAULT_NICK_THEME);
  }

  return (
    <div className="profile-page-experience">
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
          avatarFrameUrl={profile.avatarFrameUrl}
          bannerUrl={profile.bannerUrl}
          displayName={profile.displayName}
          isOwner={isOwner}
          onUploadMedia={onUploadMedia}
        />
        <div className="profile-shell__content">
          <div className="profile-shell__main-grid">
            <div className="profile-shell__identity-region">
              <ProfileIdentity
                displayName={profile.displayName}
                username={profile.username}
                presence={profile.presence}
                isOwner={isOwner}
                onSave={isOwner ? onSaveIdentity : undefined}
                onCheckUsername={isOwner ? checkUsernameAvailability : undefined}
              />
              {tagline ? <p className="profile-shell__tagline">“{tagline}”</p> : null}
              <div className="profile-page__about profile-mobile-card">
                <ProfileAbout
                  bio={profile.bio}
                  isOwner={isOwner}
                  onSave={isOwner ? onSaveBio : undefined}
                />
                <ProfileMeta
                  createdAt={profile.createdAt}
                  badges={profile.badges}
                  friendsCount={friendsCount}
                />
              </div>
            </div>
            <ProfileLinks links={profile.externalLinks} isOwner={isOwner} onSave={onSaveLinks} />
            <ProfileHighlight highlight={highlight} />
          </div>
        </div>
      </ProfileShell>
      {isOwner ? (
        <ProfileCustomizer
          displayName={profile.displayName}
          profileTheme={profileTheme}
          confirmedProfileTheme={confirmedProfileTheme}
          nicknameTheme={nicknameTheme}
          confirmedNicknameTheme={confirmedNicknameTheme}
          onProfileThemeChange={setProfileTheme}
          onProfileThemeConfirm={setConfirmedProfileTheme}
          onNicknameThemeChange={setNicknameTheme}
          onNicknameThemeConfirm={setConfirmedNicknameTheme}
          onReset={resetCustomization}
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
        notFound={profileQuery.error instanceof Error && 'status' in profileQuery.error && profileQuery.error.status === 404}
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
