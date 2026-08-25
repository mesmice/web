/**
 * Único ponto do app que lê/escreve o refreshToken no storage (decisão B2:
 * localStorage durante o desenvolvimento — migrar para cookie httpOnly via
 * BFF antes do MVP; tradeoff XSS registrado em TASKS.md/DEVLOG.md).
 *
 * Mantido puro: nenhuma importação da camada de API, para evitar ciclos.
 */

const REFRESH_TOKEN_KEY = 'mesmice.refresh'

export function getSavedRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function saveRefreshToken(refreshToken: string): void {
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

export function clearPersistedSession(): void {
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}
