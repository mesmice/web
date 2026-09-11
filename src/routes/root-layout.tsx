import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ThemeToggle } from '../components/ui/theme-toggle.js';
import { LogoutButton } from '../features/auth/logout-button.js';
import { useAuthStore } from '../stores/auth-store.js';
import { gateway } from '../lib/ws/socket.js';
import { profileKeys } from '../features/profile/api/profile-query-keys.js';
import { useUiStore } from '../stores/ui-store.js';
import { SessionWatcher } from '../components/system/session-watcher.js';
import { refreshSession } from '../lib/api/client.js';
import { clearPersistedSession } from '../lib/auth/session-persistence.js';
import { queryClient } from '../lib/query-client.js';
import { ConversationRealtimeSync } from '../features/messages/realtime/conversation-realtime-sync.js';
import './root-layout.css';

const STATUS_LABEL = {
  disconnected: 'offline', connecting: 'conectando', connected: 'conectado',
  reconnecting: 'reconectando', unavailable: 'indisponível', revoked: 'sessão encerrada'
};

export function RootLayout() {
  const location = useLocation();
  const setGatewayStatus = useUiStore((state) => state.setGatewayStatus);
  const gatewayStatus = useUiStore((state) => state.gatewayStatus);
  const setPresence = useUiStore((state) => state.setPresence);
  const authStatus = useAuthStore((state) => state.status);
  const isAuthRoute = ['/login', '/register', '/forgot-password', '/reset-password'].includes(
    location.pathname
  );
  const isLandingRoute = location.pathname === '/';

  useEffect(() => {
    if (authStatus !== 'authenticated') return;

    const getAccessToken = () => useAuthStore.getState().accessToken;
    gateway.connect(getAccessToken);
    const unsubscribeStatus = gateway.onStatusChange((status) => {
      setGatewayStatus(status);
      if (status === 'connected') {
        const user = useAuthStore.getState().user;
        if (user) setPresence(user.id, user.presence);
      }
      if (status === 'disconnected' || status === 'unavailable') {
        const userId = useAuthStore.getState().user?.id;
        if (userId) setPresence(userId, 'offline');
      }
    });
    const unsubscribeMessages = gateway.onMessage((message) => {
      if (message.type === 'presence.update') setPresence(message.payload.userId, message.payload.status);
      if (message.type === 'user.update') {
        queryClient.setQueryData(profileKeys.me(), (current: ReturnType<typeof useAuthStore.getState>['user']) =>
          current ? { ...current, ...message.payload.user } : current
        );
        if (message.payload.user.id === useAuthStore.getState().user?.id) setPresence(message.payload.user.id, message.payload.user.presence);
      }
    });
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
      unsubscribeMessages();
      unsubscribeRevoked();
      unsubscribeUnauthorized();
      gateway.disconnect();
    };
  }, [authStatus, setGatewayStatus, setPresence]);

  return (
    <div className={`layout ${isAuthRoute ? 'layout--auth' : ''} ${isLandingRoute ? 'layout--landing' : ''}`}>
      {!isAuthRoute && !isLandingRoute && (
        <header className="layout__header">
          <Link to="/" className="layout__brand" aria-label="Mesmice, página inicial">
            Mesmice
          </Link>
          {authStatus === 'authenticated' ? (
            <nav className="layout__navigation" aria-label="Navegação principal">
              <NavLink to="/app/dms">Mensagens</NavLink>
            </nav>
          ) : null}
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
      {authStatus === 'authenticated' && <ConversationRealtimeSync />}
    </div>
  );
}
