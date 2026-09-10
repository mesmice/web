import { useQuery } from '@tanstack/react-query'
import { getPublicProfile } from '../../../lib/api/endpoints.js'
import { profileKeys } from '../api/profile-query-keys.js'

export function usePublicProfile(userId: string) {
  return useQuery({
    queryKey: profileKeys.public(userId),
    queryFn: async () => (await getPublicProfile(userId)).user,
    enabled: userId.length > 0
  })
}
