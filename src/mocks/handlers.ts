import { http, HttpResponse } from 'msw'

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
