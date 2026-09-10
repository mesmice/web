export const socialKeys = {
  all: ['social'] as const,
  friends: (options?: { limit?: number; cursor?: string }) =>
    [...socialKeys.all, 'friends', options ?? {}] as const,
  requests: () => [...socialKeys.all, 'requests'] as const,
  search: (query: string, options?: { limit?: number; cursor?: string }) =>
    [...socialKeys.all, 'search', query, options ?? {}] as const
}
