import { useQuery } from '@tanstack/react-query'
import { getMyProfile } from '../api/profile-endpoints.js'
import { profileKeys } from '../api/profile-query-keys.js'

export function useMyProfile() {
  return useQuery({
    queryKey: profileKeys.me(),
    queryFn: getMyProfile
  })
}
