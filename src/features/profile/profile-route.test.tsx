import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { RequireAuth } from '../auth/require-auth.js';
import { useAuthStore } from '../../stores/auth-store.js';
import { MOCK_USER } from '../../mocks/test-handlers.js';
import { ProfilePage } from './profile-page.js';

function renderProfileRoute(): void {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/profile']}>
        <Routes>
          <Route element={<RequireAuth />}>
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
          <Route path="/login" element={<h1>Login</h1>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  cleanup();
  localStorage.clear();
  useAuthStore.setState({ status: 'anonymous', accessToken: null, user: null, sessionEnd: null });
});

describe('rota /profile', () => {
  it('redireciona usuário anônimo para o login', () => {
    renderProfileRoute();

    expect(screen.getByRole('heading', { name: 'Login' })).toBeDefined();
  });

  it('permite que usuário autenticado carregue o próprio perfil', async () => {
    useAuthStore.getState().setSession('profile-access', MOCK_USER);
    renderProfileRoute();

    expect(await screen.findByRole('heading', { level: 1, name: 'Maria Souza' })).toBeDefined();
  });
});
