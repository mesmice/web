import { test, expect, type Page } from '@playwright/test';

test('app carrega e mostra a home', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Encontre os teus. Fique por aqui.' })
  ).toBeVisible();
});

test('a narrativa O que é pode ser alcançada por scroll', async ({ page }) => {
  await page.goto('/');
  const section = page.locator('#o-que-e');
  await section.scrollIntoViewIfNeeded();

  await expect(
    page.getByRole('heading', {
      name: /Onde os mesmos se encontram/i
    })
  ).toBeVisible();
  await expect(section.getByRole('article')).toHaveCount(3);
  await expect(section.getByText('01 — CONVERSAS')).toBeAttached();
  await expect(section.getByText('02 — COMUNIDADES')).toBeAttached();
  await expect(section.getByText('03 — PRIVACIDADE')).toBeAttached();
  await expect(section.getByText('Feito para ficar perto.')).toHaveCount(0);
  await expect(section.locator('img[alt=""]')).toHaveCount(3);
  await expect(page.getByRole('heading', { name: /Por que escolher o Mesmice/i })).toBeAttached();
});

test('a secção Por que Mesmice mantém a narrativa completa e sem overflow horizontal', async ({
  page
}) => {
  await page.goto('/');
  const section = page.locator('#por-que-mesmice');
  await section.scrollIntoViewIfNeeded();

  await expect(section.getByRole('heading', { level: 2 })).toBeVisible();
  await expect(section.getByRole('article')).toHaveCount(4);
  await expect(section.getByRole('heading', { name: 'Seus dados continuam seus.' })).toBeAttached();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    await page.evaluate(() => document.documentElement.clientWidth)
  );
});

test('o footer encerra a landing com navegação completa e sem overflow no mobile', async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const footer = page.getByRole('contentinfo');
  await footer.scrollIntoViewIfNeeded();

  await expect(
    footer.getByRole('heading', { name: 'A sua próxima conversa pode começar aqui.' })
  ).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Criar conta' })).toHaveAttribute(
    'href',
    '/register'
  );
  await expect(footer.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/login');
  await expect(footer.getByRole('link', { name: 'Como funciona' })).toHaveAttribute(
    'href',
    '#o-que-e'
  );
  await expect(footer.getByRole('link', { name: 'Termos' })).toHaveAttribute(
    'href',
    '#footer-navigation'
  );
  await expect(footer.getByText('/ até logo')).toHaveCount(0);
  await expect(footer.getByRole('heading', { name: 'CONTA' })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    await page.evaluate(() => document.documentElement.clientWidth)
  );
});

test('Por que Mesmice mantém todo o conteúdo com movimento reduzido', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const section = page.locator('#por-que-mesmice');
  await section.scrollIntoViewIfNeeded();

  await expect(section.getByRole('article')).toHaveCount(4);
  await expect(section.getByRole('article').first()).toHaveCSS('opacity', '1');
  await expect(section.getByRole('article').first()).toHaveCSS('animation-name', 'none');
});

test('a transição contextual de tema é progressiva e reversível', async ({ page }) => {
  await page.goto('/');
  const why = page.locator('#por-que-mesmice');
  await why.scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);

  const darkProgress = await page
    .locator('.landing-page')
    .evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).getPropertyValue('--landing-theme-progress'))
    );
  expect(darkProgress).toBeGreaterThan(95);

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(100);
  const lightProgress = await page
    .locator('.landing-page')
    .evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).getPropertyValue('--landing-theme-progress'))
    );
  expect(lightProgress).toBeLessThan(1);
});

test('desktop apresenta pelo menos dois argumentos no mesmo viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page
    .locator('#por-que-mesmice')
    .evaluate((section) =>
      window.scrollTo(0, section.getBoundingClientRect().top + window.scrollY + 360)
    );
  await page.waitForTimeout(100);

  const visibleCards = await page.locator('.why-mesmice-card').evaluateAll(
    (cards) =>
      cards.filter((card) => {
        const rect = card.getBoundingClientRect();
        return rect.bottom > 0 && rect.top < window.innerHeight;
      }).length
  );
  expect(visibleCards).toBeGreaterThanOrEqual(2);
});

test('rota de login responde', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Bem-vindo de volta!' })).toBeVisible();
});

test('rota de perfil redireciona visitante anônimo ao login', async ({ page }) => {
  await page.goto('/profile');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Bem-vindo de volta!' })).toBeVisible();
});

async function mockAuthenticatedProfile(page: Page) {
  await page.addInitScript(() => localStorage.setItem('mesmice.refresh', 'saved-refresh'));
  await page.route('**/api/v1/auth/refresh', async (route) => {
    await route.fulfill({
      json: { accessToken: 'profile-access', refreshToken: 'rotated-refresh' }
    });
  });
  await page.route('**/api/v1/users/me', async (route) => {
    await route.fulfill({
      json: {
        user: {
          id: '9000000000000000001',
          username: 'maria',
          displayName: 'Maria Souza',
          bio: 'Construindo comunidades com cuidado e criando espaços para boas conversas.',
          avatarUrl: '/images/auth/mascote-neutro-lightmode.png',
          avatarThumbUrl: null,
          bannerUrl: '/images/landing-page/what-is/community-card.png',
          externalLinks: [{ label: 'Site pessoal', url: 'https://example.com' }],
          profileTheme: null,
          avatarFrameUrl: null,
          profileColor: '#8b5cf6',
          badges: [],
          presence: 'online',
          lastActiveAt: '2026-01-01T12:00:00.000Z',
          createdAt: '2026-01-01T12:00:00.000Z',
          email: 'maria@example.com',
          emailVerified: true
        }
      }
    });
  });
}

test('usuário autenticado acessa o perfil sem overflow no mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockAuthenticatedProfile(page);
  await page.goto('/profile');

  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByRole('heading', { name: 'Maria Souza' })).toBeVisible();
  await expect(page.getByText(/Construindo comunidades/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Personalizar perfil' })).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    await page.evaluate(() => document.documentElement.clientWidth)
  );
});

test('perfil local preserva hierarquia e mídia no desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockAuthenticatedProfile(page);
  await page.goto('/profile');

  await expect(page.getByRole('heading', { name: 'Maria Souza' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Avatar de Maria Souza' })).toBeVisible();
  await expect(page.locator('.profile-header__banner-image')).toBeVisible();
  await expect(page.getByRole('link', { name: /Site pessoal/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Personalizar perfil' })).toBeVisible();
  await expect(page.getByText('128 amigos')).toBeVisible();
  await expect(page.locator('.profile-meta')).toHaveCSS('border-width', '0px');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    await page.evaluate(() => document.documentElement.clientWidth)
  );
});

for (const viewport of [
  { width: 375, height: 844 },
  { width: 430, height: 932 },
  { width: 1920, height: 1080 }
]) {
  test(`perfil permanece responsivo em ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await mockAuthenticatedProfile(page);
    await page.goto('/profile');

    await expect(page.getByRole('heading', { name: 'Maria Souza' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Conexões' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Destaque' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      await page.evaluate(() => document.documentElement.clientWidth)
    );
  });
}

test('tema do Profile permanece independente do App Theme no browser', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockAuthenticatedProfile(page);
  await page.goto('/profile');

  const primary = page.getByRole('textbox', { name: 'Cor principal hexadecimal' });
  const secondary = page.getByRole('textbox', { name: 'Cor secundária hexadecimal' });
  const shell = page.locator('.profile-shell');

  for (const combination of [
    { appTheme: 'light', primary: '#FFFFFF', secondary: '#E9E9EF' },
    { appTheme: 'dark', primary: '#FFFFFF', secondary: '#E9E9EF' },
    { appTheme: 'light', primary: '#080808', secondary: '#1E1028' },
    { appTheme: 'dark', primary: '#080808', secondary: '#1E1028' },
    { appTheme: 'light', primary: '#8B5CF6', secondary: '#D8CCFF' },
    { appTheme: 'dark', primary: '#1D4ED8', secondary: '#93C5FD' }
  ]) {
    await primary.fill(combination.primary);
    await secondary.fill(combination.secondary);
    await page.evaluate((theme) => {
      document.documentElement.dataset.theme = theme;
    }, combination.appTheme);

    await expect(shell).toHaveCSS('--profile-color-primary', combination.primary);
    await expect(shell).toHaveCSS('--profile-color-secondary', combination.secondary);
  }

  await page.getByRole('radio', { name: 'Gradiente' }).check();
  await page.getByRole('textbox', { name: 'Cor 1 hexadecimal' }).fill('#FFB6D9');
  await page.getByRole('textbox', { name: 'Cor 2 hexadecimal' }).fill('#8B5CF6');
  await expect(shell).toHaveAttribute('data-nickname-mode', 'gradient');
});

test('login destaca campos vazios ao tentar entrar', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByPlaceholder(/voce@exemplo.com/)).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByPlaceholder('Sua senha')).toHaveAttribute('aria-invalid', 'true');
});

test('inputs com ícones preservam espaço para o conteúdo', async ({ page }) => {
  await page.goto('/login');

  const emailInput = page.getByPlaceholder(/voce@exemplo.com/);
  const passwordInput = page.getByPlaceholder('Sua senha');

  expect(
    await emailInput.evaluate((element) => Number.parseFloat(getComputedStyle(element).paddingLeft))
  ).toBeGreaterThan(32);
  expect(
    await passwordInput.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).paddingRight)
    )
  ).toBeGreaterThan(40);
});

test('cadastro permite montar um perfil em etapas', async ({ page }) => {
  await page.goto('/register');
  await expect(page.getByRole('heading', { name: 'Crie seu cantinho' })).toBeVisible();
  await page.getByPlaceholder('Seu nome').fill('Pessoa Mesmice');
  await page.getByPlaceholder('como_te_encontram_no_mesmice').fill('pessoa_mesmice');
  await page.getByPlaceholder('voce@exemplo.com').fill('pessoa@exemplo.com');
  await page.getByPlaceholder('Pelo menos 8 caracteres').fill('senha-segura');
  await page.getByPlaceholder('Digite a senha novamente').fill('senha-segura');
  await page.getByRole('checkbox', { name: /termos de uso/ }).check();
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByRole('radio', { name: 'Masculino' })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Masculino' })).toHaveCount(0);
  await page.getByLabel('Dia de nascimento').selectOption('20');
  await page.getByLabel('Mês de nascimento').selectOption('05');
  await page.getByLabel('Ano de nascimento').selectOption('1998');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByRole('heading', { name: 'O que te interessa?' })).toBeVisible();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Criar meu perfil' }).click();
  await expect(page.getByRole('heading', { name: 'Seu perfil está pronto!' })).toBeVisible();
});
