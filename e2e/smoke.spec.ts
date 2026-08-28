import { test, expect } from '@playwright/test';

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
    await passwordInput.evaluate((element) => Number.parseFloat(getComputedStyle(element).paddingRight))
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
