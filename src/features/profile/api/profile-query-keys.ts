export const profileKeys = {
  all: ['profile'] as const,
  me: () => [...profileKeys.all, 'me'] as const,
  public: (userId: string) => [...profileKeys.all, 'public', userId] as const
}
