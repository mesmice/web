import { describe, expect, it, vi } from 'vitest';
import { ApiRequestError } from '../../../lib/api/client.js';
import type { PrivateUser } from '../../../lib/types/auth.js';
import {
  confirmProfileMedia,
  createProfileMediaIntent,
  getProfileMediaErrorMessage,
  uploadProfileMedia
} from './profile-media-endpoints.js';

const user = { id: '1', avatarUrl: 'https://cdn/avatar.webp' } as PrivateUser;
const intent = {
  method: 'PUT',
  uploadUrl: 'https://storage.test/upload',
  headers: { 'Content-Type': 'image/webp' },
  publicUrl: 'https://cdn.test/avatar.webp',
  objectKey: 'avatars/1/2.webp',
  expiresInSeconds: 600
} as const;
const media = {
  blob: new Blob(['bytes'], { type: 'image/webp' }),
  width: 512,
  height: 512,
  mimeType: 'image/webp' as const
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

describe('profile media endpoints', () => {
  it('cria intenção de avatar com o MIME processado', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(intent, 201));
    vi.stubGlobal('fetch', fetchMock);

    await expect(createProfileMediaIntent('avatar', 'image/webp')).resolves.toEqual(intent);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/uploads/avatar',
      expect.objectContaining({ body: JSON.stringify({ contentType: 'image/webp' }) })
    );
  });

  it('cria intenção de banner no endpoint próprio', async () => {
    const bannerIntent = { ...intent, objectKey: 'banners/1/2.webp' };
    const fetchMock = vi.fn(async () => jsonResponse(bannerIntent, 201));
    vi.stubGlobal('fetch', fetchMock);

    await expect(createProfileMediaIntent('banner', 'image/webp')).resolves.toEqual(bannerIntent);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/uploads/banner',
      expect.objectContaining({ body: JSON.stringify({ contentType: 'image/webp' }) })
    );
  });

  it('envia Blob para a URL pré-assinada e confirma somente com objectKey', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(intent, 201))
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(jsonResponse({ user }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(uploadProfileMedia('avatar', media)).resolves.toEqual(user);
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      intent.uploadUrl,
      expect.objectContaining({ method: 'PUT', body: media.blob, headers: intent.headers })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      '/api/v1/users/me/avatar',
      expect.objectContaining({ body: JSON.stringify({ objectKey: intent.objectKey }) })
    );
    expect(JSON.stringify(fetchMock.mock.calls[2]?.[1])).not.toContain('data:');
  });

  it('impede confirmar uma Data URL', async () => {
    expect(() => confirmProfileMedia('banner', 'data:image/png;base64,abc')).toThrow('objectKey');
  });

  it.each([413, 415, 404])('preserva erro HTTP %i', async (status) => {
    const code = status === 413 ? 'PAYLOAD_TOO_LARGE' : status === 415 ? 'UNSUPPORTED_MEDIA_TYPE' : 'NOT_FOUND';
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ error: { code, message: 'Falha' } }, status)));

    await expect(createProfileMediaIntent('avatar', 'image/webp')).rejects.toMatchObject({
      status,
      code
    });
  });

  it('classifica falha de rede no PUT', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(intent, 201))
      .mockRejectedValueOnce(new TypeError('offline'));
    vi.stubGlobal('fetch', fetchMock);

    const result = uploadProfileMedia('avatar', media);
    await expect(result).rejects.toBeInstanceOf(ApiRequestError);
    await expect(result).rejects.toMatchObject({
      status: 0,
      code: 'NETWORK_ERROR'
    });
  });

  it.each([
    [401, 'UNAUTHORIZED', 'Sua sessão expirou. Entre novamente para continuar.'],
    [403, 'FORBIDDEN', 'Você não tem permissão para alterar esta imagem.'],
    [413, 'PAYLOAD_TOO_LARGE', 'Este arquivo é demasiado grande. Escolha uma imagem de até 4 MiB.'],
    [415, 'UNSUPPORTED_MEDIA_TYPE', 'Este formato de arquivo não é suportado.'],
    [429, 'RATE_LIMITED', 'Muitas tentativas de upload. Aguarde um pouco e tente novamente.'],
    [500, 'INTERNAL', 'O serviço de mídia está temporariamente indisponível.']
  ])('apresenta mensagem específica para %i', (status, code, message) => {
    expect(getProfileMediaErrorMessage(new ApiRequestError(status, code, 'Mensagem da API'))).toBe(
      message
    );
  });

  it('preserva mensagem estruturada útil da API quando não há fallback específico', () => {
    expect(getProfileMediaErrorMessage(new ApiRequestError(400, 'VALIDATION_ERROR', 'Imagem inválida.'))).toBe(
      'Imagem inválida.'
    );
  });
});
