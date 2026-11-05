import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { currentUser, type SessionUser } from '@/service/authService'
import { getSessionToken } from '@/service/api'
import { LoadingState } from '@/components/LoadingState/LoadingState'

export function RequireAuth() {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  useEffect(() => {
    let active = true
    if (!getSessionToken()) return
    currentUser()
      .then((value) => {
        if (active) {
          setUser(value)
          setStatus('ready')
        }
      })
      .catch(() => {
        if (active) setStatus('error')
      })
    return () => {
      active = false
    }
  }, [])
  if (!getSessionToken()) return <Navigate to="/login" replace />
  if (status === 'loading') return <LoadingState fullPage label="Carregando seu acesso" />
  if (status === 'error')
    return (
      <p role="alert">
        Não foi possível validar a sessão. Recarregue a página para tentar novamente.
      </p>
    )
  return <Outlet context={user} />
}
