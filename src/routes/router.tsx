import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { RootLayout } from './root-layout.js';
import { LandingPage } from '../features/landing/landing-page.js';
import { LoginPage } from '../features/auth/login-page.js';
import { ForgotPasswordPage, ResetPasswordPage } from '../features/auth/password-recovery-page.js';
import { RegisterPage } from '../features/auth/register-page.js';
import { RequireAuth } from '../features/auth/require-auth.js';
import { ProfilePage, PublicProfileRoute } from '../features/profile/profile-page.js';
import { SpacesPage } from '../features/spaces/pages/spaces-page.js';
import { DmListPage } from '../features/messages/pages/dm-list-page.js';
import { SavedMessagesPage } from '../features/messages/pages/saved-messages-page.js';

export function createProfileRoute(isDevelopment: boolean): RouteObject {
  void isDevelopment;
  return {
    element: <RequireAuth />,
    children: [{ path: 'profile', element: <ProfilePage /> }]
  };
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'reset-password', element: <ResetPasswordPage /> },
      { path: 'register', element: <RegisterPage /> },
      {
        element: <RequireAuth />,
        children: [
          { path: 'app', element: <SpacesPage /> },
          { path: 'app/dms', element: <DmListPage /> },
          { path: 'app/dms/:conversationId', element: <DmListPage /> },
          { path: 'app/saved', element: <SavedMessagesPage /> }
        ]
      },
      createProfileRoute(import.meta.env.DEV),
      {
        element: <RequireAuth />,
        children: [{ path: 'users/:userId', element: <PublicProfileRoute /> }]
      }
    ]
  }
]);
