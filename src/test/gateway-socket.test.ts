import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WS_CLOSE_CODES } from '../lib/types/api.js'
import { buildWebSocketUrl, GatewaySocket } from '../lib/ws/socket.js'

interface SocketEvent {
  code?: number
  data?: string
}

class FakeWebSocket {
  static readonly OPEN = 1
  static instances: FakeWebSocket[] = []

  readonly sent: string[] = []
  readyState = 0
  closeCalls = 0
  private listeners = new Map<string, Array<(event: SocketEvent) => void>>()

  constructor(public url: string) {
    FakeWebSocket.instances.push(this)
  }

  addEventListener(type: string, listener: (event: SocketEvent) => void): void {
    const list = this.listeners.get(type) ?? []
    list.push(listener)
    this.listeners.set(type, list)
  }

  send(message: string): void {
    this.sent.push(message)
  }

  close(): void {
    this.closeCalls += 1
    this.readyState = 3
    this.dispatch('close', { code: 1000 })
  }

  serverOpen(): void {
    this.readyState = FakeWebSocket.OPEN
    this.dispatch('open', {})
  }

  serverMessage(message: unknown): void {
    this.dispatch('message', { data: JSON.stringify(message) })
  }

  serverClose(code: number): void {
    this.readyState = 3
    this.dispatch('close', { code })
  }

  private dispatch(type: string, event: SocketEvent): void {
    for (const listener of this.listeners.get(type) ?? []) listener(event)
  }
}

let gateway: GatewaySocket

beforeEach(() => {
  gateway = new GatewaySocket()
  FakeWebSocket.instances = []
  vi.stubGlobal('WebSocket', FakeWebSocket)
  vi.useFakeTimers()
})

afterEach(() => {
  gateway.disconnect()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('GatewaySocket', () => {
  it('constrói ws para páginas HTTP e wss para páginas HTTPS', () => {
    expect(buildWebSocketUrl(undefined, { protocol: 'http:', host: 'localhost:5173' })).toBe('ws://localhost:5173/gateway')
    expect(buildWebSocketUrl(undefined, { protocol: 'https:', host: 'mesmice.example' })).toBe('wss://mesmice.example/gateway')
  })

  it('prioriza a URL explicitamente configurada', () => {
    expect(buildWebSocketUrl('wss://socket.example/custom', { protocol: 'http:', host: 'localhost' })).toBe('wss://socket.example/custom')
  })

  it('envia identify com o access token atual assim que a conexão abre', () => {
    gateway.connect(() => 'access-atual')
    FakeWebSocket.instances[0].serverOpen()

    expect(FakeWebSocket.instances[0].sent).toEqual([
      JSON.stringify({ type: 'identify', token: 'access-atual' })
    ])
  })

  it('aceita o evento tipado conversation.created', () => {
    const onMessage = vi.fn()
    gateway.onMessage(onMessage)
    gateway.connect(() => 'access')
    const socket = FakeWebSocket.instances[0]
    socket.serverOpen()
    const event = {
      type: 'conversation.created',
      payload: {
        id: 'dm-1', ownerId: 'user-1', type: 'DM', name: null,
        participantIds: ['user-1', 'user-2'],
        participants: [
          { id: 'user-1', username: 'ana', displayName: 'Ana', avatarUrl: null, presence: 'online' },
          { id: 'user-2', username: 'bia', displayName: 'Bia', avatarUrl: null, presence: 'offline' }
        ],
        unreadCount: 0, createdAt: '2026-09-10T09:00:00.000Z', lastMessageAt: null,
        permissions: { default: '0', memberOverwrites: [] }
      }
    }

    socket.serverMessage(event)

    expect(onMessage).toHaveBeenCalledWith(event)
  })

  it('envia heartbeat somente após abrir e limpa o timer ao desconectar', () => {
    gateway.connect(() => 'access')
    const socket = FakeWebSocket.instances[0]
    vi.advanceTimersByTime(30_000)
    expect(socket.sent).toHaveLength(0)
    socket.serverOpen()
    vi.advanceTimersByTime(30_000)
    expect(JSON.parse(socket.sent[1]!)).toMatchObject({ type: 'ping' })
    gateway.disconnect()
    const sent = socket.sent.length
    vi.advanceTimersByTime(60_000)
    expect(socket.sent).toHaveLength(sent)
  })

  it('não abre conexão nem inventa token quando não existe sessão em memória', () => {
    gateway.connect(() => null)

    expect(FakeWebSocket.instances).toHaveLength(0)
  })

  it('reconecta e identifica com o token canônico mais recente', () => {
    let accessToken = 'access-antigo'
    gateway.connect(() => accessToken)
    FakeWebSocket.instances[0].serverOpen()
    FakeWebSocket.instances[0].serverClose(WS_CLOSE_CODES.IDENTIFY_TIMEOUT)

    accessToken = 'access-rotacionado'
    vi.advanceTimersByTime(20_000)
    FakeWebSocket.instances[1].serverOpen()

    expect(FakeWebSocket.instances[1].sent).toEqual([
      JSON.stringify({ type: 'identify', token: 'access-rotacionado' })
    ])
  })

  it('não cria sockets ou timers duplicados em chamadas concorrentes', () => {
    const token = () => 'access'
    gateway.connect(token)
    gateway.connect(token)

    expect(FakeWebSocket.instances).toHaveLength(1)
    FakeWebSocket.instances[0].serverClose(1006)
    FakeWebSocket.instances[0].serverClose(1006)
    vi.advanceTimersByTime(20_000)

    expect(FakeWebSocket.instances).toHaveLength(2)
  })

  it('disconnect encerra o socket ativo e não provoca reconnect', () => {
    gateway.connect(() => 'access')
    const socket = FakeWebSocket.instances[0]
    socket.serverOpen()

    gateway.disconnect()
    vi.advanceTimersByTime(30_000)

    expect(socket.closeCalls).toBe(1)
    expect(FakeWebSocket.instances).toHaveLength(1)
  })

  it('disconnect cancela um timer de reconnect pendente', () => {
    gateway.connect(() => 'access')
    FakeWebSocket.instances[0].serverClose(1006)

    gateway.disconnect()
    vi.advanceTimersByTime(30_000)

    expect(FakeWebSocket.instances).toHaveLength(1)
  })

  it('processa session.revoked uma vez e bloqueia reconexão', () => {
    const onRevoked = vi.fn()
    gateway.onSessionRevoked(onRevoked)
    gateway.connect(() => 'access')
    const socket = FakeWebSocket.instances[0]
    socket.serverOpen()

    socket.serverMessage({ type: 'session.revoked', payload: { sessionId: 'session-1' } })
    socket.serverClose(WS_CLOSE_CODES.SESSION_REVOKED)
    vi.advanceTimersByTime(30_000)

    expect(onRevoked).toHaveBeenCalledTimes(1)
    expect(FakeWebSocket.instances).toHaveLength(1)
  })

  it('close 4401 solicita renovação e espera reconnect explícito', () => {
    const onUnauthorized = vi.fn()
    gateway.onUnauthorized(onUnauthorized)
    gateway.connect(() => 'access-expirado')
    FakeWebSocket.instances[0].serverOpen()

    FakeWebSocket.instances[0].serverClose(WS_CLOSE_CODES.UNAUTHORIZED)
    vi.advanceTimersByTime(30_000)

    expect(onUnauthorized).toHaveBeenCalledTimes(1)
    expect(FakeWebSocket.instances).toHaveLength(1)
  })

  it('não reconecta em close 4400 causado por mensagem inválida', () => {
    gateway.connect(() => 'access')
    FakeWebSocket.instances[0].serverOpen()
    FakeWebSocket.instances[0].serverClose(WS_CLOSE_CODES.INVALID_JSON)

    vi.advanceTimersByTime(30_000)

    expect(FakeWebSocket.instances).toHaveLength(1)
  })
})
