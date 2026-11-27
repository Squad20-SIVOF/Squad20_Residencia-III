import { useState, type FormEvent } from 'react'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { CheckboxField } from '@/components/CheckboxField'
import { DataTable, TablePanel, type DataTableColumn } from '@/components/DataTable'
import { Pagination, TABLE_PAGE_SIZE } from '@/components/Pagination'
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
  const [page, setPage] = useState(1)
  const user = delegation.usuarios.find((item) => item.id === selected)
  const available = delegation.permissoesDisponiveis
  const modules = [
    ...new Set(available.map((permission) => permission.split(':')[0] ?? permission)),
  ].map((key) => ({ key, ...(MODULES[key] ?? { title: key, description: '' }) }))
  const totalPages = Math.max(1, Math.ceil(modules.length / TABLE_PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageModules = modules.slice(
    (currentPage - 1) * TABLE_PAGE_SIZE,
    currentPage * TABLE_PAGE_SIZE,
  )
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

  const columns: DataTableColumn<(typeof modules)[number]>[] = [
    {
      key: 'module',
      header: 'Módulo',
      isRowHeader: true,
      minWidth: 10,
      render: (module) => (
        <>
          <strong>{module.title}</strong>
          {module.description && <span>{module.description}</span>}
        </>
      ),
    },
    ...ACTIONS.map(({ key, label }) => ({
      key,
      header: label,
      render: (module: (typeof modules)[number]) => {
        const permission = `${module.key}:${key}`
        if (!available.includes(permission))
          return <span aria-label="Não disponível">—</span>

        const isInherited = inherited.includes(permission)
        return (
          <>
            <CheckboxField
              variant="plain"
              className={styles.matrixCheckbox}
              label={`${label} ${module.title.toLocaleLowerCase('pt-BR')}${isInherited ? ' (herdado do perfil)' : ''}`}
              checked={permissions.includes(permission) || isInherited}
              disabled={disabled || isInherited}
              onChange={(checked) => toggle(permission, checked)}
            />
            {isInherited && <span className={styles.muted}>Do perfil</span>}
          </>
        )
      },
    })),
  ]

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
                  setPage(1)
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
              <TablePanel
                title="Permissões por módulo"
                headingLevel={3}
                recordCount={modules.length}
                recordLabel={['módulo', 'módulos']}
                footer={
                  <Pagination
                    itemLabel="módulos"
                    shownCount={pageModules.length}
                    totalCount={modules.length}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    hasPrevious={currentPage > 1}
                    hasNext={currentPage < totalPages}
                    onPrevious={() => setPage(currentPage - 1)}
                    onNext={() => setPage(currentPage + 1)}
                  />
                }
              >
                <p className={styles.muted}>
                  Gerenciar permite criar, editar e excluir registros. Acessos herdados do
                  perfil não podem ser removidos aqui.
                </p>
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
                <DataTable
                  caption="Permissões operacionais por módulo"
                  className={styles.matrix}
                  rows={pageModules}
                  columns={columns}
                  getRowKey={(module) => module.key}
                />
              </TablePanel>
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
