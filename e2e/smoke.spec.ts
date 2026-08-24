import { test, expect } from '@playwright/test';

test('app carrega e mostra a home', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Encontra os teus. Fica por aí.' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toBeVisible();
});

test('menu mobile abre, fecha com Escape e fecha ao selecionar um link', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const menuButton = page.getByRole('button', { name: 'Abrir menu' });
  await expect(menuButton).toBeVisible();
  await expect(menuButton).toHaveAttribute('aria-expanded', 'false');

  await menuButton.click();
  await expect(page.getByRole('button', { name: 'Fechar menu' })).toHaveAttribute(
    'aria-expanded',
    'true'
  );
  await expect(page.getByRole('link', { name: 'Comunidades' })).toBeVisible();
  await expect(page.locator('.landing-navbar__mobile-menu')).toHaveCSS('position', 'fixed');
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');

  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Abrir menu' })).toHaveAttribute(
    'aria-expanded',
    'false'
  );
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');

  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await page.getByRole('link', { name: 'O que é' }).click();
  await expect(page.getByRole('button', { name: 'Abrir menu' })).toHaveAttribute(
    'aria-expanded',
    'false'
  );

  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await page.setViewportSize({ width: 1024, height: 768 });
  const hiddenMenuButton = page.locator('.landing-navbar__menu-button');
  await expect(hiddenMenuButton).toBeHidden();
  await expect(hiddenMenuButton).toHaveAttribute('aria-expanded', 'false');

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: 'Abrir menu' })).toBeVisible();
  await expect(page.locator('.landing-navbar__mobile-menu')).toBeHidden();
});

for (const viewport of [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 393, height: 852 },
  { width: 414, height: 896 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 }
]) {
  test(`home não causa overflow horizontal em ${viewport.width}x${viewport.height}`, async ({
    page
  }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');

    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(documentWidth).toBe(viewport.width);
    await expect(
      page.getByRole('heading', { name: 'Encontra os teus. Fica por aí.' })
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Criar conta', exact: true }).last()).toBeVisible();
  });
}

test('rota de login responde', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Entrar no Mesmice' })).toBeVisible();
});
