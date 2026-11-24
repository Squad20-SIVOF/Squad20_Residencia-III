import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { ContactRound, ShieldCheck, UserRoundPlus } from 'lucide-react'
import { api } from '@/service/api'
import { currentUser, type SessionUser } from '@/service/authService'
import { Button } from '@/components/Button'
import { LoadingState } from '@/components/LoadingState/LoadingState'
import { TextField } from '@/components/TextField'
import { PageHeader } from '@/components/PageHeader'
import { Card } from '@/components/Card'
import { Alert } from '@/components/Alert'
import { SelectField } from '@/components/SelectField'
import { PermissionsPanel } from './components/PermissionsPanel'
import { UsersDirectory } from './components/UsersDirectory'
import type { User, Delegation } from './types'
import styles from './UsersPage.module.scss'

interface Profile {
  id: string
  nome: string
  codigo: string | null
}

function AdminCard({
  title,
  description,
  icon,
  children,
}: {
  title: string
  description: string
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <Card className={styles.adminCard}>
      <header className={styles.adminCardHeader}>
        <span className={styles.iconTile} aria-hidden="true">
          {icon}
        </span>
        <div>
          <h3>{title}</h3>
          <p className={styles.muted}>{description}</p>
        </div>
      </header>
      {children}
    </Card>
  )
}

export function UsersPage() {
  const [actor, setActor] = useState<SessionUser | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [delegation, setDelegation] = useState<Delegation>({
    usuarios: [],
    permissoesDisponiveis: [],
  })
  const [drivers, setDrivers] = useState<{ id: string; nome: string }[]>([])
  const [driverLink, setDriverLink] = useState({ usuario_id: '', motorista_id: '' })
  const [activeTab, setActiveTab] = useState<'users' | 'permissions'>('users')
  const [membership, setMembership] = useState({ usuario_id: '', perfil_id: '' })
  const [form, setForm] = useState({
    nome: '',
    email: '',
    password: '',
    perfil_id: '',
    motorista_id: '',
  })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const me = await currentUser()
    setActor(me)
    if (me.permissoes.includes('usuarios:gerenciar')) {
      const [allUsers, allProfiles, allDrivers] = await Promise.all([
        api<User[]>('/usuarios'),
        me.permissoes.includes('perfis:ler')
          ? api<{ message: Profile[] }>('/perfis')
          : Promise.resolve({ message: [] }),
        api<{ id: string; nome: string }[]>('/usuarios/motoristas-opcoes'),
      ])
      setUsers(allUsers)
      setDrivers(allDrivers)
      setProfiles(
        allProfiles.message.filter(
          (p) => !['gestor_svo', 'atendente_svo'].includes(p.codigo ?? ''),
        ),
      )
    }
    if (me.permissoes.includes('usuarios:delegar-permissoes'))
      setDelegation(await api<Delegation>('/usuarios/permissoes'))
  }, [])

  useEffect(() => {
    Promise.resolve()
      .then(load)
      .catch((cause: Error) => setError(cause.message))
      .finally(() => setLoading(false))
  }, [load])

  async function create(event: FormEvent) {
    event.preventDefault()
    if (saving || !form.perfil_id) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await api('/usuarios', {
        method: 'POST',
        body: JSON.stringify({ ...form, motorista_id: form.motorista_id || null }),
      })
      setForm({ nome: '', email: '', password: '', perfil_id: '', motorista_id: '' })
      await load()
      setMessage('Usuário criado.')
    } catch (cause) {
      setError((cause as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function changeProfile(removing: boolean) {
    if (saving) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await api(`/usuarios/${membership.usuario_id}/perfis`, {
        method: removing ? 'DELETE' : 'POST',
        body: JSON.stringify({ perfil_id: membership.perfil_id }),
      })
      await load()
      setMessage(removing ? 'Perfil removido.' : 'Perfil atribuído.')
    } catch (cause) {
      setError((cause as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function saveDriverLink(event: FormEvent) {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await api(`/usuarios/${driverLink.usuario_id}/motorista`, {
        method: 'PUT',
        body: JSON.stringify({ motorista_id: driverLink.motorista_id || null }),
      })
      await load()
      setMessage('Vínculo do motorista atualizado.')
    } catch (cause) {
      setError((cause as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function savePermissions(selected: string, permissions: string[]) {
    if (saving) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await api(`/usuarios/${selected}/permissoes`, {
        method: 'PUT',
        body: JSON.stringify({ permissoes: permissions }),
      })
      await load()
      setMessage('Permissões atualizadas.')
    } catch (cause) {
      setError((cause as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingState label="Carregando usuários" />
  const canCreate = actor?.permissoes.includes('usuarios:gerenciar')
  const canDelegate = actor?.permissoes.includes('usuarios:delegar-permissoes')
  const canManageProfiles = actor?.permissoes.includes('usuarios:gerenciar-perfis')
  const selectedTab = !canCreate ? 'permissions' : !canDelegate ? 'users' : activeTab
  const profileOptions = profiles.map(({ id, nome }) => ({ value: id, label: nome }))
  const userOptions = users.map(({ id, nome, email }) => ({
    value: id,
    label: `${nome} — ${email}`,
  }))
  const driverOptions = [
    { value: '', label: 'Sem vínculo' },
    ...drivers.map(({ id, nome }) => ({ value: id, label: nome })),
  ]
  const profileSelected = Boolean(membership.usuario_id && membership.perfil_id)

  return (
    <section className={styles.page}>
      <PageHeader
        className={styles.heading}
        title="Usuários e permissões"
        subtitle="Organize os usuários, seus perfis e os acessos da equipe."
      />
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      {message && <output className={styles.success}>{message}</output>}
      {canDelegate && canCreate && (
        <div
          className={styles.tabs}
          role="tablist"
          aria-label="Gestão de acessos"
          tabIndex={-1}
          onKeyDown={(event) => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
            event.preventDefault()
            const next =
              event.key === 'Home'
                ? 'users'
                : event.key === 'End'
                  ? 'permissions'
                  : selectedTab === 'users'
                    ? 'permissions'
                    : 'users'
            setActiveTab(next)
            event.currentTarget.querySelector<HTMLButtonElement>(`#${next}-tab`)?.focus()
          }}
        >
          <button
            type="button"
            role="tab"
            id="users-tab"
            aria-controls="users-panel"
            aria-selected={selectedTab === 'users'}
            tabIndex={selectedTab === 'users' ? 0 : -1}
            onClick={() => setActiveTab('users')}
          >
            Usuários e vínculos
          </button>
          <button
            type="button"
            role="tab"
            id="permissions-tab"
            aria-controls="permissions-panel"
            aria-selected={selectedTab === 'permissions'}
            tabIndex={selectedTab === 'permissions' ? 0 : -1}
            onClick={() => setActiveTab('permissions')}
          >
            Permissões dos usuários
          </button>
        </div>
      )}
      {canDelegate && selectedTab === 'permissions' && (
        <div
          role={canCreate ? 'tabpanel' : undefined}
          id="permissions-panel"
          aria-labelledby={canCreate ? 'permissions-tab' : undefined}
        >
          <PermissionsPanel
            delegation={delegation}
            saving={saving}
            onSave={savePermissions}
          />
        </div>
      )}
      {!canCreate && !canDelegate && (
        <p>Seu usuário não possui acesso à gestão de usuários.</p>
      )}
      {canCreate && selectedTab === 'users' && (
        <div
          role={canDelegate ? 'tabpanel' : undefined}
          id="users-panel"
          aria-labelledby={canDelegate ? 'users-tab' : undefined}
          className={styles.adminForms}
        >
          <h2 className={styles.adminTitle}>Gestão de usuários</h2>
          <div className={styles.managementGrid}>
            <AdminCard
              title="Criar usuário"
              description="Preencha os dados e escolha o perfil inicial."
              icon={<UserRoundPlus size={20} />}
            >
              <form onSubmit={create}>
                <fieldset disabled={saving} className={styles.createFields}>
                  <TextField
                    id="user-name"
                    label="Nome"
                    placeholder="Nome completo"
                    value={form.nome}
                    onChange={(nome) => setForm({ ...form, nome })}
                    autoComplete="name"
                    minLength={3}
                    maxLength={150}
                    required
                  />
                  <TextField
                    id="user-email"
                    label="E-mail"
                    placeholder="nome@exemplo.com"
                    type="email"
                    value={form.email}
                    onChange={(email) => setForm({ ...form, email })}
                    autoComplete="email"
                    maxLength={150}
                    required
                  />
                  <TextField
                    id="user-password"
                    label="Senha inicial"
                    placeholder="Mínimo de 12 caracteres"
                    type="password"
                    value={form.password}
                    onChange={(password) => setForm({ ...form, password })}
                    autoComplete="new-password"
                    minLength={12}
                    maxLength={256}
                    required
                  />
                  <SelectField
                    id="user-profile"
                    label="Perfil"
                    value={form.perfil_id}
                    options={[
                      { value: '', label: 'Selecione um perfil' },
                      ...profileOptions,
                    ]}
                    onChange={(perfil_id) => setForm({ ...form, perfil_id })}
                  />
                  <SelectField
                    id="new-user-driver"
                    className={styles.fullField}
                    label="Motorista vinculado (opcional)"
                    value={form.motorista_id}
                    options={driverOptions}
                    onChange={(motorista_id) => setForm({ ...form, motorista_id })}
                  />
                </fieldset>
                <div className={styles.formFooter}>
                  <p className={styles.muted}>
                    {profileOptions.length
                      ? 'Para usar o app do motorista, atribua o perfil Motorista e vincule o cadastro.'
                      : 'O cadastro exige acesso a um perfil inicial.'}
                  </p>
                  <Button type="submit" isLoading={saving} disabled={!form.perfil_id}>
                    Criar usuário
                  </Button>
                </div>
              </form>
            </AdminCard>

            <AdminCard
              title="Alterar perfis de um usuário"
              description="Atribua ou remova perfis de uma conta existente."
              icon={<ShieldCheck size={20} />}
            >
              <fieldset
                className={styles.linkFields}
                disabled={saving || !canManageProfiles}
              >
                <SelectField
                  id="membership-user"
                  label="Usuário"
                  value={membership.usuario_id}
                  options={[{ value: '', label: 'Selecione um usuário' }, ...userOptions]}
                  onChange={(usuario_id) => setMembership({ ...membership, usuario_id })}
                />
                <SelectField
                  id="membership-profile"
                  label="Perfil a atribuir ou remover"
                  value={membership.perfil_id}
                  options={[
                    { value: '', label: 'Selecione um perfil' },
                    ...profileOptions,
                  ]}
                  onChange={(perfil_id) => setMembership({ ...membership, perfil_id })}
                />
                <div className={styles.profileActions}>
                  <Button
                    disabled={!profileSelected}
                    onClick={() => changeProfile(false)}
                  >
                    Atribuir perfil
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={!profileSelected}
                    onClick={() => changeProfile(true)}
                  >
                    Remover perfil
                  </Button>
                </div>
              </fieldset>
              {!canManageProfiles && (
                <p className={styles.muted}>
                  A alteração de perfis exige permissão específica.
                </p>
              )}
            </AdminCard>
          </div>

          <UsersDirectory
            users={users}
            saving={saving}
            onManage={(user) => {
              setMembership({ usuario_id: user.id, perfil_id: '' })
              setDriverLink({
                usuario_id: user.id,
                motorista_id: user.motorista_id ?? '',
              })
              document
                .getElementById(
                  canManageProfiles && profileOptions.length
                    ? 'membership-profile'
                    : 'driver-link-driver',
                )
                ?.focus()
            }}
          />

          <AdminCard
            title="Vincular conta a motorista"
            description="Associe uma conta ao cadastro usado no app do motorista."
            icon={<ContactRound size={20} />}
          >
            <form onSubmit={saveDriverLink}>
              <fieldset className={styles.driverFields} disabled={saving}>
                <SelectField
                  id="driver-link-user"
                  label="Conta de usuário"
                  value={driverLink.usuario_id}
                  options={[{ value: '', label: 'Selecione um usuário' }, ...userOptions]}
                  onChange={(usuario_id) =>
                    setDriverLink({
                      usuario_id,
                      motorista_id:
                        users.find((user) => user.id === usuario_id)?.motorista_id ?? '',
                    })
                  }
                />
                <SelectField
                  id="driver-link-driver"
                  label="Cadastro de motorista"
                  value={driverLink.motorista_id}
                  options={driverOptions}
                  onChange={(motorista_id) =>
                    setDriverLink({ ...driverLink, motorista_id })
                  }
                />
                <Button
                  type="submit"
                  isLoading={saving}
                  disabled={!driverLink.usuario_id}
                >
                  Salvar vínculo
                </Button>
              </fieldset>
            </form>
          </AdminCard>

          <Alert>
            <strong>Acessos dos solicitantes.</strong> O perfil Solicitante permite criar
            e consultar as próprias solicitações de viagem.
          </Alert>
        </div>
      )}
    </section>
  )
}
