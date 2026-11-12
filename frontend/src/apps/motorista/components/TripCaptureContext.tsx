import { createContext, useContext, useState } from 'react'
import { Outlet } from 'react-router-dom'
import type { CaptureType } from '../types'
export interface TripCapture {
  tripId: string
  type: CaptureType
  foto: string
  km: string
  capturedAt: string
}
const CaptureContext = createContext<{
  capture: TripCapture | null
  setCapture: (capture: TripCapture | null) => void
} | null>(null)
export function TripCaptureProvider() {
  const [capture, setCapture] = useState<TripCapture | null>(null)
  // Evidências ficam apenas em memória até a confirmação; sair da sessão desmonta o provider.
  return (
    <CaptureContext.Provider value={{ capture, setCapture }}>
      <Outlet />
    </CaptureContext.Provider>
  )
}
export function useTripCapture() {
  const value = useContext(CaptureContext)
  if (!value) throw new Error('TripCaptureProvider ausente')
  return value
}
