import { useState } from 'react';
import type { PrivateUser } from '../../lib/types/auth.js';
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
import {
  PROFILE_DEMO_FRIENDS_COUNT,
  PROFILE_DEMO_HIGHLIGHT,
  PROFILE_DEMO_TAGLINE,
  PROFILE_DEMO
} from './profile-demo-data.js';
import { useMyProfile } from './queries/use-my-profile.js';
import './profile-page.css';
import {
  DEFAULT_NICK_THEME,
  DEFAULT_PROFILE_THEME,
  getReadableProfileColors,
  type NicknameTheme,
  type ProfileThemeColors
} from './profile-theme.js';

interface ProfileExperienceProps {
  profile: PrivateUser;
  friendsCount?: number | null;
  tagline?: string | null;
  highlight?: ProfileHighlightData | null;
}

export function ProfileExperience({
  profile,
  friendsCount = PROFILE_DEMO_FRIENDS_COUNT,
  tagline = PROFILE_DEMO_TAGLINE,
  highlight = PROFILE_DEMO_HIGHLIGHT
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
          bannerUrl={profile.bannerUrl}
          displayName={profile.displayName}
        />
        <div className="profile-shell__content">
          <div className="profile-shell__main-grid">
            <div className="profile-shell__identity-region">
              <ProfileIdentity displayName={profile.displayName} username={profile.username} />
              {tagline ? <p className="profile-shell__tagline">“{tagline}”</p> : null}
              <div className="profile-page__about profile-mobile-card">
                <ProfileAbout bio={profile.bio} isOwner />
                <ProfileMeta
                  createdAt={profile.createdAt}
                  badges={profile.badges}
                  friendsCount={friendsCount}
                />
              </div>
            </div>
            <ProfileLinks links={profile.externalLinks} />
            <ProfileHighlight highlight={highlight} />
          </div>
        </div>
      </ProfileShell>
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
    </div>
  );
}

function AuthenticatedProfilePage() {
  const profileQuery = useMyProfile();

  if (profileQuery.isPending) return <ProfileLoading />;
  if (profileQuery.isError) {
    return (
      <ProfileError
        onRetry={() => void profileQuery.refetch()}
        retrying={profileQuery.isFetching}
      />
    );
  }

  return <ProfileExperience profile={profileQuery.data} />;
}

export function ProfilePage() {
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');

  return isAuthenticated ? (
    <AuthenticatedProfilePage />
  ) : (
    <ProfileExperience profile={PROFILE_DEMO} />
  );
}
