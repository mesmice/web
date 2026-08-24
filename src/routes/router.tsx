import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from './root-layout.js';
import { HomePage } from '../features/home/home-page.js';
import { LoginPage } from '../features/auth/login-page.js';
import { RegisterPage } from '../features/auth/register-page.js';
import { RequireAuth } from '../features/auth/require-auth.js';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        element: <RequireAuth />,
        children: [{ index: true, element: <HomePage /> }]
      },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> }
    ]
  }
]);
