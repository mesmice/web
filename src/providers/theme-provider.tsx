import { useEffect, type ReactNode } from 'react'
import { useThemeStore, type ThemePreference } from '../stores/theme-store.js'

function resolveTheme(preference: ThemePreference): 'light' | 'dark' {
  if (preference !== 'system') return preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const preference = useThemeStore((state) => state.preference)

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = resolveTheme(preference)

    if (preference !== 'system') return

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      root.dataset.theme = resolveTheme('system')
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [preference])

  return children
}
