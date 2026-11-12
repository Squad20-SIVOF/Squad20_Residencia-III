import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button'
import { TextField } from '@/components/TextField'
import { login, currentUser, logout } from '@/service/authService'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { MobileHeader } from '../../components/MobileHeader'
import styles from './LoginMobile.module.scss'
export function LoginMobile() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  useDocumentTitle('Login do motorista')
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    setError('')
    try {
      await login({ registration: email, password })
      const user = await currentUser()
      if (!user.permissoes.includes('viagens:ler-proprias')) {
        await logout()
        throw new Error(
          'Sua conta não possui acesso ao app do motorista. Contate o gestor.',
        )
      }
      navigate('/', { replace: true })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível entrar.')
    } finally {
      setSaving(false)
    }
  }
  return (
    <div className={styles.screen}>
      <MobileHeader menu={false} />
      <main className={styles.main}>
        <section className={styles.content} aria-labelledby="driver-login-title">
          <div className={styles.brand} aria-hidden="true">
            SVO
          </div>
          <div className={styles.heading}>
            <h1 id="driver-login-title">Login</h1>
            <p>Acesse sua conta de motorista</p>
          </div>
          <form className={styles.form} onSubmit={submit}>
            <div className={styles.fields}>
              <TextField
                label="E-mail"
                type="email"
                autoComplete="username"
                value={email}
                onChange={setEmail}
                required
                disabled={saving}
              />
              <TextField
                label="Senha"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={setPassword}
                required
                disabled={saving}
              />
            </div>
            {error && <p role="alert">{error}</p>}
            <Button type="submit" isFullWidth isLoading={saving}>
              Entrar
            </Button>
          </form>
          <p className={styles.helpText}>Problemas de acesso? Contate o gestor.</p>
        </section>
      </main>
    </div>
  )
}
