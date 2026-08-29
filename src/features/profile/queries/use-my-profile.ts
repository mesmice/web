import { useQuery } from '@tanstack/react-query'
import { getMe } from '../../../lib/api/endpoints.js'

export const profileQueryKeys = {
  all: ['profile'] as const,
  me: () => [...profileQueryKeys.all, 'me'] as const
}

export function useMyProfile() {
  return useQuery({
    queryKey: profileQueryKeys.me(),
    queryFn: getMe,
    select: (response) => response.user
  })
}
