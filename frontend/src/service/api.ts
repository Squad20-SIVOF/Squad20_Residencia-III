const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(
  /\/$/,
  '',
)
const TOKEN_KEY = 'frotamanager:session'

export const getSessionToken = () => sessionStorage.getItem(TOKEN_KEY)
export const setSessionToken = (token: string) => sessionStorage.setItem(TOKEN_KEY, token)
export const clearSession = () => sessionStorage.removeItem(TOKEN_KEY)

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body) headers.set('Content-Type', 'application/json')
  const token = getSessionToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    signal: options.signal ?? AbortSignal.timeout(20_000),
  })
  if (response.status === 401) clearSession()
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as {
      message?: unknown
    } | null
    throw new Error(
      typeof error?.message === 'string'
        ? error.message
        : 'Não foi possível concluir a operação.',
    )
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
