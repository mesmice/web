import { GATEWAY_PATH, type ClientMessage, type ServerMessage } from '../types/api.js'

type Listener<T> = (data: T) => void

const WS_URL = import.meta.env.VITE_WS_URL ?? `ws://${window.location.host}${GATEWAY_PATH}`
const MAX_BACKOFF_MS = 15_000

export class GatewaySocket {
  private socket: WebSocket | null = null
  private listeners = new Set<Listener<ServerMessage>>()
  private statusListeners = new Set<Listener<'connecting' | 'open' | 'closed'>>()
  private reconnectAttempts = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private manuallyClosed = false

  connect(): void {
    if (this.socket || this.manuallyClosed) return
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

    socket.addEventListener('close', () => {
      this.socket = null
      this.emitStatus('closed')
      this.scheduleReconnect()
    })

    socket.addEventListener('error', () => {
      socket.close()
    })
  }

  disconnect(): void {
    this.manuallyClosed = true
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

  private emitStatus(status: 'connecting' | 'open' | 'closed'): void {
    for (const listener of this.statusListeners) listener(status)
  }

  private scheduleReconnect(): void {
    if (this.manuallyClosed || this.reconnectTimer) return
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
