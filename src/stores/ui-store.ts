import { create } from 'zustand'

import type { PresenceStatus } from '../lib/types/api.js'

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'unavailable' | 'revoked'

interface UiState {
  gatewayStatus: ConnectionStatus
  presence: Record<string, PresenceStatus>
  setGatewayStatus(status: ConnectionStatus): void
  setPresence(userId: string, status: PresenceStatus): void
}

export const useUiStore = create<UiState>((set) => ({
  gatewayStatus: 'disconnected',
  presence: {},
  setGatewayStatus: (gatewayStatus) => set({ gatewayStatus }),
  setPresence: (userId, status) => set((state) => ({ presence: { ...state.presence, [userId]: status } }))
}))
