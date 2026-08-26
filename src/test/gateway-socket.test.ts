import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WS_SESSION_REVOKED_CLOSE_CODE } from '../lib/types/api.js'
import { gateway } from '../lib/ws/socket.js'

interface CloseEventInit {
  code?: number
}

/**
 * Stub mínimo de WebSocket: registra listeners e permite simular o SERVIDOR
 * fechando a conexão com um código específico.
 */
class FakeWebSocket {
  static instances: FakeWebSocket[] = []

  private listeners = new Map<string, Array<(event: CloseEventInit) => void>>()

  constructor(public url: string) {
    FakeWebSocket.instances.push(this)
  }

  addEventListener(type: string, listener: (event: CloseEventInit) => void): void {
    const list = this.listeners.get(type) ?? []
    list.push(listener)
    this.listeners.set(type, list)
  }

  send(): void {}

  close(): void {}

  serverClose({ code }: CloseEventInit): void {
    for (const listener of this.listeners.get('close') ?? []) listener({ code })
  }
}

beforeEach(() => {
  gateway.disconnect()
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
  it('notifica revogação e bloqueia reconexão automática no close 4402', () => {
    const onRevoked = vi.fn()
    const unsubscribe = gateway.onSessionRevoked(onRevoked)

    gateway.connect()
    expect(FakeWebSocket.instances).toHaveLength(1)

    FakeWebSocket.instances[0].serverClose({ code: WS_SESSION_REVOKED_CLOSE_CODE })

    expect(onRevoked).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(30_000)
    expect(FakeWebSocket.instances).toHaveLength(1)

    unsubscribe()
  })

  it('reconecta automaticamente em fechamento comum (não-revogação)', () => {
    const onRevoked = vi.fn()
    const unsubscribe = gateway.onSessionRevoked(onRevoked)

    gateway.connect()
    FakeWebSocket.instances[0].serverClose({ code: 1006 })

    vi.advanceTimersByTime(2_000)
    expect(FakeWebSocket.instances).toHaveLength(2)
    expect(onRevoked).not.toHaveBeenCalled()

    unsubscribe()
  })

  it('connect() explícito volta a funcionar após revogação (relogin)', () => {
    gateway.connect()
    FakeWebSocket.instances[0].serverClose({ code: WS_SESSION_REVOKED_CLOSE_CODE })
    vi.advanceTimersByTime(30_000)
    expect(FakeWebSocket.instances).toHaveLength(1)

    gateway.connect()

    expect(FakeWebSocket.instances).toHaveLength(2)
  })
})
