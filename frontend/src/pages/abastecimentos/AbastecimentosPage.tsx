import { PageHeader } from '@/components/PageHeader'
import { LoadingState } from '@/components/LoadingState/LoadingState'
import { TextField } from '@/components/TextField'
import { SelectField } from '@/components/SelectField'
import { ButtonLink } from '@/components/ButtonLink'
import { StatGrid } from '@/components/StatCard'
import { Toolbar } from '@/components/Toolbar'
import { DataTable, TablePanel, type DataTableColumn } from '@/components/DataTable'
import { useCallback, useState } from 'react'
import { currentUser } from '@/service/authService'
import { useAsync } from '@/hooks/useAsync'
import { StateMessage } from '@/components/StateMessage'
import { Alert } from '@/components/Alert'
import { Button } from '@/components/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { FuelDetailsDialog } from './FuelDetailsDialog'
import { fuelService, monthRange, money, type FuelRecord } from './services/fuelService'
import styles from './AbastecimentosPage.module.scss'

export default function AbastecimentosPage() {
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [vehicle, setVehicle] = useState('')
  const [search, setSearch] = useState('')
  const [hoveredVehicleId, setHoveredVehicleId] = useState<string | null>(null)
  const [selected, setSelected] = useState<FuelRecord | null>(null)
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
  if (request.status === 'loading')
    return <LoadingState label="Carregando abastecimentos" />

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

  // Lógica do Hover para o Card de Teto
  const hoveredRecords = all.filter((r) => r.veiculo_id === hoveredVehicleId)
  const hoveredVehicleInfo = hoveredRecords[0]
  const hoveredTotal = hoveredRecords.reduce((sum, r) => sum + Number(r.valor_total), 0)
  const hoveredCap = Number(hoveredVehicleInfo?.teto_gasto_mensal || 0)
  const hoveredPercentage =
    hoveredCap > 0 ? Math.min((hoveredTotal / hoveredCap) * 100, 100) : 0

  async function remove() {
    if (!removing || saving) return
    setSaving(true)
    setError('')
    try {
      await fuelService.remove(removing.id)
      setSelected((current) => (current?.id === removing.id ? null : current))
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
      minWidth: 10,
      render: (row) => (
        <div
          onMouseEnter={() => setHoveredVehicleId(row.veiculo_id)}
          onMouseLeave={() => setHoveredVehicleId(null)}
          className={styles.hoverArea}
        >
          <strong>{row.identificacao || row.modelo || 'Veículo removido'}</strong>
          <span className={styles.secondary}>{row.placa ?? '—'}</span>
        </div>
      ),
    },
    {
      key: 'driver',
      header: 'Motorista',
      minWidth: 9,
      render: (row) => row.motorista_nome ?? 'Motorista removido',
    },
    {
      key: 'date',
      header: 'Data',
      keepTogether: true,
      render: (row) => new Date(row.data_abastecimento).toLocaleString('pt-BR'),
    },
    {
      key: 'fuel',
      header: 'Combustível / posto',
      minWidth: 10,
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
      keepTogether: true,
      render: (row) => `${Number(row.litros).toLocaleString('pt-BR')} L`,
    },
    {
      key: 'price',
      header: 'Preço / L',
      keepTogether: true,
      render: (row) => (row.preco_litro == null ? '—' : money(row.preco_litro)),
    },
    {
      key: 'total',
      header: 'Total',
      keepTogether: true,
      render: (row) => money(row.valor_total),
    },
    {
      key: 'mileage',
      header: 'Hodômetro',
      keepTogether: true,
      render: (row) => `${row.km_momento_abastecimento.toLocaleString('pt-BR')} km`,
    },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.headerContainer}>
        <PageHeader
          title="Abastecimentos"
          subtitle="Acompanhe os registros, os volumes e o teto de gastos de cada veículo."
        />
        {canManage && (
          <ButtonLink to="/abastecimentos/registrar" className={styles.btnPrimary}>
            + Registrar abastecimento
          </ButtonLink>
        )}
      </div>

      {error && !selected && <Alert variant="danger">{error}</Alert>}

      {request.status === 'error' ? (
        <StateMessage
          variant="error"
          title="Não foi possível carregar os abastecimentos"
          description={request.error instanceof Error ? request.error.message : undefined}
          action={<Button onClick={request.reload}>Tentar novamente</Button>}
        />
      ) : (
        <>
          <StatGrid
            label="Resumo dos abastecimentos"
            cards={[
              {
                label: 'Gasto no período',
                value: money(total),
                hint: `${rows.length} registros nos filtros selecionados`,
                variant: 'success',
              },
              {
                label: 'Volume abastecido',
                value: `${volume.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} L`,
                hint: `Média de ${(volume / (rows.length || 1)).toFixed(2)} L / reg`,
                variant: 'warning',
              },
              {
                label: 'Preço médio por litro',
                value: volume ? money(total / volume) : '—',
                hint: 'Média calculada',
                variant: 'danger',
              },
            ]}
          />

          {/* CARD DO TETO - SEMPRE VISÍVEL, COM TRANSIÇÃO SUAVE */}
          <div className={styles.tetoCard}>
            <div className={styles.tetoHeader}>
              <div>
                <h2 className={styles.tetoTitle}>
                  Teto de abastecimento{' '}
                  {hoveredVehicleInfo
                    ? `· ${hoveredVehicleInfo.identificacao || hoveredVehicleInfo.modelo}`
                    : ''}
                </h2>
                <p className={styles.tetoSubtitle}>
                  {hoveredVehicleInfo
                    ? `${hoveredVehicleInfo.placa} · ${new Date(month + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`
                    : 'Passe o mouse sobre um veículo na tabela para ver os detalhes.'}
                </p>
              </div>

              {hoveredVehicleInfo &&
                (hoveredCap > 0 ? (
                  <span
                    className={`${styles.tetoBadge} ${hoveredTotal > hoveredCap ? styles.tetoBadgeDanger : styles.tetoBadgeWarning}`}
                  >
                    {hoveredTotal > hoveredCap
                      ? 'Teto excedido'
                      : `Atenção · ${Math.round((hoveredTotal / hoveredCap) * 100)}% utilizado`}
                  </span>
                ) : (
                  <span className={`${styles.tetoBadge} ${styles.tetoBadgeMuted}`}>
                    Sem teto definido
                  </span>
                ))}
            </div>

            <div className={styles.tetoValues}>
              <h3>{money(hoveredVehicleInfo ? hoveredTotal : 0)}</h3>
              {hoveredVehicleInfo && hoveredCap > 0 && (
                <span>{Math.round((hoveredTotal / hoveredCap) * 100)}% do teto</span>
              )}
            </div>

            {hoveredVehicleInfo && hoveredCap > 0 ? (
              <>
                <div className={styles.progressBarBg}>
                  <div
                    className={
                      hoveredTotal > hoveredCap
                        ? styles.progressBarDanger
                        : styles.progressBarWarning
                    }
                    style={{ width: `${hoveredPercentage}%` }}
                  />
                </div>
                <div className={styles.tetoFooter}>
                  <span>
                    de {money(hoveredCap)} ·{' '}
                    {new Date(month + '-01').toLocaleDateString('pt-BR', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                  {hoveredTotal > hoveredCap ? (
                    <span className={styles.tetoWarningText}>
                      Teto excedido em {money(hoveredTotal - hoveredCap)}.
                    </span>
                  ) : (
                    <span className={styles.tetoWarningText}>
                      Restam {money(hoveredCap - hoveredTotal)} para abastecimento neste
                      mês.
                    </span>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className={styles.progressBarBg}>
                  <div className={styles.progressBarWarning} style={{ width: '0%' }} />
                </div>
                <div className={styles.tetoFooter}>
                  <span>
                    {hoveredVehicleInfo
                      ? 'Nenhum limite de gastos configurado para este veículo.'
                      : '\u00A0'}
                  </span>
                </div>
              </>
            )}
          </div>

          <Toolbar label="Filtrar abastecimentos">
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
            <Button variant="primary" onClick={() => {}}>
              Filtrar
            </Button>
          </Toolbar>

          <TablePanel title="Histórico de abastecimentos" recordCount={rows.length}>
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
                renderActions={(row) => (
                  <>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setError('')
                        setSelected(row)
                      }}
                    >
                      Detalhes
                    </Button>
                    {canManage && (
                      <>
                        <ButtonLink
                          variant="secondary"
                          to={`/abastecimentos/editar/${row.id}`}
                        >
                          Editar
                        </ButtonLink>
                        <Button
                          variant="secondary"
                          data-table-destructive
                          onClick={() => setRemoving(row)}
                        >
                          Excluir
                        </Button>
                      </>
                    )}
                  </>
                )}
              />
            )}
          </TablePanel>
        </>
      )}

      {selected && !removing && (
        <FuelDetailsDialog
          record={selected}
          canManage={canManage}
          error={error}
          onClose={() => {
            setSelected(null)
            setError('')
          }}
          onDelete={() => {
            setError('')
            setRemoving(selected)
          }}
        />
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
