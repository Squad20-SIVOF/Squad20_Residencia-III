import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { DriverApp } from '@/apps/motorista/DriverApp'
import { registerServiceWorker } from '@/apps/motorista/pwa/registerServiceWorker'
import '@/styles/main.scss'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Elemento #root não encontrado.')

createRoot(rootElement).render(
  <StrictMode>
    <DriverApp />
  </StrictMode>,
)

registerServiceWorker()
