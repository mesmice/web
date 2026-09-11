import { expect, test, type Page } from '@playwright/test';

const conversation = {
  id: 'dm-1',
  ownerId: 'user-1',
  type: 'DM',
  name: null,
  participantIds: ['user-1', 'user-2'],
  participants: [
    { id: 'user-1', username: 'ana', displayName: 'Ana', avatarUrl: null, presence: 'online' },
    { id: 'user-2', username: 'bia', displayName: 'Bia', avatarUrl: null, presence: 'offline' }
  ],
  unreadCount: 0,
  createdAt: '2026-09-10T09:00:00.000Z',
  lastMessageAt: null,
  permissions: { default: '0', memberOverwrites: [] }
};

async function mockAuthenticatedDms(page: Page) {
  await page.addInitScript(() => localStorage.setItem('mesmice.refresh', 'saved-refresh'));
  await page.route('**/api/v1/auth/refresh', async (route) => {
    await route.fulfill({ json: { accessToken: 'dm-access', refreshToken: 'rotated-refresh' } });
  });
  await page.route('**/api/v1/users/me', async (route) => {
    await route.fulfill({
      json: {
        user: {
          id: 'user-1',
          username: 'ana',
          displayName: 'Ana',
          bio: null,
          avatarUrl: null,
          avatarThumbUrl: null,
          bannerUrl: null,
          externalLinks: [],
          profileTheme: null,
          avatarFrameUrl: null,
          profileColor: null,
          badges: [],
          presence: 'online',
          lastActiveAt: null,
          createdAt: '2026-09-10T09:00:00.000Z',
          email: 'ana@example.com',
          emailVerified: true
        }
      }
    });
  });
  await page.route('**/api/v1/channels?**', async (route) => {
    await route.fulfill({ json: { items: [conversation] } });
  });
  await page.route('**/api/v1/channels/*/messages?**', async (route) => {
    await route.fulfill({ json: { items: [], meta: { nextCursor: null } } });
  });
  await page.route('**/api/v1/channels/*/read', async (route) => {
    await route.fulfill({ json: { lastReadMessageId: null } });
  });
}

test('desktop mantém lista, conversa, URL e foco durante voltar e avançar', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await mockAuthenticatedDms(page);
  await page.goto('/app/dms');

  const list = page.getByRole('complementary', { name: 'Conversas diretas' });
  await expect(list).toBeVisible();
  await expect(page.getByText('Selecione uma conversa')).toBeVisible();

  await page.getByRole('button', { name: 'Bia' }).click();
  await expect(page).toHaveURL(/\/app\/dms\/dm-1$/);
  await expect(list).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Bia' })).toBeFocused();

  await page.goBack();
  await expect(page).toHaveURL(/\/app\/dms$/);
  await expect(page.getByRole('button', { name: 'Bia' })).toBeFocused();
  await page.goForward();
  await expect(page.getByRole('heading', { name: 'Bia' })).toBeFocused();
});

test('mobile alterna lista e conversa e permite voltar após acesso direto', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockAuthenticatedDms(page);
  await page.goto('/app/dms/dm-1');

  await expect(page.getByRole('heading', { name: 'Bia' })).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Conversas diretas' })).toBeHidden();
  await page.getByRole('button', { name: 'Voltar para conversas' }).click();
  await expect(page).toHaveURL(/\/app\/dms$/);
  await expect(page.getByRole('complementary', { name: 'Conversas diretas' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Bia' })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(
    await page.evaluate(() => document.documentElement.clientHeight)
  );
});

test('ID ausente oferece ações neutras e retorno no mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockAuthenticatedDms(page);
  await page.goto('/app/dms/fora-da-lista');

  await expect(page.getByRole('heading', { name: 'Conversa indisponível' })).toBeFocused();
  await expect(page.getByText(/não está disponível na lista carregada/i)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Atualizar' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Voltar às mensagens' })).toHaveCount(2);
  await expect(page.getByText(/removid/i)).toHaveCount(0);
});
