import { useEffect, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createTextChannel,
  getSpaceChannels,
  getSpaces,
  type SpaceResponse,
  type TextChannelResponse
} from '../../../lib/api/endpoints.js';
import { gateway } from '../../../lib/ws/socket.js';
import { ChannelsSidebar } from '../components/channels-sidebar.js';
import { CreateChannelDialog } from '../components/create-channel-dialog.js';
import { EmptySpacesState } from '../components/empty-spaces-state.js';
import { ErrorState } from '../components/error-state.js';
import { RealtimeChat } from '../components/realtime-chat.js';
import { SpaceRail } from '../components/space-rail.js';
import '../../../styles/tokens.css';

export function SpacesPage() {
  const spacesQuery = useQuery({ queryKey: ['spaces'], queryFn: getSpaces });
  const [activeSpaceId, setActiveSpaceId] = useState<string>();
  const [activeChannelId, setActiveChannelId] = useState<string>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const queryClient = useQueryClient();
  const spaces = spacesQuery.data?.items ?? [];
  const activeSpace = spaces.find((space) => space.id === activeSpaceId) ?? spaces[0];
  const channelsQuery = useQuery({
    queryKey: ['space-channels', activeSpace?.id],
    queryFn: () => getSpaceChannels(activeSpace!.id),
    enabled: Boolean(activeSpace)
  });
  const channels = channelsQuery.data?.items ?? [];
  const activeChannel = channels.find((channel) => channel.id === activeChannelId) ?? channels[0];
  const createMutation = useMutation({
    mutationFn: (name: string) => createTextChannel(activeSpace!.id, name),
    onSuccess: async ({ channel }) => {
      await queryClient.invalidateQueries({ queryKey: ['space-channels', activeSpace?.id] });
      setActiveChannelId(channel.id);
      setDialogOpen(false);
    }
  });

  useEffect(
    () =>
      gateway.onMessage((event) => {
        if (event.type === 'channel.created' || event.type === 'channel.deleted') {
          void queryClient.invalidateQueries({
            queryKey: ['space-channels', event.payload.spaceId]
          });
        }
      }),
    [queryClient]
  );

  function selectSpace(space: SpaceResponse) {
    setActiveSpaceId(space.id);
    setActiveChannelId(undefined);
    setMobileSidebarOpen(false);
  }

  function selectChannel(channel: TextChannelResponse) {
    setActiveChannelId(channel.id);
    setMobileSidebarOpen(false);
  }

  return (
    <div className="flex h-[calc(100dvh-65px)] min-h-[540px] min-w-0 overflow-hidden bg-[color:var(--color-surface-primary)]">
      <SpaceRail
        spaces={spaces}
        activeSpaceId={activeSpace?.id}
        onSelect={selectSpace}
        onCreate={() => undefined}
      />
      <div
        className={`fixed inset-y-[65px] left-16 z-10 flex w-[min(82vw,300px)] -translate-x-[110%] shadow-xl transition-transform md:static md:z-auto md:flex md:w-[260px] md:translate-x-0 md:shadow-none ${mobileSidebarOpen ? 'translate-x-0' : ''}`}
      >
        <ChannelsSidebar
          space={activeSpace}
          channels={channels}
          activeChannelId={activeChannel?.id}
          loading={channelsQuery.isLoading}
          onSelect={selectChannel}
          onCreate={() => setDialogOpen(true)}
          onClose={() => setMobileSidebarOpen(false)}
        />
      </div>
      {spacesQuery.isLoading ? (
        <main className="flex min-w-0 flex-1 flex-col items-center justify-center gap-2.5 bg-[color:var(--color-surface-primary)] p-6 text-center text-[color:var(--color-text-muted)]">
          <LoaderCircle className="animate-spin" />
          <p>Carregando seus Spaces...</p>
        </main>
      ) : spacesQuery.isError ? (
        <main className="flex min-w-0 flex-1 flex-col items-center justify-center gap-2.5 bg-[color:var(--color-surface-primary)] p-6 text-center">
          <ErrorState message="Não foi possível carregar seus Spaces." />
        </main>
      ) : spaces.length === 0 ? (
        <EmptySpacesState />
      ) : (
        <RealtimeChat channel={activeChannel} onMobileMenu={() => setMobileSidebarOpen(true)} />
      )}
      <CreateChannelDialog
        open={dialogOpen}
        spaceName={activeSpace?.name ?? 'este Space'}
        pending={createMutation.isPending}
        error={createMutation.error instanceof Error ? createMutation.error.message : null}
        onClose={() => setDialogOpen(false)}
        onCreate={(name) => createMutation.mutate(name)}
      />
    </div>
  );
}
