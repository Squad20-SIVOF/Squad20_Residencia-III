import { useState, type FormEvent } from 'react'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { CheckboxField } from '@/components/CheckboxField'
import type { Delegation } from '../types'
import styles from '../UsersPage.module.scss'

const MODULES: Record<string, { title: string; description: string }> = {
  veiculos: { title: 'Veículos', description: 'Cadastro e disponibilidade da frota' },
  motoristas: { title: 'Motoristas', description: 'Dados e cadastros de motoristas' },
  abastecimentos: {
    title: 'Abastecimentos',
    description: 'Registros e despesas de combustível',
  },
  manutencoes: { title: 'Manutenções', description: 'Histórico e serviços dos veículos' },
}
const ACTIONS = [
  { key: 'ler', label: 'Consultar' },
  { key: 'gerenciar', label: 'Gerenciar' },
]

interface Props {
  delegation: Delegation
  saving: boolean
  onSave: (userId: string, permissions: string[]) => Promise<void>
}

export function PermissionsPanel({ delegation, saving, onSave }: Props) {
  const [selected, setSelected] = useState('')
  const [permissions, setPermissions] = useState<string[]>([])
  const user = delegation.usuarios.find((item) => item.id === selected)
  const available = delegation.permissoesDisponiveis
  const modules = [
    ...new Set(available.map((permission) => permission.split(':')[0] ?? permission)),
  ]
  const extra = available.filter(
    (permission) => !ACTIONS.some(({ key }) => permission.endsWith(`:${key}`)),
  )
  const saved = user?.permissoes ?? []
  const dirty = available.some(
    (permission) => saved.includes(permission) !== permissions.includes(permission),
  )
  const disabled = !user || saving
  const active = available.filter((permission) => permissions.includes(permission)).length

  function toggle(permission: string, checked: boolean) {
    setPermissions((current) =>
      checked
        ? [...new Set([...current, permission])]
        : current.filter((value) => value !== permission),
    )
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!user || saving || !dirty) return
    await onSave(user.id, permissions)
  }

  return (
    <Card className={styles.permissionCard}>
      <div className={styles.sectionHeader}>
        <div>
          <h2>Acessos dos auxiliares</h2>
          <p className={styles.muted}>
            Defina o que cada auxiliar pode consultar e gerenciar.
          </p>
        </div>
        <Badge variant="info">Permissões operacionais</Badge>
      </div>
      {!delegation.usuarios.length ? (
        <p className={styles.empty}>
          Nenhum auxiliar disponível. Cadastre um usuário com o perfil Auxiliar de Gestor
          para configurar os acessos.
        </p>
      ) : (
        <form onSubmit={submit} className={styles.permissionForm}>
          <div className={styles.selection}>
            <div className={styles.selectField}>
              <label htmlFor="assistant-user">Auxiliar</label>
              <select
                id="assistant-user"
                required
                value={selected}
                disabled={saving}
                onChange={(event) => {
                  const id = event.target.value
                  setSelected(id)
                  setPermissions(
                    delegation.usuarios.find((item) => item.id === id)?.permissoes ?? [],
                  )
                }}
              >
                <option value="">Selecione um auxiliar</option>
                {delegation.usuarios.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome} — {item.email}
                  </option>
                ))}
              </select>
            </div>
            {user ? (
              <div className={styles.userSummary}>
                <span className={styles.avatar} aria-hidden="true">
                  {user.nome
                    .trim()
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((word) => word[0])
                    .join('')}
                </span>
                <div>
                  <strong>{user.nome}</strong>
                  <span>{user.email}</span>
                </div>
                <Badge variant="neutral">Auxiliar de Gestor</Badge>
              </div>
            ) : (
              <p className={styles.muted}>
                Selecione uma pessoa para visualizar os acessos.
              </p>
            )}
          </div>
          <div className={styles.matrixHeader}>
            <div>
              <h3>Permissões por módulo</h3>
              <p className={styles.muted}>
                Gerenciar permite criar, editar e excluir registros.
              </p>
            </div>
            <div className={styles.bulkActions}>
              <Button
                type="button"
                variant="secondary"
                disabled={disabled || !available.length}
                onClick={() =>
                  setPermissions([...new Set([...permissions, ...available])])
                }
              >
                Selecionar todas
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={disabled || active === 0}
                onClick={() =>
                  setPermissions(
                    permissions.filter((permission) => !available.includes(permission)),
                  )
                }
              >
                Limpar seleção
              </Button>
            </div>
          </div>
          <div className={styles.matrixWrapper}>
            <table className={styles.matrix}>
              <caption className={styles.srOnly}>
                Permissões operacionais por módulo
              </caption>
              <thead>
                <tr>
                  <th scope="col">Módulo</th>
                  {ACTIONS.map((action) => (
                    <th key={action.key} scope="col">
                      {action.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {modules.map((module) => {
                  const info = MODULES[module] ?? { title: module, description: '' }
                  return (
                    <tr key={module}>
                      <th scope="row">
                        <strong>{info.title}</strong>
                        <span>{info.description}</span>
                      </th>
                      {ACTIONS.map((action) => {
                        const permission = `${module}:${action.key}`
                        return (
                          <td key={action.key}>
                            {available.includes(permission) ? (
                              <CheckboxField
                                variant="plain"
                                className={styles.matrixCheckbox}
                                label={`${action.label} ${info.title.toLocaleLowerCase('pt-BR')}`}
                                checked={permissions.includes(permission)}
                                disabled={disabled}
                                onChange={(checked) => toggle(permission, checked)}
                              />
                            ) : (
                              <span aria-label="Não disponível">—</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {extra.length > 0 && (
            <fieldset disabled={disabled} className={styles.extraPermissions}>
              <legend>Outros acessos</legend>
              {extra.map((permission) => (
                <CheckboxField
                  key={permission}
                  variant="plain"
                  label={permission}
                  checked={permissions.includes(permission)}
                  onChange={(checked) => toggle(permission, checked)}
                />
              ))}
            </fieldset>
          )}
          {!available.length && (
            <p className={styles.empty}>Não há permissões disponíveis para delegação.</p>
          )}
          <footer className={styles.permissionFooter}>
            <p className={styles.muted}>
              {user ? (
                <>
                  <strong>
                    {active} de {available.length}
                  </strong>{' '}
                  acessos selecionados{dirty ? ' · Alterações não salvas' : ''}
                </>
              ) : (
                'Os acessos serão aplicados ao auxiliar selecionado.'
              )}
            </p>
            <Button type="submit" disabled={disabled || !dirty} isLoading={saving}>
              Salvar permissões
            </Button>
          </footer>
        </form>
      )}
    </Card>
  )
}
