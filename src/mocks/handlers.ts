import { http, HttpResponse } from 'msw'

/**
 * Handlers do worker de BROWSER (dev com VITE_ENABLE_MOCKS=true).
 * Apenas infraestrutura: nenhum fluxo de autenticação é mockado aqui —
 * o login real pertence às telas do Épico 2 contra a API verdadeira.
 * Fixtures de auth da suíte de testes vivem em `test-handlers.ts`.
 */
export const handlers = [
  http.get('*/api/v1/health/live', () => {
    return HttpResponse.json({ status: 'ok' })
  }),
  http.get('*/api/v1/health/ready', () => {
    return HttpResponse.json({
      status: 'degraded',
      checks: [
        { name: 'mongo', ok: false },
        { name: 'redis', ok: false }
      ]
    })
  })
]
