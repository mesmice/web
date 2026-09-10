import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/auth-store.js';
import {
  acceptFriendRequest,
  declineFriendRequest,
  getFriendRequests,
  getFriends,
  type SocialUser
} from '../../lib/api/endpoints.js';
import type { ApiRequestError } from '../../lib/api/client.js';
import { FriendList, type FriendListItem } from './components/friend-list.js';
import { mapFriendFromApi } from './components/friend-list-mapper.js';
import { FriendRequests } from './components/friend-requests.js';
import { mapFriendRequestFromApi } from './components/friend-request-mapper.js';
import { SocialNavigation, type SocialTab } from './components/social-navigation.js';
import { ConversationPanel } from '../messages/components/conversation-panel.js';
import { socialKeys } from './api/social-query-keys.js';

function getErrorMessage(error: unknown) {
  return error && typeof error === 'object' && 'message' in error
    ? String((error as ApiRequestError).message)
    : 'Tente novamente em alguns instantes.';
}

function mapPresenceToStatus(presence: SocialUser['presence']): FriendListItem['status'] {
  if (presence === 'online') return 'online';
  if (presence === 'dnd') return 'busy';
  if (presence === 'idle') return 'away';
  return 'offline';
}

function mapSocialUser(user: SocialUser): FriendListItem {
  return mapFriendFromApi({
    id: user.id,
    displayName: user.displayName,
    username: user.username,
    avatarUrl: user.avatarUrl,
    status: mapPresenceToStatus(user.presence),
    bio: user.bio,
    lastActiveLabel: user.presence === 'online' ? 'Disponível agora' : null
  });
}

export function SocialDemoPage() {
  const [activeTab, setActiveTab] = useState<SocialTab>('all');
  const [selectedFriend, setSelectedFriend] = useState<FriendListItem | null>(null);
  const currentUserId = useAuthStore((state) => state.user?.id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const friendsQuery = useQuery({
    queryKey: socialKeys.friends(),
    queryFn: () => getFriends()
  });
  const requestsQuery = useQuery({
    queryKey: socialKeys.requests(),
    queryFn: getFriendRequests
  });
  const requestMutation = useMutation({
    mutationFn: async ({
      requestId,
      action
    }: {
      requestId: string;
      action: 'accept' | 'decline';
    }) => {
      if (action === 'accept') await acceptFriendRequest(requestId);
      else await declineFriendRequest(requestId);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: socialKeys.friends() }),
        queryClient.invalidateQueries({ queryKey: socialKeys.requests() })
      ]);
    }
  });

  const friends = useMemo(
    () => friendsQuery.data?.items.map(({ user }) => mapSocialUser(user)) ?? [],
    [friendsQuery.data]
  );
  const activeFriends = useMemo(
    () => friends.filter((friend) => friend.status === 'online' || friend.status === 'busy'),
    [friends]
  );
  const receivedRequests = useMemo(
    () =>
      requestsQuery.data?.items.map(({ request, requester }) =>
        mapFriendRequestFromApi({
          id: request.id,
          userId: requester.id,
          displayName: requester.displayName,
          username: requester.username,
          avatarUrl: requester.avatarUrl,
          requestedAtLabel: new Date(request.createdAt).toLocaleDateString('pt-BR')
        })
      ) ?? [],
    [requestsQuery.data]
  );

  return (
    <main className="min-h-screen bg-[color:var(--color-surface)] px-4 py-8 text-[color:var(--color-text-primary)] md:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[color:var(--color-border-default)]">
        <SocialNavigation activeTab={activeTab} onChange={setActiveTab} />

        <div className="relative min-h-[560px] overflow-hidden bg-[color:var(--color-surface-primary)]">
          <div
            className={[
              'absolute inset-0 p-4 transition-all duration-300 ease-out',
              activeTab === 'all' || activeTab === 'active'
                ? 'translate-x-0 opacity-100'
                : '-translate-x-4 opacity-0 pointer-events-none'
            ].join(' ')}
            aria-hidden={activeTab !== 'all' && activeTab !== 'active'}
          >
            <div className="flex flex-col gap-4 lg:flex-row">
              <FriendList
                title="Amigos"
                items={activeTab === 'active' ? activeFriends : friends}
                showOnlyActive={activeTab === 'active'}
                className="rounded-none border-0 p-0 lg:min-w-0 lg:flex-1"
                isLoading={friendsQuery.isLoading}
                error={friendsQuery.isError ? getErrorMessage(friendsQuery.error) : null}
                onRetry={() => void friendsQuery.refetch()}
                onProfileClick={(friend) => navigate(`/users/${encodeURIComponent(friend.id)}`)}
                onMessageClick={setSelectedFriend}
              />
              {selectedFriend ? (
                <div className="lg:w-[min(480px,42%)]">
                  <ConversationPanel
                    friend={selectedFriend}
                    currentUserId={currentUserId}
                    onClose={() => setSelectedFriend(null)}
                  />
                </div>
              ) : null}
            </div>
          </div>

          <div
            className={[
              'absolute inset-0 p-4 transition-all duration-300 ease-out',
              activeTab === 'requests'
                ? 'translate-x-0 opacity-100'
                : 'translate-x-4 opacity-0 pointer-events-none'
            ].join(' ')}
            aria-hidden={activeTab !== 'requests'}
          >
            <FriendRequests
              title="Solicitações"
              receivedItems={receivedRequests}
              sentItems={[]}
              isLoading={requestsQuery.isLoading}
              error={requestsQuery.isError ? getErrorMessage(requestsQuery.error) : null}
              onRetry={() => void requestsQuery.refetch()}
              className="rounded-none border-0 p-0"
              onAccept={(friend) =>
                requestMutation.mutate({ requestId: friend.id, action: 'accept' })
              }
              onDecline={(friend) =>
                requestMutation.mutate({ requestId: friend.id, action: 'decline' })
              }
              onViewProfile={(friend) => {
                if (friend.userId) navigate(`/users/${encodeURIComponent(friend.userId)}`);
              }}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
