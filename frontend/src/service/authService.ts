import type { LoginFormValues } from '@/pages/auth/types'
import { api, clearSession, setSessionToken } from './api'

export interface SessionUser {
  id: string
  nome: string
  email: string
  permissoes: string[]
  telefone?: string | null
  departamento?: string | null
  cargo?: string | null
  matricula?: string | null
  foto?: string | null
  senha_alterada_em?: string | null
}

export async function login(values: LoginFormValues): Promise<void> {
  clearSession()
  const result = await api<{ token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: values.registration, password: values.password }),
  })
  setSessionToken(result.token)
}

export const currentUser = () => api<SessionUser>('/auth/me')

export async function logout(): Promise<void> {
  try {
    await api<void>('/auth/logout', { method: 'POST' })
  } finally {
    clearSession()
  }
}
