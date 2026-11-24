import { useState } from 'react'
import { Search } from 'lucide-react'
import { Avatar } from '@/components/Avatar'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { DataTable, type DataTableColumn } from '@/components/DataTable'
import { Pagination, TABLE_PAGE_SIZE } from '@/components/Pagination'
import { TextField } from '@/components/TextField'
import { normalizeText } from '@/utils/format'
import type { User } from '../types'
import styles from '../UsersPage.module.scss'

const columns: DataTableColumn<User>[] = [
  {
    key: 'name',
    header: 'Nome',
    isRowHeader: true,
    render: (user) => (
      <span className={styles.directoryIdentity}>
        <Avatar name={user.nome} className={styles.directoryAvatar} />
        <strong>{user.nome}</strong>
      </span>
    ),
  },
  { key: 'email', header: 'E-mail', render: (user) => user.email },
  {
    key: 'profiles',
    header: 'Perfis',
    render: (user) => (
      <span className={styles.badges}>
        {user.perfis?.length ? (
          user.perfis.map((profile) => (
            <Badge key={profile.id} variant="info">
              {profile.nome}
            </Badge>
          ))
        ) : (
          <Badge>Sem perfil</Badge>
        )}
      </span>
    ),
  },
]

interface UsersDirectoryProps {
  users: User[]
  saving: boolean
  onManage: (user: User) => void
}

export function UsersDirectory({ users, saving, onManage }: UsersDirectoryProps) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const term = normalizeText(search)
  const filtered = users.filter((user) =>
    normalizeText(`${user.nome} ${user.email}`).includes(term),
  )
  const pageCount = Math.max(1, Math.ceil(filtered.length / TABLE_PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const rows = filtered.slice(
    (currentPage - 1) * TABLE_PAGE_SIZE,
    currentPage * TABLE_PAGE_SIZE,
  )

  return (
    <section className={styles.directory} aria-labelledby="users-directory-title">
      <header className={styles.directoryHeader}>
        <div>
          <div className={styles.titleRow}>
            <h2 id="users-directory-title">Usuários cadastrados</h2>
            <Badge variant="info">{users.length}</Badge>
          </div>
          <p className={styles.muted}>Consulte os perfis e os vínculos da equipe.</p>
        </div>
        <div className={styles.directorySearch}>
          <Search size={16} aria-hidden="true" />
          <TextField
            label="Pesquisar por nome ou e-mail"
            placeholder="Pesquisar por nome ou e-mail"
            type="search"
            isLabelHidden
            value={search}
            onChange={(value) => {
              setSearch(value)
              setPage(1)
            }}
          />
        </div>
      </header>
      {rows.length ? (
        <>
          <DataTable
            caption="Usuários cadastrados"
            className={styles.directoryTable}
            rows={rows}
            columns={columns}
            getRowKey={(user) => user.id}
            renderActions={(user) => (
              <Button
                variant="secondary"
                disabled={saving}
                onClick={() => onManage(user)}
                aria-label={`Gerenciar vínculos de ${user.nome}`}
              >
                Gerenciar vínculos
              </Button>
            )}
          />
          <Pagination
            itemLabel="usuários"
            shownCount={rows.length}
            totalCount={filtered.length}
            currentPage={currentPage}
            totalPages={pageCount}
            hasPrevious={currentPage > 1}
            hasNext={currentPage < pageCount}
            onPrevious={() => setPage(currentPage - 1)}
            onNext={() => setPage(currentPage + 1)}
          />
        </>
      ) : (
        <output className={styles.empty}>
          {term ? 'Nenhum usuário corresponde à busca.' : 'Nenhum usuário cadastrado.'}
        </output>
      )}
    </section>
  )
}
