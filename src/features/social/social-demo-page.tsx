import { useMemo, useState } from 'react';
import { FriendList, type FriendListItem, mapFriendFromApi } from './components/friend-list.js';
import {
  FriendRequests,
  type FriendRequestItem,
  mapFriendRequestFromApi
} from './components/friend-requests.js';
import { SocialNavigation, type SocialTab } from './components/social-navigation.js';

const demoFriends: FriendListItem[] = [
  mapFriendFromApi({
    id: 1,
    displayName: 'Maria Souza',
    username: 'maria.dev',
    status: 'online',
    bio: 'Product designer e apaixonada por interfaces humanas.',
    mutualFriends: 12,
    isFollowing: true,
    lastActiveLabel: 'Disponível agora'
  }),
  mapFriendFromApi({
    id: 2,
    displayName: 'João Pereira',
    username: 'joao.codes',
    status: 'away',
    bio: 'Construindo experiências com foco em performance e DX.',
    mutualFriends: 7,
    isFollowing: false,
    lastActiveLabel: 'Há 8 minutos'
  }),
  mapFriendFromApi({
    id: 3,
    displayName: 'Ana Costa',
    username: 'ana.ux',
    status: 'busy',
    bio: 'Mentora de produto e amante de research sênior.',
    mutualFriends: 4,
    isFollowing: true,
    lastActiveLabel: 'Em reunião'
  })
];

const receivedRequests: FriendRequestItem[] = [
  mapFriendRequestFromApi({
    id: 101,
    displayName: 'Ari Costa',
    username: 'ari.design',
    mutualFriends: 8,
    message: 'Quero trocar ideias de produto e explorar algumas ideias em comum.',
    requestedAtLabel: 'Há 2 horas'
  }),
  mapFriendRequestFromApi({
    id: 102,
    displayName: 'Luan Silva',
    username: 'luan.dev',
    mutualFriends: 5,
    message: 'Vamos colaborar em um projeto de comunidade e eventos.',
    requestedAtLabel: 'Hoje'
  })
];

const sentRequests: FriendRequestItem[] = [
  mapFriendRequestFromApi({
    id: 201,
    displayName: 'Nina Rocha',
    username: 'nina.codes',
    mutualFriends: 11,
    message: 'Preciso de feedback no meu portfólio e no meu app de pesquisa.',
    requestedAtLabel: 'Ontem'
  }),
  mapFriendRequestFromApi({
    id: 202,
    displayName: 'Mateus Lima',
    username: 'mateus.ui',
    mutualFriends: 3,
    message: 'Tenho alguns estudos em comum sobre sistemas de design e comunidade.',
    requestedAtLabel: 'Semana passada'
  })
];

export function SocialDemoPage() {
  const [activeTab, setActiveTab] = useState<SocialTab>('all');
  const activeFriends = useMemo(
    () => demoFriends.filter((friend) => friend.status === 'online' || friend.status === 'busy'),
    []
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
            <FriendList
              title="Amigos"
              items={activeTab === 'active' ? activeFriends : demoFriends}
              showOnlyActive={activeTab === 'active'}
              className="rounded-none border-0 p-0"
              onProfileClick={(friend) => console.log('Ver perfil:', friend.displayName)}
              onMessageClick={(friend) => console.log('Mensagem para:', friend.displayName)}
            />
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
              sentItems={sentRequests}
              className="rounded-none border-0 p-0"
              onAccept={(friend) => console.log('Aceitar:', friend.displayName)}
              onDecline={(friend) => console.log('Recusar:', friend.displayName)}
              onViewProfile={(friend) => console.log('Perfil:', friend.displayName)}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
