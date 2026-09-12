import type { PrivateUser } from '../../lib/types/auth.js';

/** Fixture exclusiva de testes e review visual; não é usada como perfil em produção. */
export const PROFILE_DEMO: PrivateUser = {
  id: 'profile-demo',
  username: 'maria',
  displayName: 'Maria Souza',
  bio: 'Construindo comunidades com cuidado e criando espaços para boas conversas.',
  avatarUrl: '/images/auth/mascote-neutro-lightmode.png',
  avatarThumbUrl: null,
  bannerUrl: '/images/landing-page/what-is/community-card.png',
  externalLinks: [
    { label: 'Site pessoal', url: 'https://example.com' },
    { label: 'Comunidade', url: 'https://mesmice.com' },
    { label: 'GitHub', url: 'https://github.com' }
  ],
  profileTheme: null,
  avatarFrameUrl: null,
  profileColor: '#8b5cf6',
  badges: [],
  presence: 'invisible',
  lastActiveAt: '2026-01-01T12:00:00.000Z',
  createdAt: '2026-01-01T12:00:00.000Z',
  email: 'maria@example.com',
  emailVerified: true
};

export const PROFILE_DEMO_FRIENDS_COUNT = 128;

export const PROFILE_DEMO_TAGLINE = 'criando coisas e aproximando pessoas.';

export const PROFILE_DEMO_HIGHLIGHT = {
  title: 'Space Song',
  artist: 'Beach House',
  coverUrl: '/images/landing-page/what-is/community-card.png',
  service: 'Spotify'
};
