import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes/router.js'
import { queryClient } from './lib/query-client.js'
import { restoreSession } from './lib/auth/session.js'
import { ThemeProvider } from './providers/theme-provider.js'
import './styles/global.css'

async function enableMocking(): Promise<void> {
  if (!import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCKS !== 'true') return
  const { worker } = await import('./mocks/browser.js')
  await worker.start({ onUnhandledRequest: 'bypass' })
}

async function bootstrap(): Promise<void> {
  await enableMocking()

  // Restaura a sessão salva (refresh silencioso) fora da árvore React —
  // single-flight; a guarda de rotas espera enquanto o status é 'booting'.
  void restoreSession()

  const container = document.getElementById('root')
  if (!container) throw new Error('Elemento #root não encontrado')

  createRoot(container).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <RouterProvider router={router} />
        </ThemeProvider>
      </QueryClientProvider>
    </StrictMode>
  )
}

void bootstrap()
