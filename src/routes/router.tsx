import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from './root-layout.js';
import { LandingPage } from '../features/landing/landing-page.js';
import { LoginPage } from '../features/auth/login-page.js';
import { ForgotPasswordPage, ResetPasswordPage } from '../features/auth/password-recovery-page.js';
import { RegisterPage } from '../features/auth/register-page.js';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'reset-password', element: <ResetPasswordPage /> },
      { path: 'register', element: <RegisterPage /> }
    ]
  }
]);
