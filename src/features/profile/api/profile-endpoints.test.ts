import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiFetch } from '../../../lib/api/client.js'
import { getPublicProfile, searchUsers } from '../../../lib/api/endpoints.js'

vi.mock('../../../lib/api/client.js', () => ({ apiFetch: vi.fn() }))

const mockedApiFetch = vi.mocked(apiFetch)

describe('profile social API endpoints', () => {
  beforeEach(() => mockedApiFetch.mockReset())

  it('gets a public profile by encoded user id', async () => {
    mockedApiFetch.mockResolvedValue({ user: { id: 'user/1' } })

    await getPublicProfile('user/1')

    expect(mockedApiFetch).toHaveBeenCalledWith('/users/user%2F1')
  })

  it('builds search query parameters without inventing relationship fields', async () => {
    mockedApiFetch.mockResolvedValue({ items: [], meta: { nextCursor: null } })

    await searchUsers('Ana Silva', { limit: 20, cursor: 'next-page' })

    expect(mockedApiFetch).toHaveBeenCalledWith(
      '/users/search?query=Ana+Silva&limit=20&cursor=next-page'
    )
  })
})
