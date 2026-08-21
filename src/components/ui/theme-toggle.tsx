import { Button } from './button.js'
import { useThemeStore } from '../../stores/theme-store.js'
import type { ThemePreference } from '../../stores/theme-store.js'

const NEXT: Record<ThemePreference, ThemePreference> = {
  system: 'light',
  light: 'dark',
  dark: 'system'
}

export function ThemeToggle() {
  const preference = useThemeStore((state) => state.preference)
  const setPreference = useThemeStore((state) => state.setPreference)

  return (
    <Button
      variant="ghost"
      aria-label={`Tema atual: ${preference}. Alternar para ${NEXT[preference]}`}
      title={`Tema: ${preference}`}
      onClick={() => setPreference(NEXT[preference])}
    >
      {preference === 'system' ? 'Sistema' : preference === 'light' ? 'Claro' : 'Escuro'}
    </Button>
  )
}
