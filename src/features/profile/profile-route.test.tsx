import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, useRoutes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/node.js';
import { useAuthStore } from '../../stores/auth-store.js';
import { MOCK_USER } from '../../mocks/test-handlers.js';
import { createProfileRoute } from '../../routes/router.js';
import { PublicProfileRoute } from './profile-page.js';

function ProfileTestRoutes({ isDevelopment }: { isDevelopment: boolean }) {
  return useRoutes([
    createProfileRoute(isDevelopment),
    { path: '/users/:userId', element: <PublicProfileRoute /> },
    { path: '/login', element: <h1>Login</h1> }
  ]);
}

function renderProfileRoute(isDevelopment: boolean): void {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/profile']}>
        <ProfileTestRoutes isDevelopment={isDevelopment} />
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
  it('mantém o perfil protegido também em DEV', () => {
    renderProfileRoute(true);

    expect(screen.getByRole('heading', { name: 'Login' })).toBeDefined();
    expect(screen.queryByRole('heading', { level: 1, name: 'Maria Souza' })).toBeNull();
  });

  it('mantém o perfil protegido para visitante anônimo em produção', () => {
    renderProfileRoute(false);

    expect(screen.getByRole('heading', { name: 'Login' })).toBeDefined();
    expect(screen.queryByRole('heading', { level: 1, name: 'Maria Souza' })).toBeNull();
  });

  it('permite que usuário autenticado carregue o próprio perfil', async () => {
    useAuthStore.getState().setSession('profile-access', MOCK_USER);
    renderProfileRoute(false);

    expect(await screen.findByRole('heading', { level: 1, name: 'Maria Souza' })).toBeDefined();
    expect(screen.queryByText('Construindo comunidades com cuidado e criando espaços para boas conversas.')).toBeNull();
    expect(screen.getByText('Nenhuma bio adicionada.')).toBeDefined();
  });

  it('resolve /users/:userId para o perfil público autenticado', async () => {
    useAuthStore.getState().setSession('profile-access', MOCK_USER);
    server.use(
      http.get('*/api/v1/users/9000000000000000001', () =>
        HttpResponse.json({ user: { ...MOCK_USER, presence: 'offline' } })
      )
    );
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter initialEntries={['/users/9000000000000000001']}>
          <ProfileTestRoutes isDevelopment={false} />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByRole('heading', { name: 'Maria Souza' })).toBeDefined();
    expect(screen.queryByText('Personalizar perfil')).toBeNull();
  });
});
