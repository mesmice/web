import { expect, test, type Page } from '@playwright/test';
import type { PrivateUser } from '../src/lib/types/auth.js';
import type { UpdateProfilePayload } from '../src/features/profile/api/profile-endpoints.js';

const BASE_PROFILE: PrivateUser = {
  id: '9000000000000000001',
  username: 'maria',
  displayName: 'Maria Souza',
  bio: 'Construindo comunidades com cuidado e criando espaços para boas conversas.',
  avatarUrl: '/images/auth/mascote-neutro-lightmode.png',
  avatarThumbUrl: null,
  bannerUrl: '/images/landing-page/what-is/community-card.png',
  externalLinks: [{ label: 'Site pessoal', url: 'https://example.com' }],
  profileTheme: null,
  avatarFrameUrl: 'https://cdn.example.com/frame.png',
  profileColor: '#8b5cf6',
  badges: [],
  presence: 'online',
  lastActiveAt: '2026-01-01T12:00:00.000Z',
  createdAt: '2026-01-01T12:00:00.000Z',
  email: 'maria@example.com',
  emailVerified: true
};

async function mockProfile(page: Page, overrides: Partial<PrivateUser> = {}) {
  let profile = { ...BASE_PROFILE, ...overrides };
  let patchPayload: UpdateProfilePayload | undefined;
  let releasePatch: (() => void) | undefined;
  let notifyPatchStarted: (() => void) | undefined;
  const patchStarted = new Promise<void>((resolve) => {
    notifyPatchStarted = resolve;
  });
  const patchReleased = new Promise<void>((resolve) => {
    releasePatch = resolve;
  });

  await page.addInitScript(() => localStorage.setItem('mesmice.refresh', 'saved-refresh'));
  await page.route('**/api/v1/auth/refresh', async (route) => {
    await route.fulfill({
      json: { accessToken: 'profile-access', refreshToken: 'rotated-refresh' }
    });
  });
  await page.route('**/api/v1/users/me', async (route) => {
    if (route.request().method() === 'PATCH') {
      patchPayload = route.request().postDataJSON() as UpdateProfilePayload;
      notifyPatchStarted?.();
      await patchReleased;
      profile = { ...profile, ...patchPayload };
    }
    await route.fulfill({ json: { user: profile } });
  });

  return {
    getPatchPayload: () => patchPayload,
    waitForPatch: () => patchStarted,
    releasePatch: () => releasePatch?.()
  };
}

test('Profile mantém a composição visual com mídia real e conteúdo longo', async ({
  page
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockProfile(page, {
    displayName: 'Maria Alexandra de Albuquerque',
    username: 'maria_albuquerque_comunidades',
    bio: `${'Comunidades acolhedoras, conversas honestas e projetos feitos em conjunto. '.repeat(3)}`.slice(
      0,
      190
    )
  });
  await page.goto('/profile');

  const shell = page.locator('.profile-shell');
  const banner = page.locator('.profile-header__banner');
  const avatar = page.locator('.profile-header__avatar');
  const identity = page.locator('.profile-identity');
  const about = page.locator('.profile-page__about');
  const connections = page.locator('.profile-connections');
  const memberSince = page.getByRole('heading', { name: 'Membro desde' });
  const messageButton = page.getByRole('button', { name: 'Enviar mensagem' });

  await expect(page.getByRole('img', { name: /Avatar de Maria Alexandra/ })).toBeVisible();
  await expect(page.locator('.profile-header__banner-image')).toBeVisible();
  await expect(page.getByText('@maria_albuquerque_comunidades')).toBeVisible();
  await expect(page.getByText('Online')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Conexões' })).toBeVisible();
  await expect(memberSince).toBeVisible();
  await expect(messageButton).toBeVisible();
  await expect(page.locator('.profile-header__avatar-frame')).toHaveCount(0);
  await expect(avatar).toHaveCSS('border-width', '0px');

  const geometry = await page.evaluate(() => {
    const rect = (selector: string) => document.querySelector(selector)!.getBoundingClientRect();
    const shellRect = rect('.profile-shell');
    const bannerRect = rect('.profile-header__banner');
    const avatarRect = rect('.profile-header__avatar');
    const identityRect = rect('.profile-identity');
    const aboutRect = rect('.profile-page__about');
    const connectionsRect = rect('.profile-connections');
    const footerRect = rect('.profile-shell__footer');
    return {
      avatarCenterDelta:
        Math.abs(avatarRect.left + avatarRect.width / 2 - (shellRect.left + shellRect.width / 2)),
      identityCenterDelta:
        Math.abs(identityRect.left + identityRect.width / 2 - (shellRect.left + shellRect.width / 2)),
      avatarOverlapsBanner:
        avatarRect.top < bannerRect.bottom && avatarRect.bottom > bannerRect.bottom,
      connectionsBelowBio: connectionsRect.top >= aboutRect.bottom,
      footerBelowConnections: footerRect.top >= connectionsRect.bottom,
      noHorizontalOverflow:
        document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      bannerFade: getComputedStyle(document.querySelector('.profile-header__banner')!, '::after')
        .backgroundImage,
      bannerBlur: getComputedStyle(document.querySelector('.profile-header__banner')!, '::after')
        .backdropFilter,
      centeredIdentity: getComputedStyle(document.querySelector('.profile-identity')!).textAlign,
      bioPills: document.querySelectorAll('.profile-page__about [class*="rounded-sm"]').length
    };
  });

  expect(geometry.avatarCenterDelta).toBeLessThanOrEqual(1);
  expect(geometry.identityCenterDelta).toBeLessThanOrEqual(1);
  expect(geometry.avatarOverlapsBanner).toBe(true);
  expect(geometry.connectionsBelowBio).toBe(true);
  expect(geometry.footerBelowConnections).toBe(true);
  expect(geometry.noHorizontalOverflow).toBe(true);
  expect(geometry.bannerFade).toContain('linear-gradient');
  expect(geometry.bannerBlur).toContain('blur');
  expect(geometry.centeredIdentity).toBe('center');
  expect(geometry.bioPills).toBe(0);

  await expect(shell).toBeVisible();
  await expect(banner).toBeVisible();
  await expect(identity).toBeVisible();
  await expect(about).toBeVisible();
  await expect(connections).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('profile-desktop.png'), fullPage: true });
});

test('Profile permanece íntegro no mobile sem avatar e banner', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockProfile(page, {
    avatarUrl: null,
    avatarThumbUrl: null,
    bannerUrl: null,
    externalLinks: []
  });
  await page.goto('/profile');

  await expect(page.getByLabel('Avatar de Maria Souza')).toHaveText('M');
  await expect(page.locator('.profile-header__banner-image')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Conexões' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Membro desde' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Enviar mensagem' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    await page.evaluate(() => document.documentElement.clientWidth)
  );

  await page.screenshot({
    path: testInfo.outputPath('profile-mobile-empty-media.png'),
    fullPage: true
  });
});

test('editor valida preview, cancelamento, scroll, loading e salvamento', async ({
  page
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const request = await mockProfile(page);
  await page.goto('/profile');

  await expect(page.getByRole('heading', { name: 'Editar perfil' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Editar perfil' }).click();
  await expect(page.getByRole('heading', { name: 'Editar perfil' })).toBeVisible();
  await expect(page.getByText(/Moldura do avatar/i)).toHaveCount(0);

  const shell = page.locator('.profile-shell');
  const customizer = page.locator('.profile-customizer');
  const primaryHex = page.getByRole('textbox', {
    name: 'Cor do perfil hexadecimal',
    exact: true
  });
  const primaryPicker = page.getByLabel('Escolher Cor do perfil');

  await page.getByRole('button', { name: 'Usar preset Azul' }).click();
  await expect(shell).toHaveCSS('--profile-color-primary', '#1D4ED8');
  await primaryPicker.fill('#BE185D');
  await expect(shell).toHaveCSS('--profile-color-primary', '#BE185D');
  await primaryHex.fill('3478d4');
  await expect(shell).toHaveCSS('--profile-color-primary', '#3478D4');
  await primaryHex.fill('#12345Z');
  await expect(page.getByRole('alert')).toContainText('hexadecimal com 6 caracteres');
  await expect(primaryHex).toHaveAttribute('aria-invalid', 'true');
  await expect(shell).toHaveCSS('--profile-color-primary', '#3478D4');
  await page.getByRole('button', { name: 'Restaurar' }).click();
  await expect(shell).toHaveCSS('--profile-color-primary', '#8B5CF6');

  await page.getByRole('textbox', { name: 'Display name / nick' }).fill('Não persistir');
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Maria Souza' })).toBeVisible();
  expect(request.getPatchPayload()).toBeUndefined();

  await page.getByRole('button', { name: 'Editar perfil' }).click();
  await page.getByRole('textbox', { name: 'Display name / nick' }).fill('Maria Atualizada');
  await page.getByRole('textbox', { name: 'Bio' }).fill('Bio atualizada pelo editor.');
  await page.getByRole('button', { name: 'Usar preset Azul' }).click();

  const editorGeometry = await customizer.evaluate((element) => {
    const footer = element.querySelector('.profile-customizer__footer')!.getBoundingClientRect();
    return {
      scrollable: element.scrollHeight > element.clientHeight,
      footerVisible: footer.top >= 0 && footer.bottom <= window.innerHeight
    };
  });
  expect(editorGeometry.scrollable).toBe(true);
  expect(editorGeometry.footerVisible).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('profile-editor.png'), fullPage: true });

  await page.getByRole('button', { name: 'Guardar alterações' }).click();
  await request.waitForPatch();
  await expect(page.getByRole('button', { name: 'Guardando…' })).toBeDisabled();
  await expect(page.getByRole('textbox', { name: 'Display name / nick' })).toBeDisabled();
  await expect(primaryPicker).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Usar preset Azul' })).toBeDisabled();
  request.releasePatch();

  await expect(page.getByRole('heading', { name: 'Editar perfil' })).toHaveCount(0);
  await expect(page.getByText('Bio salva com sucesso.')).toHaveAttribute('aria-live', 'polite');
  expect(request.getPatchPayload()).toEqual({
    displayName: 'Maria Atualizada',
    bio: 'Bio atualizada pelo editor.',
    profileColor: '#1D4ED8'
  });
});
