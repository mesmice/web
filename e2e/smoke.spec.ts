import { test, expect } from '@playwright/test';

test('app carrega e mostra a home', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Seja bem-vindo de volta!' })).toBeVisible();
});

test('rota de login responde', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Bem-vindo de volta!' })).toBeVisible();
});

test('login destaca campos vazios ao tentar entrar', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByPlaceholder(/voce@exemplo.com/)).toHaveClass(/border-red-500/);
  await expect(page.getByPlaceholder('Sua senha')).toHaveClass(/border-red-500/);
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
  await page.getByLabel('Dia de nascimento').selectOption('20');
  await page.getByLabel('Mês de nascimento').selectOption('05');
  await page.getByLabel('Ano de nascimento').selectOption('1998');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByRole('heading', { name: 'O que te interessa?' })).toBeVisible();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Criar meu perfil' }).click();
  await expect(page.getByRole('heading', { name: 'Seu perfil está pronto!' })).toBeVisible();
});
