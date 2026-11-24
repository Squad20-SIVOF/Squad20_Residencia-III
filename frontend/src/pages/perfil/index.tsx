import { useEffect, useRef, useState } from 'react'
import { LoadingState } from '@/components/LoadingState/LoadingState'
import { readPhoto } from '@/utils/photo'
import { Button } from '@/components/Button'
import { TextField } from '@/components/TextField'
import { currentUser, type SessionUser } from '@/service/authService'
import { api } from '@/service/api'
import styles from './ProfilePage.module.scss'

const toast = {
  success: (message: string) => window.alert(message),
  error: (message: string) => window.alert(message),
}

const icon =
  (...paths: string[]) =>
  ({ className }: { className?: string }) => (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {paths.map((path, index) => (
        <path key={index} d={path} />
      ))}
    </svg>
  )

const Camera = icon(
  'M14 4h-4L8 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-4z',
  'M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
)
const ShieldCheck = icon('M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11', 'm9 12 2 2 4-4')
const Eye = icon(
  'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12',
  'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6',
)
const EyeOff = icon(
  'm3 3 18 18',
  'M10.6 10.6a2 2 0 0 0 2.8 2.8',
  'M9.9 5.2A10.8 10.8 0 0 1 12 5c6.4 0 10 7 10 7a15 15 0 0 1-3 3.8',
  'M6.6 6.6C3.7 8.4 2 12 2 12s3.6 7 10 7a10 10 0 0 0 3-.5',
)

function PasswordField({
  id,
  label,
  value,
  onChange,
  error,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
}) {
  const [show, setShow] = useState(false)

  return (
    <div className={styles.passwordField}>
      <div className={styles.passwordInput}>
        <TextField
          id={id}
          label={label}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          isInvalid={Boolean(error)}
          errorMessage={error}
          className={styles.passwordTextField}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
          className={styles.passwordToggle}
        >
          {show ? <EyeOff className={styles.icon} /> : <Eye className={styles.icon} />}
        </button>
      </div>
    </div>
  )
}

function PasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [saving, setSaving] = useState(false)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [errors, setErrors] = useState<{
    current?: string
    next?: string
    confirmation?: string
  }>({})
  const dialogRef = useRef<HTMLDialogElement>(null)

  const reset = () => {
    setCurrent('')
    setNext('')
    setConfirmation('')
    setErrors({})
  }

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
  }, [open])

  const close = () => {
    reset()
    onOpenChange(false)
  }

  const submit = async () => {
    const validationErrors: typeof errors = {}
    if (saving) return
    if (!current) validationErrors.current = 'Informe a senha atual.'
    if (!next) validationErrors.next = 'Informe a nova senha.'
    else if (next.length < 12 || next.length > 256)
      validationErrors.next = 'A nova senha deve ter de 12 a 256 caracteres.'
    if (!confirmation) validationErrors.confirmation = 'Confirme a nova senha.'
    else if (next && confirmation !== next)
      validationErrors.confirmation = 'As senhas não coincidem.'

    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setSaving(true)
    try {
      await api('/auth/password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: current,
          newPassword: next,
        }),
      })
      toast.success('Senha alterada com sucesso.')
      close()
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : 'Não foi possível alterar a senha.'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="password-dialog-title"
      onCancel={(event) => {
        event.preventDefault()
        close()
      }}
    >
      <div className={styles.dialogContent}>
        <h2 id="password-dialog-title" className={styles.dialogTitle}>
          Alterar senha
        </h2>
        <div className={styles.passwordFields}>
          <PasswordField
            id="current-password"
            label="Senha atual"
            value={current}
            onChange={setCurrent}
            error={errors.current}
          />
          <PasswordField
            id="new-password"
            label="Nova senha"
            value={next}
            onChange={setNext}
            error={errors.next}
          />
          <PasswordField
            id="confirm-password"
            label="Confirmar nova senha"
            value={confirmation}
            onChange={setConfirmation}
            error={errors.confirmation}
          />
        </div>
        <div className={styles.dialogActions}>
          <Button variant="secondary" onClick={close} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={submit} isLoading={saving}>
            Salvar senha
          </Button>
        </div>
      </div>
    </dialog>
  )
}

const initialProfile = {
  email: '',
  telefone: '',
  departamento: '',
  cargo: '',
  matricula: '',
}

function profileData(user: SessionUser) {
  return {
    email: user.email,
    telefone: user.telefone ?? '',
    departamento: user.departamento ?? '',
    cargo: user.cargo ?? '',
    matricula: user.matricula ?? '',
  }
}
export default function ProfilePage() {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [error, setError] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)
  const [data, setData] = useState(initialProfile)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    currentUser()
      .then((sessionUser) => {
        setUser(sessionUser)
        setData(profileData(sessionUser))
        setPhoto(sessionUser.foto ?? null)
      })
      .catch((cause: Error) => setError(cause.message))
  }, [])

  const onFile = async (file?: File) => {
    if (!file) return
    try {
      setPhoto(await readPhoto(file))
      setEditing(true)
    } catch (cause) {
      setError((cause as Error).message)
    }
  }

  const setField = (key: keyof typeof initialProfile) => (value: string) =>
    setData((currentData) => ({ ...currentData, [key]: value }))

  const save = async () => {
    if (saving) return
    if (!/^\S+@\S+\.\S+$/.test(data.email)) {
      toast.error('Informe um e-mail válido.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await api('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ ...data, foto: photo }),
      })
      const saved = await currentUser()
      setUser(saved)
      setData(profileData(saved))
      setPhoto(saved.foto ?? null)
      setEditing(false)
      toast.success('Dados salvos com sucesso.')
    } catch (cause) {
      setError((cause as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (!user && !error) return <LoadingState label="Carregando perfil" />
  return (
    <div className={styles.page}>
      <div>
        <h1 className={styles.title}>Perfil de Usuário</h1>
        <p className={styles.subtitle}>
          Gerencie seus dados cadastrais e preferências de acesso
        </p>

        {error && <p role="alert">{error}</p>}

        <section className={styles.profileCard} aria-label="Informações do usuário">
          <div className={styles.avatar}>
            {photo ? (
              <img src={photo} alt="Foto de perfil" />
            ) : (
              (user?.nome ?? 'U').slice(0, 2).toUpperCase()
            )}
          </div>
          <div className={styles.profileInfo}>
            <h2>{user?.nome ?? 'Usuário'}</h2>
            <p>{user ? `${user.nome} · ${user.email}` : 'Carregando dados...'}</p>
            <p className={styles.verified}>
              <ShieldCheck className={styles.smallIcon} /> Perfil verificado
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className={styles.hiddenInput}
            onChange={(event) => onFile(event.target.files?.[0])}
          />
          <Button
            variant="secondary"
            className={styles.smallButton}
            disabled={saving}
            onClick={() => fileRef.current?.click()}
          >
            <Camera className={styles.smallIcon} /> Alterar foto
          </Button>
        </section>

        <section className={styles.detailsCard}>
          <h2 className={styles.sectionTitle}>Dados Cadastrais</h2>
          <div className={styles.fieldsGrid}>
            <TextField
              id="email"
              label="E-mail"
              value={data.email}
              onChange={setField('email')}
              readOnly={!editing || saving}
              className={styles.profileField}
            />

            <TextField
              id="telefone"
              label="Telefone"
              value={data.telefone}
              onChange={setField('telefone')}
              readOnly={!editing || saving}
              className={styles.profileField}
            />
            <TextField
              id="departamento"
              label="Departamento"
              value={data.departamento}
              onChange={setField('departamento')}
              readOnly={!editing || saving}
              className={`${styles.profileField} ${styles.fieldWide}`}
            />
            <TextField
              id="cargo"
              label="Cargo"
              value={data.cargo}
              onChange={setField('cargo')}
              readOnly={!editing || saving}
              className={styles.profileField}
            />
            <TextField
              id="matricula"
              label="Matrícula"
              value={data.matricula}
              onChange={setField('matricula')}
              readOnly={!editing || saving}
              className={styles.profileField}
            />
          </div>

          <div className={styles.passwordSummary}>
            <div>
              <p className={styles.passwordSummaryTitle}>Senha de acesso</p>
              <p className={styles.passwordSummaryDescription}>
                {user?.senha_alterada_em
                  ? `Última alteração em ${new Date(user.senha_alterada_em).toLocaleDateString('pt-BR')}`
                  : 'Data da última alteração não registrada'}
              </p>
            </div>
            <Button
              variant="secondary"
              className={styles.smallButton}
              onClick={() => setPasswordDialogOpen(true)}
            >
              Alterar senha
            </Button>
          </div>

          <div className={styles.formActions}>
            <Button
              variant="secondary"
              className={styles.smallButton}
              disabled={saving}
              onClick={() => {
                if (editing && user) {
                  setData(profileData(user))
                  setPhoto(user.foto ?? null)
                  setError('')
                }
                setEditing(!editing)
              }}
            >
              {editing ? 'Cancelar' : 'Editar'}
            </Button>
            <Button
              className={styles.smallButton}
              onClick={save}
              disabled={!editing || !user}
              isLoading={saving}
            >
              Salvar
            </Button>
          </div>
        </section>
      </div>
      <PasswordDialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen} />
    </div>
  )
}
