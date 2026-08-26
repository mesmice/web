import { QueryClient } from '@tanstack/react-query'

/**
 * Singleton do QueryClient: permite que a camada de sessão (`lib/auth`)
 * limpe o cache no fim da sessão sem depender da árvore React.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
})
