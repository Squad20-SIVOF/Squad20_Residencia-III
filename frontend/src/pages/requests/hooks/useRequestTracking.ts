import { useCallback, useEffect, useState } from 'react'
import { useAsync } from '@/hooks/useAsync'
import type { RequestTracking } from '../types'
import { getRequestTracking } from '../services/requestService'

/** Intervalo entre as consultas da posição do motorista. */
export const TRACKING_POLL_MS = 3_000
const CLOCK_TICK_MS = 1_000

interface LiveTracking {
  id: string
  data: RequestTracking
}

/**
 * Carrega o acompanhamento e continua consultando a posição até o embarque.
 * Falha numa consulta intermediária mantém a última posição; a tela avisa
 * quando ela fica velha (veja isLocationStale).
 */
export function useRequestTracking(id: string) {
  const loadTracking = useCallback(() => getRequestTracking(id), [id])
  const request = useAsync(loadTracking)
  const [live, setLive] = useState<LiveTracking | null>(null)
  const [now, setNow] = useState(() => new Date())

  const initial = request.status === 'success' ? request.data : null
  const tracking = live?.id === id ? live.data : initial
  const isPolling = request.status === 'success' && tracking?.stage !== 'embarque'

  useEffect(() => {
    if (!isPolling) return

    let isActive = true
    const timer = setInterval(() => {
      getRequestTracking(id).then(
        (data) => {
          if (isActive) setLive({ id, data })
        },
        () => {},
      )
    }, TRACKING_POLL_MS)

    return () => {
      isActive = false
      clearInterval(timer)
    }
  }, [id, isPolling])

  // Relógio para "Localização atualizada há X s".
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), CLOCK_TICK_MS)
    return () => clearInterval(timer)
  }, [])

  return { request, tracking, now }
}
