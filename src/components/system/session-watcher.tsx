import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '../ui/modal.js'
import { queryClient } from '../../lib/query-client.js'
import { gateway } from '../../lib/ws/socket.js'
import { useAuthStore } from '../../stores/auth-store.js'

const SESSION_END_COPY = {
  expired: {
    title: 'Sessão expirada',
    description: 'Sua sessão expirou. Entre novamente para continuar.'
  },
  revoked: {
    title: 'Sessão encerrada',
    description: 'Esta sessão foi encerrada em outro dispositivo. Entre novamente para continuar.'
  }
} as const

/**
 * Único ponto que reage ao fim da sessão: desconecta o gateway, limpa o
 * cache do React Query, navega ao /login e — quando o fim não foi
 * voluntário — explica o motivo em um modal.
 */
export function SessionWatcher() {
  const navigate = useNavigate()
  const sessionEnd = useAuthStore((state) => state.sessionEnd)
  const acknowledgeSessionEnd = useAuthStore((state) => state.acknowledgeSessionEnd)

  useEffect(() => {
    if (!sessionEnd) return

    gateway.disconnect()
    void queryClient.cancelQueries()
    queryClient.clear()
    navigate('/login', { replace: true })
  }, [sessionEnd, navigate])

  if (sessionEnd !== 'expired' && sessionEnd !== 'revoked') return null

  const copy = SESSION_END_COPY[sessionEnd]
  return (
    <Modal
      open
      title={copy.title}
      description={copy.description}
      confirmLabel="Entrar novamente"
      onConfirm={acknowledgeSessionEnd}
    />
  )
}
