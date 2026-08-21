import { apiFetch } from './client.js'
import type { ReadinessReport } from '../types/api.js'

export function getLiveness(): Promise<{ status: 'ok' }> {
  return apiFetch('/health/live')
}

export function getReadiness(): Promise<ReadinessReport> {
  return apiFetch('/health/ready')
}
