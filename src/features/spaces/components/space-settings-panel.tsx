import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LockKeyhole, Plus, Shield, UserRound, X } from 'lucide-react';
import type { TextChannelResponse } from '../../../lib/api/endpoints.js';
import { useAuthStore } from '../../../stores/auth-store.js';
import {
  assignSpaceRole,
  createSpaceRole,
  getSpaceMembers,
  getSpaceRoles,
  removeSpaceRole,
  updateChannelPermissions,
  updateMySpaceNickname
} from '../api/space-settings-endpoints.js';

interface SpaceSettingsPanelProps {
  spaceId: string;
  channels: TextChannelResponse[];
  onClose: () => void;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Não foi possível salvar agora.';
}

export function SpaceSettingsPanel({ spaceId, channels, onClose }: SpaceSettingsPanelProps) {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const membersQuery = useQuery({
    queryKey: ['space-members', spaceId],
    queryFn: () => getSpaceMembers(spaceId)
  });
  const rolesQuery = useQuery({
    queryKey: ['space-roles', spaceId],
    queryFn: () => getSpaceRoles(spaceId)
  });
  const [nickname, setNickname] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [roleName, setRoleName] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState(channels[0]?.id ?? '');
  const [allowedUserIds, setAllowedUserIds] = useState<string[]>([]);
  const [allowedRoleIds, setAllowedRoleIds] = useState<string[]>([]);
  const [channelAccessDirty, setChannelAccessDirty] = useState(false);
  const members = membersQuery.data?.items ?? [];
  const roles = rolesQuery.data?.items ?? [];
  const selectedChannel =
    channels.find((channel) => channel.id === selectedChannelId) ?? channels[0];
  const currentMember = members.find((member) => member.userId === currentUserId);
  const effectiveAllowedRoleIds = channelAccessDirty
    ? allowedRoleIds
    : (selectedChannel?.allowedRoleIds ?? []);
  const effectiveAllowedUserIds = channelAccessDirty
    ? allowedUserIds
    : (selectedChannel?.allowedUserIds ?? []);

  const nicknameMutation = useMutation({
    mutationFn: () => updateMySpaceNickname(spaceId, nickname.trim() || null),
    onSuccess: (member) => {
      setNickname(member.nickname ?? '');
      void queryClient.invalidateQueries({ queryKey: ['space-members', spaceId] });
    }
  });
  const roleMutation = useMutation({
    mutationFn: () => assignSpaceRole(spaceId, selectedMemberId, selectedRoleId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['space-members', spaceId] })
  });
  const removeRoleMutation = useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      removeSpaceRole(spaceId, userId, roleId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['space-members', spaceId] })
  });
  const createRoleMutation = useMutation({
    mutationFn: () => createSpaceRole(spaceId, { name: roleName.trim() }),
    onSuccess: () => {
      setRoleName('');
      void queryClient.invalidateQueries({ queryKey: ['space-roles', spaceId] });
    }
  });
  const channelMutation = useMutation({
    mutationFn: () =>
      updateChannelPermissions(selectedChannelId, {
        roleOverwrites: [],
        memberOverwrites: [],
        isPrivate: true,
        allowedRoleIds: effectiveAllowedRoleIds,
        allowedUserIds: effectiveAllowedUserIds
      }),
    onSuccess: ({ channel }) => {
      void queryClient.invalidateQueries({ queryKey: ['space-channels', spaceId] });
      setAllowedRoleIds(channel.allowedRoleIds);
      setAllowedUserIds(channel.allowedUserIds);
      setChannelAccessDirty(false);
    }
  });

  function toggleId(value: string, values: string[], setValues: (next: string[]) => void) {
    setValues(
      values.includes(value) ? values.filter((item) => item !== value) : [...values, value]
    );
  }

  function selectChannel(channel: TextChannelResponse) {
    setSelectedChannelId(channel.id);
    setAllowedRoleIds(channel.allowedRoleIds);
    setAllowedUserIds(channel.allowedUserIds);
    setChannelAccessDirty(false);
  }

  return (
    <div className="fixed inset-0 z-30 overflow-y-auto bg-black/55 p-4 sm:p-8" role="presentation">
      <section
        className="mx-auto grid w-full max-w-4xl gap-6 rounded-2xl bg-[color:var(--color-surface-elevated)] p-5 shadow-2xl sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="space-settings-title"
      >
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.12em] text-[color:var(--color-brand-primary)]">
              Personalização do Space
            </p>
            <h2
              id="space-settings-title"
              className="mt-1 text-2xl text-[color:var(--color-text-primary)]"
            >
              Identidade, cargos e acesso
            </h2>
          </div>
          <button
            type="button"
            className="inline-grid h-9 w-9 place-items-center rounded-md border-0 bg-transparent hover:bg-black/5"
            onClick={onClose}
            aria-label="Fechar configurações"
          >
            <X size={19} />
          </button>
        </header>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="grid gap-3 rounded-xl border border-[color:var(--color-border-default)] p-4">
            <div className="flex items-center gap-2">
              <UserRound size={18} />
              <h3 className="text-base">Seu perfil neste Space</h3>
            </div>
            <p className="text-sm text-[color:var(--color-text-muted)]">
              Use um apelido diferente do seu perfil global.
            </p>
            <div className="flex gap-2">
              <input
                className="min-h-10 min-w-0 flex-1 rounded-md border border-[color:var(--color-border-default)] bg-transparent px-3"
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                placeholder="Como as pessoas devem chamar você"
                maxLength={32}
              />
              <input
                className="min-h-10 min-w-0 flex-1 rounded-md border border-[color:var(--color-border-default)] bg-transparent px-3"
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                placeholder={currentMember?.nickname ?? 'Como as pessoas devem chamar você'}
                maxLength={32}
              />
              <button
                className="rounded-md border-0 bg-[color:var(--color-brand-primary)] px-4 font-bold text-white disabled:opacity-50"
                type="button"
                onClick={() => nicknameMutation.mutate()}
                disabled={nicknameMutation.isPending}
              >
                {nicknameMutation.isPending ? 'Salvando' : 'Salvar'}
              </button>
            </div>
            {nicknameMutation.isError ? (
              <p className="text-sm text-red-600">{errorMessage(nicknameMutation.error)}</p>
            ) : null}
          </section>

          <section className="grid gap-3 rounded-xl border border-[color:var(--color-border-default)] p-4">
            <div className="flex items-center gap-2">
              <Shield size={18} />
              <h3 className="text-base">Cargos do Space</h3>
            </div>
            <div className="flex gap-2">
              <input
                className="min-h-10 min-w-0 flex-1 rounded-md border border-[color:var(--color-border-default)] bg-transparent px-3"
                value={roleName}
                onChange={(event) => setRoleName(event.target.value)}
                placeholder="Nome do novo cargo"
                maxLength={100}
              />
              <button
                className="inline-flex items-center gap-1 rounded-md border-0 bg-[color:var(--color-brand-primary)] px-3 font-bold text-white disabled:opacity-50"
                type="button"
                onClick={() => createRoleMutation.mutate()}
                disabled={!roleName.trim() || createRoleMutation.isPending}
              >
                <Plus size={16} /> Criar
              </button>
            </div>
            <div className="flex gap-2">
              <select
                className="min-h-10 min-w-0 flex-1 rounded-md border border-[color:var(--color-border-default)] bg-transparent px-2"
                value={selectedMemberId}
                onChange={(event) => setSelectedMemberId(event.target.value)}
                aria-label="Membro para atribuir cargo"
              >
                <option value="">Escolha um membro</option>
                {members.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.nickname || member.userId}
                  </option>
                ))}
              </select>
              <select
                className="min-h-10 min-w-0 flex-1 rounded-md border border-[color:var(--color-border-default)] bg-transparent px-2"
                value={selectedRoleId}
                onChange={(event) => setSelectedRoleId(event.target.value)}
                aria-label="Cargo para atribuir"
              >
                <option value="">Escolha um cargo</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              <button
                className="rounded-md border-0 bg-[color:var(--color-brand-primary)] px-3 font-bold text-white disabled:opacity-50"
                type="button"
                onClick={() => roleMutation.mutate()}
                disabled={!selectedMemberId || !selectedRoleId || roleMutation.isPending}
              >
                Atribuir
              </button>
            </div>
            <ul className="grid gap-2 text-sm">
              {members
                .filter((member) => member.roleIds.length)
                .slice(0, 8)
                .map((member) => (
                  <li className="flex items-center justify-between gap-2" key={member.userId}>
                    <span className="truncate">{member.nickname || member.userId}</span>
                    <span className="flex flex-wrap justify-end gap-1">
                      {member.roleIds.map((roleId) => {
                        const role = roles.find((item) => item.id === roleId);
                        return (
                          <button
                            className="rounded bg-[color:var(--color-brand-soft)] px-2 py-1 text-xs"
                            type="button"
                            key={roleId}
                            onClick={() =>
                              removeRoleMutation.mutate({ userId: member.userId, roleId })
                            }
                            title="Remover cargo"
                          >
                            {role?.name ?? roleId}
                          </button>
                        );
                      })}
                    </span>
                  </li>
                ))}
            </ul>
          </section>

          <section className="grid gap-3 rounded-xl border border-[color:var(--color-border-default)] p-4 lg:col-span-2">
            <div className="flex items-center gap-2">
              <LockKeyhole size={18} />
              <h3 className="text-base">Canal privado</h3>
            </div>
            <p className="text-sm text-[color:var(--color-text-muted)]">
              Escolha exatamente quais cargos e membros podem visualizar o canal.
            </p>
            <select
              className="min-h-10 rounded-md border border-[color:var(--color-border-default)] bg-transparent px-2"
              value={selectedChannelId}
              onChange={(event) => {
                const channel = channels.find((item) => item.id === event.target.value);
                if (channel) selectChannel(channel);
              }}
              aria-label="Canal para configurar"
            >
              {channels.map((channel) => (
                <option key={channel.id} value={channel.id}>
                  #{channel.name}
                  {channel.isPrivate ? ' (privado)' : ''}
                </option>
              ))}
            </select>
            <div className="grid gap-4 sm:grid-cols-2">
              <fieldset className="grid gap-2">
                <legend className="text-sm font-bold">Cargos permitidos</legend>
                {roles.map((role) => (
                  <label className="flex items-center gap-2 text-sm" key={role.id}>
                    <input
                      type="checkbox"
                      checked={effectiveAllowedRoleIds.includes(role.id)}
                      onChange={() => {
                        setChannelAccessDirty(true);
                        toggleId(role.id, effectiveAllowedRoleIds, setAllowedRoleIds);
                      }}
                    />
                    {role.name}
                  </label>
                ))}
              </fieldset>
              <fieldset className="grid gap-2">
                <legend className="text-sm font-bold">Membros permitidos</legend>
                {members.map((member) => (
                  <label className="flex items-center gap-2 text-sm" key={member.userId}>
                    <input
                      type="checkbox"
                      checked={effectiveAllowedUserIds.includes(member.userId)}
                      onChange={() => {
                        setChannelAccessDirty(true);
                        toggleId(member.userId, effectiveAllowedUserIds, setAllowedUserIds);
                      }}
                    />
                    {member.nickname || member.userId}
                  </label>
                ))}
              </fieldset>
            </div>
            {selectedChannel ? (
              <button
                className="min-h-10 justify-self-start rounded-md border-0 bg-[color:var(--color-brand-primary)] px-4 font-bold text-white disabled:opacity-50"
                type="button"
                onClick={() => channelMutation.mutate()}
                disabled={channelMutation.isPending}
              >
                {channelMutation.isPending ? 'Aplicando...' : 'Salvar acesso privado'}
              </button>
            ) : (
              <p className="text-sm text-[color:var(--color-text-muted)]">
                Crie um canal antes de configurar o acesso.
              </p>
            )}
            {channelMutation.isError ? (
              <p className="text-sm text-red-600">{errorMessage(channelMutation.error)}</p>
            ) : null}
          </section>
        </div>
      </section>
    </div>
  );
}
