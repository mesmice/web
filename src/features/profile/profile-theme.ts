export const DEFAULT_PROFILE_THEME = {
  primary: '#8B5CF6',
  secondary: '#D8CCFF'
} as const;

export const DEFAULT_NICK_THEME = {
  mode: 'solid',
  primary: '#FFFFFF',
  secondary: '#8B5CF6'
} as const;

export type NicknameMode = 'solid' | 'gradient';

export interface ProfileThemeColors {
  primary: string;
  secondary: string;
}

export interface NicknameTheme extends ProfileThemeColors {
  mode: NicknameMode;
}

const HEX_COLOR_PATTERN = /^#?[0-9a-f]{6}$/i;

export function isHexColor(value: string): boolean {
  return HEX_COLOR_PATTERN.test(value);
}

export function normalizeHexColor(value: string): string {
  const trimmedValue = value.trim();
  return `${trimmedValue.startsWith('#') ? '' : '#'}${trimmedValue}`.toUpperCase();
}

export function getReadableProfileColors(primary: string, secondary: string) {
  const channels = primary
    .slice(1)
    .match(/.{2}/g)
    ?.map((channel) => Number.parseInt(channel, 16) / 255);
  const luminance = channels
    ? channels.reduce(
        (sum, channel, index) =>
          sum +
          (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4) *
            [0.2126, 0.7152, 0.0722][index],
        0
      )
    : 0;
  const isLight = luminance > 0.42;
  const secondaryChannels = secondary
    .slice(1)
    .match(/.{2}/g)
    ?.map((channel) => Number.parseInt(channel, 16) / 255);
  const secondaryLuminance = secondaryChannels
    ? secondaryChannels.reduce(
        (sum, channel, index) =>
          sum +
          (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4) *
            [0.2126, 0.7152, 0.0722][index],
        0
      )
    : 0;
  const neutral = isLight ? '#F7F5FA' : '#111014';
  const buttonForeground = secondaryLuminance > 0.48 ? '#201A2C' : '#FFFFFF';

  return {
    foreground: isLight ? '#201A2C' : '#FFFFFF',
    muted: isLight ? '#625B70' : '#D7D0E3',
    neutral,
    primarySurface: `color-mix(in srgb, ${primary} ${isLight ? 24 : 38}%, ${neutral})`,
    secondarySurface: `color-mix(in srgb, ${secondary} ${isLight ? 28 : 42}%, ${neutral})`,
    secondaryGlass: `color-mix(in srgb, ${secondary} ${isLight ? 18 : 24}%, transparent)`,
    buttonBackground: `color-mix(in srgb, ${secondary} ${secondaryLuminance > 0.48 ? 72 : 78}%, ${buttonForeground})`,
    buttonHover: `color-mix(in srgb, ${secondary} 84%, ${buttonForeground})`,
    buttonForeground
  };
}
