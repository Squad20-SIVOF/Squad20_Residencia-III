import { Button } from '@/components/Button'
import { TextField } from '@/components/TextField'
import { useLoginForm } from '../../hooks/useLoginForm'
import type { LoginFormValues } from '../../types'
import styles from './LoginForm.module.scss'

export interface LoginFormProps {
  onSubmit: (values: LoginFormValues) => Promise<void>
  onForgotPassword?: () => void
}

export function LoginForm({ onSubmit, onForgotPassword }: LoginFormProps) {
  const { values, errors, status, isLoading, handleChange, handleSubmit } =
    useLoginForm(onSubmit)

  const handleForgotPassword = () => {
    onForgotPassword?.()
  }

  return (
    <section className={styles.card} aria-labelledby="login-title">
      <header className={styles.header}>
        <h1 className={styles.title} id="login-title">
          Login
        </h1>
        <p className={styles.subtitle}>Acesse sua conta do SIVOF Manager</p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <TextField
          id="registration"
          name="registration"
          label="E-mail"
          type="email"
          value={values.registration}
          placeholder="Digite seu e-mail"
          autoComplete="username"
          isInvalid={Boolean(errors.registration)}
          errorMessage={errors.registration}
          disabled={isLoading}
          onChange={(value) => handleChange(value, 'registration')}
        />

        <TextField
          id="password"
          name="password"
          type="password"
          label="Senha"
          value={values.password}
          placeholder="Digite sua senha"
          autoComplete="current-password"
          isInvalid={Boolean(errors.password)}
          errorMessage={errors.password}
          disabled={isLoading}
          onChange={(value) => handleChange(value, 'password')}
        />

        {status === 'error' && !errors.registration && !errors.password ? (
          <p className={styles.formError} role="alert">
            Não foi possível entrar. Tente novamente.
          </p>
        ) : null}

        <Button type="submit" isLoading={isLoading}>
          Confirmar
        </Button>
      </form>

      <a
        className={styles.forgot}
        href="#recuperar-senha"
        onClick={(event) => {
          event.preventDefault()
          handleForgotPassword()
        }}
      >
        Esqueceu sua senha?
      </a>
    </section>
  )
}
