import { ProfileAbout } from './components/profile-about.js';
import { ProfileError, ProfileLoading } from './components/profile-query-state.js';
import { ProfileHeader } from './components/profile-header.js';
import { ProfileIdentity } from './components/profile-identity.js';
import { ProfileLinks } from './components/profile-links.js';
import { ProfileShell } from './components/profile-shell.js';
import { useMyProfile } from './queries/use-my-profile.js';

export function ProfilePage() {
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

  const profile = profileQuery.data;

  return (
    <ProfileShell>
      <ProfileHeader
        avatarUrl={profile.avatarUrl}
        bannerUrl={profile.bannerUrl}
        displayName={profile.displayName}
      />
      <div className="profile-shell__content">
        <div className="profile-shell__primary">
          <ProfileIdentity displayName={profile.displayName} username={profile.username} />
          <ProfileAbout bio={profile.bio} isOwner />
        </div>
        <div className="profile-shell__secondary">
          <ProfileLinks links={profile.externalLinks} />
        </div>
      </div>
    </ProfileShell>
  );
}
