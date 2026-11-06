import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { Card } from '@/components/Card'
import { TextField } from '@/components/TextField'
import { SelectField } from '@/components/SelectField'
import { ButtonLink } from '@/components/ButtonLink'
import { DataTable, type DataTableColumn } from '@/components/DataTable'
import { useCallback, useState } from 'react'
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
  const columns: DataTableColumn<FuelRecord>[] = [
    {
      key: 'vehicle',
      header: 'Veículo / placa',
      isPrimary: true,
      render: (row) => (
        <>
          <strong>{row.identificacao || row.modelo || 'Veículo removido'}</strong>
          <span className={styles.secondary}>{row.placa ?? '—'}</span>
        </>
      ),
    },
    {
      key: 'driver',
      header: 'Motorista',
      render: (row) => row.motorista_nome ?? 'Motorista removido',
    },
    {
      key: 'date',
      header: 'Data',
      render: (row) => new Date(row.data_abastecimento).toLocaleString('pt-BR'),
    },
    {
      key: 'fuel',
      header: 'Combustível / posto',
      render: (row) => (
        <span>
          {row.combustivel ?? 'Não registrado'}
          <span className={styles.secondary}>{row.posto ?? 'Não registrado'}</span>
        </span>
      ),
    },
    {
      key: 'liters',
      header: 'Litros',
      render: (row) => `${Number(row.litros).toLocaleString('pt-BR')} L`,
    },
    {
      key: 'price',
      header: 'Preço / L',
      render: (row) => (row.preco_litro == null ? '—' : money(row.preco_litro)),
    },
    { key: 'total', header: 'Total', render: (row) => money(row.valor_total) },
    {
      key: 'mileage',
      header: 'Hodômetro',
      render: (row) => `${row.km_momento_abastecimento.toLocaleString('pt-BR')} km`,
    },
  ]
  return (
    <div className={styles.page}>
      <PageHeader
        title="Abastecimentos"
        subtitle="Acompanhe os registros, os volumes e o teto de gastos de cada veículo."
      />
      {error && <Alert variant="danger">{error}</Alert>}
      <div className={styles.filterGrid}>
        <TextField
          id="filtroBusca"
          label="Buscar motorista ou posto"
          type="search"
          value={search}
          onChange={setSearch}
          placeholder="Buscar nos registros..."
        />
        <SelectField
          id="filtroVeiculo"
          label="Veículo"
          value={vehicle}
          onChange={setVehicle}
          options={[
            { value: '', label: 'Todos os veículos' },
            ...options.map((option) => ({ value: option.id, label: option.label })),
          ]}
        />
        <TextField
          id="filtroPeriodo"
          label="Período"
          type="month"
          required
          value={month}
          onChange={(value) => {
            if (value) {
              setMonth(value)
              setVehicle('')
            }
          }}
        />
        {canManage && (
          <ButtonLink to="/abastecimentos/registrar">Registrar abastecimento</ButtonLink>
        )}
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
          <section className={styles.statsGrid} aria-label="Resumo dos abastecimentos">
            <StatCard
              label="Gasto no período"
              value={money(total)}
              hint={`${rows.length} registros nos filtros selecionados`}
              variant="info"
            />
            <StatCard
              label="Volume abastecido"
              value={`${volume.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} L`}
              variant="success"
            />
            <StatCard
              label="Preço médio por litro"
              value={volume ? money(total / volume) : '—'}
              variant="warning"
            />
          </section>
          {vehicle && cap != null && (
            <Card title="Teto mensal do veículo">
              <p>
                {money(monthlyTotal)} de {money(cap)} ·{' '}
                {Number(cap) > 0
                  ? `${Math.round((monthlyTotal / Number(cap)) * 100)}% utilizado`
                  : 'Teto zero'}
              </p>
              <p className={styles.muted}>
                {monthlyTotal > Number(cap)
                  ? `Teto excedido em ${money(monthlyTotal - Number(cap))}`
                  : `Restam ${money(Number(cap) - monthlyTotal)}`}
              </p>
            </Card>
          )}
          <section className={styles.list} aria-label="Abastecimentos">
            <h2 className={styles.sectionTitle}>Histórico de abastecimentos</h2>
            {!rows.length ? (
              <StateMessage
                title="Nenhum abastecimento encontrado."
                description="Selecione outro período ou registre um abastecimento."
              />
            ) : (
              <DataTable
                caption="Histórico de abastecimentos"
                rows={rows}
                columns={columns}
                getRowKey={(row) => row.id}
                renderActions={
                  canManage
                    ? (row) => (
                        <>
                          <ButtonLink
                            variant="secondary"
                            to={`/abastecimentos/editar/${row.id}`}
                          >
                            Editar
                          </ButtonLink>
                          <Button variant="danger" onClick={() => setRemoving(row)}>
                            Excluir
                          </Button>
                        </>
                      )
                    : undefined
                }
              />
            )}
          </section>
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
