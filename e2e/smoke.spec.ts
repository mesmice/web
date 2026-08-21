import { test, expect } from '@playwright/test'

test('app carrega e mostra a home', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Concord' })).toBeVisible()
})

test('rota de login responde', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Entrar no Concord' })).toBeVisible()
})
