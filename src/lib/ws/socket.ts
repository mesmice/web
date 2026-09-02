import {
  GATEWAY_PATH,
  WS_CLOSE_CODES,
  type ClientMessage,
  type ServerMessage
} from '../types/api.js'

type Listener<T> = (data: T) => void
type AccessTokenProvider = () => string | null

const WS_URL = import.meta.env.VITE_WS_URL ?? `ws://${window.location.host}${GATEWAY_PATH}`
const MAX_BACKOFF_MS = 15_000

export class GatewaySocket {
  private socket: WebSocket | null = null
  private listeners = new Set<Listener<ServerMessage>>()
  private statusListeners = new Set<Listener<'connecting' | 'open' | 'closed'>>()
  private sessionRevokedListeners = new Set<Listener<void>>()
  private unauthorizedListeners = new Set<Listener<void>>()
  private reconnectAttempts = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private getAccessToken: AccessTokenProvider | null = null
  /** Bloqueia apenas a RECONEXÃO automática; connect() explícito sempre funciona. */
  private autoReconnectBlocked = false

  connect(getAccessToken: AccessTokenProvider): void {
    this.getAccessToken = getAccessToken
    // Conexão explícita reabilita a reconexão automática (ex.: relogin
    // depois de um logout que havia bloqueado o backoff).
    this.autoReconnectBlocked = false
    this.openSocket()
  }

  private openSocket(): void {
    if (this.socket || !this.getAccessToken?.()) return
    this.emitStatus('connecting')

    const socket = new WebSocket(WS_URL)
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
      this.emitStatus('open')
    })

    socket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data) as ServerMessage
        if (data.type === 'session.revoked') {
          revocationHandled = true
          this.autoReconnectBlocked = true
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
      this.emitStatus('closed')

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
    this.emitStatus('closed')
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

  onStatusChange(listener: Listener<'connecting' | 'open' | 'closed'>): () => void {
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

  private emitStatus(status: 'connecting' | 'open' | 'closed'): void {
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
}

export const gateway = new GatewaySocket()
