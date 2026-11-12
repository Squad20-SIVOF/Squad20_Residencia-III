import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api } from '@/service/api'
import { currentUser, type SessionUser } from '@/service/authService'
import { Button } from '@/components/Button'
import { LoadingState } from '@/components/LoadingState/LoadingState'
import { TextField } from '@/components/TextField'
import { PageHeader } from '@/components/PageHeader'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'
import { PermissionsPanel } from './components/PermissionsPanel'
import type { User, Delegation } from './types'
import styles from './UsersPage.module.scss'

interface Profile {
  id: string
  nome: string
  codigo: string | null
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
  const [activeTab, setActiveTab] = useState('permissions')
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
        api<{ message: Profile[] }>('/perfis'),
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

  return (
    <section className={styles.page}>
      <PageHeader
        title="Usuários e permissões"
        subtitle="Organize os usuários, seus perfis e os acessos da equipe."
      />
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      {message && <output className={styles.success}>{message}</output>}
      {(canDelegate || canCreate) && (
        <div className={styles.tabs} role="tablist" aria-label="Gestão de acessos">
          {canDelegate && (
            <button
              type="button"
              role="tab"
              id="permissions-tab"
              aria-controls="permissions-panel"
              aria-selected={activeTab === 'permissions'}
              onClick={() => setActiveTab('permissions')}
            >
              Permissões dos usuários
            </button>
          )}
          {canCreate && (
            <button
              type="button"
              role="tab"
              id="users-tab"
              aria-controls="users-panel"
              aria-selected={!canDelegate || activeTab === 'users'}
              onClick={() => setActiveTab('users')}
            >
              Usuários e vínculos
            </button>
          )}
        </div>
      )}
      {canDelegate && activeTab === 'permissions' && (
        <div role="tabpanel" id="permissions-panel" aria-labelledby="permissions-tab">
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
      {canCreate && (!canDelegate || activeTab === 'users') && (
        <div
          role="tabpanel"
          id="users-panel"
          aria-labelledby="users-tab"
          className={styles.adminForms}
        >
          <Card title="Criar usuário">
            <form onSubmit={create}>
              <TextField
                id="user-name"
                label="Nome"
                value={form.nome}
                onChange={(nome) => setForm({ ...form, nome })}
                disabled={saving}
              />
              <TextField
                id="user-email"
                label="E-mail"
                type="email"
                value={form.email}
                onChange={(email) => setForm({ ...form, email })}
                disabled={saving}
              />
              <TextField
                id="user-password"
                label="Senha inicial (mínimo de 12 caracteres)"
                type="password"
                value={form.password}
                onChange={(password) => setForm({ ...form, password })}
                disabled={saving}
              />
              <label htmlFor="user-profile">Perfil</label>
              <select
                id="user-profile"
                required
                value={form.perfil_id}
                disabled={saving}
                onChange={(e) => setForm({ ...form, perfil_id: e.target.value })}
              >
                <option value="">Selecione</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
              <label htmlFor="new-user-driver">Motorista vinculado (opcional)</label>
              <select
                id="new-user-driver"
                value={form.motorista_id}
                disabled={saving}
                onChange={(event) =>
                  setForm({ ...form, motorista_id: event.target.value })
                }
              >
                <option value="">Sem vínculo</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.nome}
                  </option>
                ))}
              </select>
              <p>
                Para abastecer pelo app mobile, atribua o perfil Motorista e vincule o
                cadastro correspondente.
              </p>
              <Button type="submit" isLoading={saving}>
                Criar usuário
              </Button>
            </form>
          </Card>
          <Card title="Vincular conta a motorista">
            <form onSubmit={saveDriverLink}>
              <label htmlFor="driver-link-user">Conta de usuário</label>
              <select
                id="driver-link-user"
                required
                disabled={saving}
                value={driverLink.usuario_id}
                onChange={(event) =>
                  setDriverLink({
                    usuario_id: event.target.value,
                    motorista_id:
                      users.find((user) => user.id === event.target.value)
                        ?.motorista_id ?? '',
                  })
                }
              >
                <option value="">Selecione</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.nome} — {user.email}
                  </option>
                ))}
              </select>
              <label htmlFor="driver-link-driver">Cadastro de motorista</label>
              <select
                id="driver-link-driver"
                disabled={saving}
                value={driverLink.motorista_id}
                onChange={(event) =>
                  setDriverLink({ ...driverLink, motorista_id: event.target.value })
                }
              >
                <option value="">Sem vínculo</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.nome}
                  </option>
                ))}
              </select>
              <Button type="submit" isLoading={saving} disabled={!driverLink.usuario_id}>
                Salvar vínculo
              </Button>
            </form>
          </Card>
          <Card title="Alterar perfis de um usuário">
            <label htmlFor="membership-user">Usuário</label>
            <select
              id="membership-user"
              value={membership.usuario_id}
              disabled={saving}
              onChange={(e) =>
                setMembership({ ...membership, usuario_id: e.target.value })
              }
            >
              <option value="">Selecione</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome} — {u.email}
                </option>
              ))}
            </select>
            <label htmlFor="membership-profile">Perfil a atribuir ou remover</label>
            <select
              id="membership-profile"
              value={membership.perfil_id}
              disabled={saving}
              onChange={(e) =>
                setMembership({ ...membership, perfil_id: e.target.value })
              }
            >
              <option value="">Selecione</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
            <Button
              disabled={saving || !membership.usuario_id || !membership.perfil_id}
              onClick={() => changeProfile(false)}
            >
              Atribuir perfil
            </Button>
            <Button
              variant="secondary"
              disabled={saving || !membership.usuario_id || !membership.perfil_id}
              onClick={() => changeProfile(true)}
            >
              Remover perfil
            </Button>
          </Card>
          <Card title="Usuários cadastrados">
            {users.length ? (
              <ul className={styles.userList}>
                {users.map((u) => (
                  <li key={u.id}>
                    <div>
                      <strong>{u.nome}</strong>
                      <span>{u.email}</span>
                    </div>
                    <div className={styles.badges}>
                      {u.perfis?.map((profile) => (
                        <Badge key={profile.id} variant="info">
                          {profile.nome}
                        </Badge>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Nenhum usuário cadastrado.</p>
            )}
          </Card>
        </div>
      )}
    </section>
  )
}
