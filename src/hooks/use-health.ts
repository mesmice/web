import { useQuery } from '@tanstack/react-query'
import { getReadiness } from '../lib/api/endpoints.js'

export function useHealth() {
  return useQuery({
    queryKey: ['health', 'ready'],
    queryFn: getReadiness,
    retry: false,
    refetchInterval: 30_000
  })
}
