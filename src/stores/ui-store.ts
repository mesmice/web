import { create } from 'zustand'

export type ConnectionStatus = 'connecting' | 'open' | 'closed'

interface UiState {
  gatewayStatus: ConnectionStatus
  setGatewayStatus(status: ConnectionStatus): void
}

export const useUiStore = create<UiState>((set) => ({
  gatewayStatus: 'closed',
  setGatewayStatus: (gatewayStatus) => set({ gatewayStatus })
}))
