import { useEffect } from 'react'

/** Atualiza o título da aba com o nome do aplicativo. */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    const appName =
      document.documentElement.dataset.app === 'motorista'
        ? 'SIVOF Driver'
        : 'SIVOF Manager'
    document.title = `${title} — ${appName}`
  }, [title])
}
