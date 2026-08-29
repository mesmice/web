import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateProfile } from '../api/profile-endpoints.js'
import { profileKeys } from '../api/profile-query-keys.js'

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (profile) => {
      queryClient.setQueryData(profileKeys.me(), profile)
    }
  })
}
