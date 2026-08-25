import { setupServer } from 'msw/node'
import { handlers } from './handlers.js'
import { authTestHandlers } from './test-handlers.js'

/** Servidor MSW da suíte de testes: handlers base + fixtures de auth. */
export const server = setupServer(...handlers, ...authTestHandlers)
