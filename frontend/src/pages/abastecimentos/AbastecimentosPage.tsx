import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { currentUser } from '@/service/authService'
import { useAsync } from '@/hooks/useAsync'
import { StateMessage } from '@/components/StateMessage'
import { Alert } from '@/components/Alert'
import { Button } from '@/components/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { fuelService, monthRange, money, type FuelRecord } from './services/fuelService'
import styles from './AbastecimentosPage.module.scss'

export default function AbastecimentosPage() {
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [vehicle, setVehicle] = useState('')
  const [search, setSearch] = useState('')
  const [removing, setRemoving] = useState<FuelRecord | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const loader = useCallback(async () => {
    const [rows, user] = await Promise.all([
      fuelService.list(monthRange(month)),
      currentUser(),
    ])
    return { rows, canManage: user.permissoes.includes('abastecimentos:gerenciar') }
  }, [month])
  const request = useAsync(loader)
  const all = request.status === 'success' ? request.data.rows : []
  const canManage = request.status === 'success' && request.data.canManage
  const monthly = all.filter((row) => !vehicle || row.veiculo_id === vehicle)
  const rows = monthly.filter((row) =>
    `${row.motorista_nome ?? ''} ${row.posto ?? ''} ${row.placa ?? ''}`
      .toLocaleLowerCase('pt-BR')
      .includes(search.toLocaleLowerCase('pt-BR')),
  )
  const total = rows.reduce((sum, row) => sum + Number(row.valor_total), 0)
  const volume = rows.reduce((sum, row) => sum + Number(row.litros), 0)
  const options = [
    ...new Map(
      all
        .filter((row) => row.veiculo_id)
        .map((row) => [
          row.veiculo_id,
          {
            id: row.veiculo_id,
            label: `${row.modelo ?? 'Veículo'} · ${row.placa ?? 'Sem placa'}`,
          },
        ]),
    ).values(),
  ]
  const cap = vehicle ? monthly[0]?.teto_gasto_mensal : null
  const monthlyTotal = monthly.reduce((sum, row) => sum + Number(row.valor_total), 0)
  async function remove() {
    if (!removing || saving) return
    setSaving(true)
    setError('')
    try {
      await fuelService.remove(removing.id)
      setRemoving(null)
      request.reload()
    } catch (cause) {
      setError((cause as Error).message)
      setRemoving(null)
    } finally {
      setSaving(false)
    }
  }
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Abastecimentos</h1>
          <p>Acompanhe os registros, os volumes e o teto de gastos de cada veículo.</p>
        </div>
        {canManage && (
          <Link to="/abastecimentos/registrar" className={styles.btnPrimary}>
            Registrar abastecimento
          </Link>
        )}
      </header>
      {error && <Alert variant="danger">{error}</Alert>}
      <div className={styles.filterGrid}>
        <div className={styles.formGroup}>
          <label htmlFor="filtroVeiculo">Veículo</label>
          <select
            id="filtroVeiculo"
            value={vehicle}
            onChange={(e) => setVehicle(e.target.value)}
          >
            <option value="">Todos os veículos</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="filtroPeriodo">Período</label>
          <input
            id="filtroPeriodo"
            type="month"
            required
            value={month}
            onChange={(e) => {
              if (e.target.value) {
                setMonth(e.target.value)
                setVehicle('')
              }
            }}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="filtroBusca">Buscar motorista ou posto</label>
          <input
            id="filtroBusca"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar nos registros..."
          />
        </div>
      </div>
      {request.status === 'loading' ? (
        <StateMessage variant="loading" title="Carregando abastecimentos" />
      ) : request.status === 'error' ? (
        <StateMessage
          variant="error"
          title="Não foi possível carregar os abastecimentos"
          description={request.error instanceof Error ? request.error.message : undefined}
          action={<Button onClick={request.reload}>Tentar novamente</Button>}
        />
      ) : (
        <>
          <div className={styles.kpiGrid}>
            <div className={styles.card}>
              <p className={styles.kpiTitle}>Gasto no período</p>
              <h2>{money(total)}</h2>
              <p className={styles.kpiSub}>
                {rows.length} registros nos filtros selecionados
              </p>
            </div>
            <div className={styles.card}>
              <p className={styles.kpiTitle}>Volume abastecido</p>
              <h2>{volume.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} L</h2>
            </div>
            <div className={styles.card}>
              <p className={styles.kpiTitle}>Preço médio por litro</p>
              <h2>{volume ? money(total / volume) : '—'}</h2>
            </div>
          </div>
          {vehicle && cap != null && (
            <div className={styles.card}>
              <h3>Teto mensal do veículo</h3>
              <p>
                {money(monthlyTotal)} de {money(cap)} ·{' '}
                {Number(cap) > 0
                  ? `${Math.round((monthlyTotal / Number(cap)) * 100)}% utilizado`
                  : 'Teto zero'}
              </p>
              <p>
                {monthlyTotal > Number(cap)
                  ? `Teto excedido em ${money(monthlyTotal - Number(cap))}`
                  : `Restam ${money(Number(cap) - monthlyTotal)}`}
              </p>
            </div>
          )}
          {!rows.length ? (
            <StateMessage
              title="Nenhum abastecimento encontrado."
              description="Selecione outro período ou registre um abastecimento."
            />
          ) : (
            <div className={styles.card}>
              <h3>Histórico de abastecimentos</h3>
              <div className={styles.tableScroll}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Veículo / placa</th>
                      <th>Motorista</th>
                      <th>Data</th>
                      <th>Combustível / posto</th>
                      <th>Litros</th>
                      <th>Preço / L</th>
                      <th>Total</th>
                      <th>Hodômetro</th>
                      {canManage && <th>Ações</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id}>
                        <td>
                          {row.identificacao || row.modelo || 'Veículo removido'}
                          <br />
                          {row.placa ?? '—'}
                        </td>
                        <td>{row.motorista_nome ?? 'Motorista removido'}</td>
                        <td>
                          {new Date(row.data_abastecimento).toLocaleString('pt-BR')}
                        </td>
                        <td>
                          {row.combustivel ?? 'Não registrado'}
                          <br />
                          {row.posto ?? 'Não registrado'}
                        </td>
                        <td>{Number(row.litros).toLocaleString('pt-BR')} L</td>
                        <td>{row.preco_litro == null ? '—' : money(row.preco_litro)}</td>
                        <td>{money(row.valor_total)}</td>
                        <td>{row.km_momento_abastecimento.toLocaleString('pt-BR')} km</td>
                        {canManage && (
                          <td>
                            <Link to={`/abastecimentos/editar/${row.id}`}>Editar</Link>
                            <Button variant="danger" onClick={() => setRemoving(row)}>
                              Excluir
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
      <ConfirmDialog
        isOpen={!!removing}
        title="Excluir abastecimento?"
        description="O registro será removido do histórico e dos totais do período."
        confirmLabel={saving ? 'Excluindo…' : 'Excluir'}
        isDestructive
        onConfirm={remove}
        onCancel={() => {
          if (!saving) setRemoving(null)
        }}
      />
    </div>
  )
}
