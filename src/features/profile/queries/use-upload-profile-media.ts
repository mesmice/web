import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  uploadProfileMedia,
  type ProfileMediaKind
} from '../api/profile-media-endpoints.js';
import { profileKeys } from '../api/profile-query-keys.js';
import type { ProcessedProfileMedia } from '../media/image-processing.js';

export interface UploadProfileMediaVariables {
  kind: ProfileMediaKind;
  media: ProcessedProfileMedia;
}

export function useUploadProfileMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ kind, media }: UploadProfileMediaVariables) => uploadProfileMedia(kind, media),
    onSuccess: (profile) => {
      queryClient.setQueryData(profileKeys.me(), profile);
    }
  });
}