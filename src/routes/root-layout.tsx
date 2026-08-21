import { useEffect } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { ThemeToggle } from '../components/ui/theme-toggle.js'
import { gateway } from '../lib/ws/socket.js'
import { useUiStore } from '../stores/ui-store.js'
import './root-layout.css'

const STATUS_LABEL: Record<'connecting' | 'open' | 'closed', string> = {
  connecting: 'conectando',
  open: 'conectado',
  closed: 'offline'
}

export function RootLayout() {
  const setGatewayStatus = useUiStore((state) => state.setGatewayStatus)
  const gatewayStatus = useUiStore((state) => state.gatewayStatus)

  useEffect(() => {
    gateway.connect()
    const unsubscribe = gateway.onStatusChange(setGatewayStatus)
    return () => {
      unsubscribe()
      gateway.disconnect()
    }
  }, [setGatewayStatus])

  return (
    <div className="layout">
      <header className="layout__header">
        <Link to="/" className="layout__brand" aria-label="Mesmice, página inicial">
          Mesmice
        </Link>
        <ThemeToggle />
        <span
          className={`layout__status layout__status--${gatewayStatus}`}
          role="status"
          aria-live="polite"
        >
          {STATUS_LABEL[gatewayStatus]}
        </span>
      </header>
      <main className="layout__main">
        <Outlet />
      </main>
    </div>
  )
}
