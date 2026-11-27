import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'

type Theme = 'light' | 'dark'
const STORAGE_KEY = 'sivof:tema'

function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // O tema ainda pode ser alterado sem armazenamento local.
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function initializeTheme() {
  document.documentElement.dataset.theme = readTheme()
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const current = document.documentElement.dataset.theme
    return current === 'light' || current === 'dark' ? current : readTheme()
  })
  const pendingTheme = useRef(theme)

  function toggleTheme() {
    pendingTheme.current = pendingTheme.current === 'light' ? 'dark' : 'light'

    function applyTheme() {
      const next = pendingTheme.current
      document.documentElement.dataset.theme = next
      setTheme(next)
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        // Sem armazenamento, a escolha permanece até recarregar a página.
      }
    }

    if (
      typeof document.startViewTransition !== 'function' ||
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      applyTheme()
      return
    }

    const transition = document.startViewTransition(() => flushSync(applyTheme))
    // Uma transição interrompida ainda aplica o tema.
    void transition.ready.catch(() => {})
  }

  return { theme, toggleTheme }
}
