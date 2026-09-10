import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { MOCK_USER } from '../../../mocks/test-handlers.js';
import { server } from '../../../mocks/node.js';
import { useAuthStore } from '../../../stores/auth-store.js';
import { profileKeys } from '../api/profile-query-keys.js';
import { useUploadProfileMedia } from './use-upload-profile-media.js';

const media = {
  blob: new Blob(['bytes'], { type: 'image/webp' }),
  width: 512,
  height: 512,
  mimeType: 'image/webp' as const
};

describe('useUploadProfileMedia', () => {
  it('atualiza imediatamente profileKeys.me() com o usuário confirmado', async () => {
    const updatedUser = { ...MOCK_USER, avatarUrl: 'https://cdn/avatar.webp' };
    useAuthStore.getState().setSession('profile-access', MOCK_USER);
    server.use(
      http.post('*/api/v1/uploads/avatar', () =>
        HttpResponse.json(
          {
            method: 'PUT',
            uploadUrl: 'https://storage.test/avatar',
            headers: { 'Content-Type': 'image/webp' },
            publicUrl: 'https://cdn/avatar.webp',
            objectKey: 'avatars/9000000000000000001/1.webp',
            expiresInSeconds: 600
          },
          { status: 201 }
        )
      ),
      http.put('https://storage.test/avatar', () => new HttpResponse(null, { status: 200 })),
      http.patch('*/api/v1/users/me/avatar', () => HttpResponse.json({ user: updatedUser }))
    );
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    queryClient.setQueryData(profileKeys.me(), MOCK_USER);
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const mutation = renderHook(() => useUploadProfileMedia(), { wrapper });

    await act(async () => {
      await mutation.result.current.mutateAsync({ kind: 'avatar', media });
    });

    expect(queryClient.getQueryData(profileKeys.me())).toEqual(updatedUser);
  });
});