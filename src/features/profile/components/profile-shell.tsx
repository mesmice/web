import type { CSSProperties, ReactNode } from 'react';
import './profile-shell.css';

interface ProfileShellProps {
  children: ReactNode;
  profileColorPrimary: string;
  profileColorSecondary: string;
  profileForeground: string;
  profileMuted: string;
  profileNeutral: string;
  profilePrimarySurface: string;
  profileSecondarySurface: string;
  profileSecondaryGlass: string;
  profileButtonBackground: string;
  profileButtonHover: string;
  profileButtonForeground: string;
  nicknameMode: 'solid' | 'gradient';
  nicknameColorPrimary: string;
  nicknameColorSecondary: string;
}

export function ProfileShell({
  children,
  profileColorPrimary,
  profileColorSecondary,
  profileForeground,
  profileMuted,
  profileNeutral,
  profilePrimarySurface,
  profileSecondarySurface,
  profileSecondaryGlass,
  profileButtonBackground,
  profileButtonHover,
  profileButtonForeground,
  nicknameMode,
  nicknameColorPrimary,
  nicknameColorSecondary
}: ProfileShellProps) {
  const profileStyle = {
    '--profile-color-primary': profileColorPrimary,
    '--profile-color-secondary': profileColorSecondary,
    '--profile-foreground': profileForeground,
    '--profile-muted': profileMuted,
    '--profile-neutral': profileNeutral,
    '--profile-primary-surface': profilePrimarySurface,
    '--profile-secondary-surface': profileSecondarySurface,
    '--profile-secondary-glass': profileSecondaryGlass,
    '--profile-button-bg': profileButtonBackground,
    '--profile-button-hover': profileButtonHover,
    '--profile-button-fg': profileButtonForeground,
    '--nickname-color-primary': nicknameColorPrimary,
    '--nickname-color-secondary': nicknameColorSecondary
  } as CSSProperties;

  return (
    <section
      className="profile-shell"
      aria-labelledby="profile-title"
      data-nickname-mode={nicknameMode}
      style={profileStyle}
    >
      {children}
    </section>
  );
}
