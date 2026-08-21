import { createBrowserRouter } from 'react-router-dom'
import { RootLayout } from './root-layout.js'
import { HomePage } from '../features/home/home-page.js'
import { LoginPage } from '../features/auth/login-page.js'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'login', element: <LoginPage /> }
    ]
  }
])
