import {
  GATEWAY_PATH, HEARTBEAT_INTERVAL_MS,
  WS_CLOSE_CODES,
  type ClientMessage,
  type ServerMessage
} from '../types/api.js'

type Listener<T> = (data: T) => void
type AccessTokenProvider = () => string | null

const MAX_BACKOFF_MS = 15_000

export type GatewayStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'unavailable' | 'revoked'

export function buildWebSocketUrl(explicitUrl?: string, locationLike?: Pick<Location, 'protocol' | 'host'>): string {
  if (explicitUrl) return explicitUrl
  if (!locationLike) return `ws://localhost${GATEWAY_PATH}`
  const protocol = locationLike.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${locationLike.host}${GATEWAY_PATH}`
}

export class GatewaySocket {
  private socket: WebSocket | null = null
  private listeners = new Set<Listener<ServerMessage>>()
  private statusListeners = new Set<Listener<GatewayStatus>>()
  private sessionRevokedListeners = new Set<Listener<void>>()
  private unauthorizedListeners = new Set<Listener<void>>()
  private reconnectAttempts = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private getAccessToken: AccessTokenProvider | null = null
  /** Bloqueia apenas a RECONEXÃO automática; connect() explícito sempre funciona. */
  private autoReconnectBlocked = false
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null

  connect(getAccessToken: AccessTokenProvider): void {
    this.getAccessToken = getAccessToken
    // Conexão explícita reabilita a reconexão automática (ex.: relogin
    // depois de um logout que havia bloqueado o backoff).
    this.autoReconnectBlocked = false
    this.clearReconnectTimer()
    this.openSocket()
  }

  private openSocket(): void {
    if (this.socket || !this.getAccessToken?.()) return
    this.emitStatus(this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting')

    const socket = new WebSocket(buildWebSocketUrl(import.meta.env.VITE_WS_URL, typeof window !== 'undefined' ? window.location : undefined))
    this.socket = socket

    let revocationHandled = false

    socket.addEventListener('open', () => {
      const accessToken = this.getAccessToken?.()
      if (!accessToken) {
        this.disconnect()
        return
      }

      this.reconnectAttempts = 0
      socket.send(JSON.stringify({ type: 'identify', token: accessToken } satisfies ClientMessage))
      this.startHeartbeat(socket)
      this.emitStatus('connected')
    })

    socket.addEventListener('message', (event) => {
      try {
        const data: unknown = JSON.parse(event.data)
        if (!isServerMessage(data)) return
        if (data.type === 'session.revoked') {
          revocationHandled = true
          this.autoReconnectBlocked = true
          this.emitStatus('revoked')
          for (const listener of this.sessionRevokedListeners) listener()
        }
        for (const listener of this.listeners) listener(data)
      } catch {
        return
      }
    })

    socket.addEventListener('close', (event) => {
      if (this.socket !== socket) return
      this.socket = null
      this.stopHeartbeat()
      this.emitStatus(this.autoReconnectBlocked ? 'disconnected' : 'unavailable')

      // Sessão revogada pelo servidor: sem reautenticação não há o que
      // reconectar — bloqueia backoff e notifica os ouvintes.
      if (event.code === WS_CLOSE_CODES.SESSION_REVOKED) {
        this.autoReconnectBlocked = true
        if (!revocationHandled) {
          for (const listener of this.sessionRevokedListeners) listener()
        }
        return
      }

      if (event.code === WS_CLOSE_CODES.UNAUTHORIZED) {
        this.autoReconnectBlocked = true
        for (const listener of this.unauthorizedListeners) listener()
        return
      }

      if (event.code === WS_CLOSE_CODES.INVALID_JSON) {
        this.autoReconnectBlocked = true
        return
      }

      this.scheduleReconnect()
    })

    socket.addEventListener('error', () => {
      socket.close()
    })
  }

  disconnect(): void {
    this.autoReconnectBlocked = true
    this.getAccessToken = null
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    const socket = this.socket
    this.socket = null
    socket?.close()
    this.emitStatus('disconnected')
  }

  send(message: ClientMessage): boolean {
    if (this.socket?.readyState !== WebSocket.OPEN) return false
    this.socket.send(JSON.stringify(message))
    return true
  }

  ping(): void {
    this.send({ type: 'ping', sentAt: Date.now() })
  }

  onMessage(listener: Listener<ServerMessage>): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  onStatusChange(listener: Listener<GatewayStatus>): () => void {
    this.statusListeners.add(listener)
    return () => this.statusListeners.delete(listener)
  }

  /** Disparado quando o servidor fecha o socket por revogação de sessão (4402). */
  onSessionRevoked(listener: Listener<void>): () => void {
    this.sessionRevokedListeners.add(listener)
    return () => this.sessionRevokedListeners.delete(listener)
  }

  /** Disparado no close 4401 para o caller renovar a sessão antes de reconectar. */
  onUnauthorized(listener: Listener<void>): () => void {
    this.unauthorizedListeners.add(listener)
    return () => this.unauthorizedListeners.delete(listener)
  }

  private emitStatus(status: GatewayStatus): void {
    for (const listener of this.statusListeners) listener(status)
  }

  private scheduleReconnect(): void {
    if (this.autoReconnectBlocked || this.reconnectTimer) return
    const backoff = Math.min(MAX_BACKOFF_MS, 500 * 2 ** this.reconnectAttempts)
    const jittered = backoff * (0.75 + Math.random() * 0.5)
    this.reconnectAttempts += 1
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.openSocket()
    }, jittered)
  }

  private startHeartbeat(socket: WebSocket): void {
    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      if (this.socket === socket) this.ping()
    }, HEARTBEAT_INTERVAL_MS)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer)
    this.heartbeatTimer = null
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.reconnectTimer = null
  }
}

function isServerMessage(value: unknown): value is ServerMessage {
  if (!value || typeof value !== 'object' || !('type' in value)) return false
  const type = (value as { type?: unknown }).type
  return typeof type === 'string' && ['pong', 'ready', 'message.created', 'presence.update', 'friend.request', 'friend.accept', 'friend.remove', 'user.update', 'session.revoked'].includes(type)
}

export const gateway = new GatewaySocket()
