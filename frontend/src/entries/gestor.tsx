import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/App'
import { initializeTheme } from '@/hooks/useTheme'
import '@/styles/main.scss'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Elemento #root não encontrado.')

initializeTheme()
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
