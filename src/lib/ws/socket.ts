import {
  GATEWAY_PATH,
  WS_SESSION_REVOKED_CLOSE_CODE,
  type ClientMessage,
  type ServerMessage
} from '../types/api.js'

type Listener<T> = (data: T) => void

const WS_URL = import.meta.env.VITE_WS_URL ?? `ws://${window.location.host}${GATEWAY_PATH}`
const MAX_BACKOFF_MS = 15_000

export class GatewaySocket {
  private socket: WebSocket | null = null
  private listeners = new Set<Listener<ServerMessage>>()
  private statusListeners = new Set<Listener<'connecting' | 'open' | 'closed'>>()
  private sessionRevokedListeners = new Set<Listener<void>>()
  private reconnectAttempts = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  /** Bloqueia apenas a RECONEXÃO automática; connect() explícito sempre funciona. */
  private autoReconnectBlocked = false

  connect(): void {
    if (this.socket) return
    // Conexão explícita reabilita a reconexão automática (ex.: relogin
    // depois de um logout que havia bloqueado o backoff).
    this.autoReconnectBlocked = false
    this.emitStatus('connecting')

    const socket = new WebSocket(WS_URL)
    this.socket = socket

    socket.addEventListener('open', () => {
      this.reconnectAttempts = 0
      this.emitStatus('open')
    })

    socket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data) as ServerMessage
        for (const listener of this.listeners) listener(data)
      } catch {
        return
      }
    })

    socket.addEventListener('close', (event) => {
      this.socket = null
      this.emitStatus('closed')

      // Sessão revogada pelo servidor: sem reautenticação não há o que
      // reconectar — bloqueia backoff e notifica os ouvintes.
      if (event.code === WS_SESSION_REVOKED_CLOSE_CODE) {
        this.autoReconnectBlocked = true
        for (const listener of this.sessionRevokedListeners) listener()
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
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.socket?.close()
    this.socket = null
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
      this.connect()
    }, jittered)
  }
}

export const gateway = new GatewaySocket()
