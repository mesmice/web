import { apiFetch } from '../../../lib/api/client.js'
import type { ExternalLink, PrivateUser, UserPresence } from '../../../lib/types/auth.js'

export interface UpdateProfilePayload {
  displayName?: string
  bio?: string | null
  avatarUrl?: string | null
  bannerUrl?: string | null
  externalLinks?: ExternalLink[]
  profileTheme?: string | null
  avatarFrameUrl?: string | null
  profileColor?: string | null
  presence?: UserPresence
}

interface ProfileResponse {
  user: PrivateUser
}

export async function getMyProfile(): Promise<PrivateUser> {
  const response = await apiFetch<ProfileResponse>('/users/me')
  return response.user
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<PrivateUser> {
  const response = await apiFetch<ProfileResponse>('/users/me', {
    method: 'PATCH',
    body: payload
  })
  return response.user
}
