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
  const inherited = user?.permissoesHerdadas ?? []
  const editable = available.filter((permission) => !inherited.includes(permission))
  const saved = user?.permissoes ?? []
  const dirty = editable.some(
    (permission) => saved.includes(permission) !== permissions.includes(permission),
  )
  const disabled = !user || saving
  const active = available.filter(
    (permission) => permissions.includes(permission) || inherited.includes(permission),
  ).length

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
          <h2>Permissões do usuário</h2>
          <p className={styles.muted}>
            Selecione um usuário para visualizar seus acessos e conceder permissões
            adicionais.
          </p>
        </div>
        <Badge variant="info">Permissões operacionais</Badge>
      </div>
      {!delegation.usuarios.length ? (
        <p className={styles.empty}>
          Nenhum usuário ativo disponível para configurar os acessos.
        </p>
      ) : (
        <form onSubmit={submit} className={styles.permissionForm}>
          <div className={styles.selection}>
            <div className={styles.selectField}>
              <label htmlFor="assistant-user">Usuário</label>
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
                <option value="">Selecione um usuário</option>
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
                <Badge variant="neutral">
                  {user.perfis?.map((profile) => profile.nome).join(', ') || 'Sem perfil'}
                </Badge>
              </div>
            ) : (
              <p className={styles.muted}>
                Selecione uma pessoa para visualizar os acessos.
              </p>
            )}
          </div>
          {user && (
            <>
              <div className={styles.matrixHeader}>
                <div>
                  <h3>Permissões por módulo</h3>
                  <p className={styles.muted}>
                    Gerenciar permite criar, editar e excluir registros. Acessos herdados
                    do perfil não podem ser removidos aqui.
                  </p>
                </div>
                <div className={styles.bulkActions}>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={disabled || !editable.length}
                    onClick={() =>
                      setPermissions([...new Set([...permissions, ...editable])])
                    }
                  >
                    Selecionar todas
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={
                      disabled ||
                      !editable.some((permission) => permissions.includes(permission))
                    }
                    onClick={() =>
                      setPermissions(
                        permissions.filter(
                          (permission) => !editable.includes(permission),
                        ),
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
                                  <>
                                    <CheckboxField
                                      variant="plain"
                                      className={styles.matrixCheckbox}
                                      label={`${action.label} ${info.title.toLocaleLowerCase('pt-BR')}${inherited.includes(permission) ? ' (herdado do perfil)' : ''}`}
                                      checked={
                                        permissions.includes(permission) ||
                                        inherited.includes(permission)
                                      }
                                      disabled={
                                        disabled || inherited.includes(permission)
                                      }
                                      onChange={(checked) => toggle(permission, checked)}
                                    />
                                    {inherited.includes(permission) && (
                                      <span className={styles.muted}>Do perfil</span>
                                    )}
                                  </>
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
                      checked={
                        permissions.includes(permission) || inherited.includes(permission)
                      }
                      onChange={(checked) => toggle(permission, checked)}
                    />
                  ))}
                </fieldset>
              )}
              {!available.length && (
                <p className={styles.empty}>
                  Não há permissões disponíveis para delegação.
                </p>
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
                    'Os acessos serão aplicados ao usuário selecionado.'
                  )}
                </p>
                <Button type="submit" disabled={disabled || !dirty} isLoading={saving}>
                  Salvar permissões
                </Button>
              </footer>
            </>
          )}
        </form>
      )}
    </Card>
  )
}
