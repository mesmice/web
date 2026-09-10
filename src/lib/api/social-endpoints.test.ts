import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiFetch } from './client.js'
import {
  acceptFriendRequest,
  declineFriendRequest,
  getFriendRequests,
  getFriends,
  removeFriend,
  sendFriendRequest
} from './endpoints.js'

vi.mock('./client.js', () => ({ apiFetch: vi.fn() }))

const mockedApiFetch = vi.mocked(apiFetch)

describe('social API endpoints', () => {
  beforeEach(() => mockedApiFetch.mockReset())

  it('gets cursor-paginated friends', async () => {
    mockedApiFetch.mockResolvedValue({ items: [], meta: { nextCursor: 'cursor-2' } })

    await getFriends({ limit: 25, cursor: 'cursor-1' })

    expect(mockedApiFetch).toHaveBeenCalledWith('/friends?limit=25&cursor=cursor-1')
  })

  it('gets received friend requests', async () => {
    mockedApiFetch.mockResolvedValue({ items: [] })

    await getFriendRequests()

    expect(mockedApiFetch).toHaveBeenCalledWith('/friends/requests')
  })

  it('sends a friend request with the real payload', async () => {
    mockedApiFetch.mockResolvedValue({ accepted: false, request: {} })

    await sendFriendRequest('user-2')

    expect(mockedApiFetch).toHaveBeenCalledWith('/friends/requests', {
      method: 'POST',
      body: { addresseeId: 'user-2' }
    })
  })

  it('accepts and declines requests', async () => {
    mockedApiFetch.mockResolvedValueOnce({ friend: {} }).mockResolvedValueOnce(undefined)

    await acceptFriendRequest('request-1')
    await declineFriendRequest('request-1')

    expect(mockedApiFetch).toHaveBeenNthCalledWith(1, '/friends/requests/request-1/accept', {
      method: 'POST'
    })
    expect(mockedApiFetch).toHaveBeenNthCalledWith(2, '/friends/requests/request-1/decline', {
      method: 'POST'
    })
  })

  it('removes a friend and preserves the 204 result as void', async () => {
    mockedApiFetch.mockResolvedValue(undefined)

    await expect(removeFriend('user/2')).resolves.toBeUndefined()
    expect(mockedApiFetch).toHaveBeenCalledWith('/friends/user%2F2', { method: 'DELETE' })
  })
})
