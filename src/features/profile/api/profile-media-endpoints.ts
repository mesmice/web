import { ApiRequestError, apiFetch, putPresignedObject } from '../../../lib/api/client.js';
import type { PrivateUser } from '../../../lib/types/auth.js';
import type { ProcessedProfileMedia } from '../media/image-processing.js';

export type ProfileMediaKind = 'avatar' | 'banner';

export interface ProfileMediaUploadIntent {
  uploadUrl: string;
  method: 'PUT';
  headers: Record<string, string>;
  publicUrl: string;
  objectKey: string;
  expiresInSeconds: number;
}

interface ProfileResponse {
  user: PrivateUser;
}

export function createProfileMediaIntent(
  kind: ProfileMediaKind,
  contentType: ProcessedProfileMedia['mimeType']
): Promise<ProfileMediaUploadIntent> {
  return apiFetch(`/uploads/${kind}`, { method: 'POST', body: { contentType } });
}

export function confirmProfileMedia(kind: ProfileMediaKind, objectKey: string): Promise<PrivateUser> {
  if (objectKey.startsWith('data:')) {
    throw new Error('A confirmação deve usar objectKey, não uma Data URL.');
  }
  return apiFetch<ProfileResponse>(`/users/me/${kind}`, {
    method: 'PATCH',
    body: { objectKey }
  }).then((response) => response.user);
}

export async function uploadProfileMedia(
  kind: ProfileMediaKind,
  media: ProcessedProfileMedia,
  signal?: AbortSignal
): Promise<PrivateUser> {
  if (!(media.blob instanceof Blob)) {
    throw new Error('A imagem processada precisa ser enviada como Blob.');
  }
  const intent = await createProfileMediaIntent(kind, media.mimeType);
  await putPresignedObject(intent.uploadUrl, media.blob, intent.headers, signal);
  return confirmProfileMedia(kind, intent.objectKey);
}

export function getProfileMediaErrorMessage(error: unknown): string {
  if (!(error instanceof ApiRequestError)) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return 'O envio foi cancelado.';
    }
    return error instanceof Error && error.message
      ? error.message
      : 'Não foi possível enviar a imagem.';
  }
  if (error.code === 'REQUEST_ABORTED') return 'O envio foi cancelado.';
  if (error.status === 401 || error.code === 'UNAUTHORIZED' || error.code === 'SESSION_EXPIRED') {
    return 'Sua sessão expirou. Entre novamente para continuar.';
  }
  if (error.status === 403 || error.code === 'FORBIDDEN') {
    return 'Você não tem permissão para alterar esta imagem.';
  }
  if (error.code === 'PAYLOAD_TOO_LARGE' || error.status === 413) {
    return 'Este arquivo é demasiado grande. Escolha uma imagem de até 4 MiB.';
  }
  if (error.code === 'UNSUPPORTED_MEDIA_TYPE' || error.status === 415) {
    return 'Este formato de arquivo não é suportado.';
  }
  if (error.status === 429 || error.code === 'RATE_LIMITED') {
    return 'Muitas tentativas de upload. Aguarde um pouco e tente novamente.';
  }
  if (error.code === 'NOT_FOUND' || error.status === 404) {
    return 'O upload não foi encontrado. Tente enviar novamente.';
  }
  if (error.code === 'NETWORK_ERROR' || error.status === 0) {
    return 'Não foi possível conectar ao serviço de mídia. Tente novamente.';
  }
  if (error.status >= 500 || error.code === 'INTERNAL' || error.code === 'MAINTENANCE') {
    return 'O serviço de mídia está temporariamente indisponível.';
  }
  return error.message && !error.message.startsWith('Erro HTTP')
    ? error.message
    : 'Não foi possível enviar esta imagem. Tente novamente.';
}
