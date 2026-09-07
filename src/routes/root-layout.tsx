import { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { ThemeToggle } from '../components/ui/theme-toggle.js';
import { LogoutButton } from '../features/auth/logout-button.js';
import { useAuthStore } from '../stores/auth-store.js';
import { gateway } from '../lib/ws/socket.js';
import { useUiStore } from '../stores/ui-store.js';
import { SessionWatcher } from '../components/system/session-watcher.js';
import { refreshSession } from '../lib/api/client.js';
import { clearPersistedSession } from '../lib/auth/session-persistence.js';
import './root-layout.css';

const STATUS_LABEL: Record<'connecting' | 'open' | 'closed', string> = {
  connecting: 'conectando',
  open: 'conectado',
  closed: 'offline'
};

export function RootLayout() {
  const location = useLocation();
  const setGatewayStatus = useUiStore((state) => state.setGatewayStatus);
  const gatewayStatus = useUiStore((state) => state.gatewayStatus);
  const authStatus = useAuthStore((state) => state.status);
  const isAuthRoute = ['/login', '/register', '/forgot-password', '/reset-password'].includes(
    location.pathname
  );
  const isLandingRoute = location.pathname === '/';

  useEffect(() => {
    if (authStatus !== 'authenticated') return;

    const getAccessToken = () => useAuthStore.getState().accessToken;
    gateway.connect(getAccessToken);
    const unsubscribeStatus = gateway.onStatusChange(setGatewayStatus);
    const unsubscribeRevoked = gateway.onSessionRevoked(() => {
      clearPersistedSession();
      useAuthStore.getState().clearSession('revoked');
    });
    const unsubscribeUnauthorized = gateway.onUnauthorized(() => {
      void refreshSession().then((refreshed) => {
        if (useAuthStore.getState().status !== 'authenticated') return;
        if (refreshed) {
          gateway.connect(getAccessToken);
          return;
        }

        clearPersistedSession();
        useAuthStore.getState().clearSession('expired');
      });
    });

    return () => {
      unsubscribeStatus();
      unsubscribeRevoked();
      unsubscribeUnauthorized();
      gateway.disconnect();
    };
  }, [authStatus, setGatewayStatus]);

  return (
    <div className={`layout ${isAuthRoute ? 'layout--auth' : ''} ${isLandingRoute ? 'layout--landing' : ''}`}>
      {!isAuthRoute && !isLandingRoute && (
        <header className="layout__header">
          <Link to="/" className="layout__brand" aria-label="Mesmice, página inicial">
            Mesmice
          </Link>
          <ThemeToggle />
          {authStatus === 'authenticated' && <LogoutButton />}
          <span
            className={`layout__status layout__status--${gatewayStatus}`}
            role="status"
            aria-live="polite"
          >
            {STATUS_LABEL[gatewayStatus]}
          </span>
        </header>
      )}
      <main className="layout__main">
        <Outlet />
      </main>
      <SessionWatcher />
    </div>
  );
}
