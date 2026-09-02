import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { RootLayout } from './root-layout.js';
import { LandingPage } from '../features/landing/landing-page.js';
import { LoginPage } from '../features/auth/login-page.js';
import { ForgotPasswordPage, ResetPasswordPage } from '../features/auth/password-recovery-page.js';
import { RegisterPage } from '../features/auth/register-page.js';
import { RequireAuth } from '../features/auth/require-auth.js';
import { ProfilePage } from '../features/profile/profile-page.js';

export function createProfileRoute(isDevelopment: boolean): RouteObject {
  if (isDevelopment) {
    return { path: 'profile', element: <ProfilePage /> };
  }

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
      createProfileRoute(import.meta.env.DEV)
    ]
  }
]);
