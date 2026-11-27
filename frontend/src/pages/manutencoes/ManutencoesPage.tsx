import { PageHeader } from '@/components/PageHeader'
import { StatGrid } from '@/components/StatCard'
import { Button } from '@/components/Button'
import { ButtonLink } from '@/components/ButtonLink'
import { Alert } from '@/components/Alert'
import { DataTable, TablePanel, type DataTableColumn } from '@/components/DataTable'
import { Pagination, TABLE_PAGE_SIZE } from '@/components/Pagination'
import { Badge, type BadgeVariant } from '@/components/Badge'
import { LoadingState } from '@/components/LoadingState/LoadingState'
import { SelectField } from '@/components/SelectField'
import { TextField } from '@/components/TextField'
import { Toolbar } from '@/components/Toolbar'
import { RecordDetailsDialog } from '@/components/RecordDetailsDialog/RecordDetailsDialog'
import detailStyles from '@/components/RecordDetailsDialog/RecordDetailsDialog.module.scss'
import { BackLink } from '@/components/BackLink/BackLink'
import { MercosulPlate } from '@/pages/vehicles/components/MercosulPlate'
import { CircleCheck, TriangleAlert, Upload } from 'lucide-react'
import type { Vehicle } from './types/vehicle'
import { useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useMaintenances } from './hooks/useMaintenances'
import { maintenanceService } from './services/maintenanceService'
import {
  computeStats,
  filterMaintenances,
  lastKnownKm,
  lastMaintenanceOf,
  sortByDateDesc,
} from './services/maintenanceRules'
import {
  MAINTENANCE_STATUSES,
  MAINTENANCE_TYPES,
  NEXT_REVISION_TYPES,
} from './types/maintenance'
import type {
  Maintenance,
  MaintenanceFiltersValue,
  MaintenanceInput,
} from './types/maintenance'
import styles from './ManutencoesPage.module.scss'

const money = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
const date = (s?: string) =>
  s ? new Date(`${s}T12:00:00`).toLocaleDateString('pt-BR') : '—'
const km = (n: number) => `${n.toLocaleString('pt-BR')} km`
const vehicleLabel = (v?: Vehicle) =>
  v ? `${v.placa} · ${v.marca} ${v.modelo}` : 'Veículo não encontrado'
const emptyFilters: MaintenanceFiltersValue = {
  search: '',
  vehicleId: 'all',
  status: 'all',
}
const maintenanceStatusVariant: Record<Maintenance['status'], BadgeVariant> = {
  Agendada: 'info',
  'Em andamento': 'warning',
  Concluída: 'success',
  Cancelada: 'danger',
}
const vehicleStatusVariant: Record<Vehicle['status'], BadgeVariant> = {
  Disponível: 'success',
  'Em uso': 'info',
  'Em manutenção': 'warning',
  Inativo: 'neutral',
}

export function ManutencoesPage() {
  const {
    maintenances,
    vehicles,
    loading,
    error: loadError,
    refresh,
    canManage,
  } = useMaintenances()
  const [params] = useSearchParams()
  const [filters, setFilters] = useState<MaintenanceFiltersValue>(() => ({
    ...emptyFilters,
    search: params.get('placa') ?? '',
  }))
  const [draft, setDraft] = useState<MaintenanceFiltersValue>(filters)
  const [page, setPage] = useState(1)
  const [period, setPeriod] = useState('all')
  const [selected, setSelected] = useState<Maintenance | null>(null)
  const [notice, setNotice] = useState('')
  const [mutationError, setMutationError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const filtered = useMemo(
    () => sortByDateDesc(filterMaintenances(maintenances, vehicles, filters)),
    [maintenances, vehicles, filters],
  )
  const stats = computeStats(filtered)
  const pageCount = Math.max(1, Math.ceil(filtered.length / TABLE_PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const rows = filtered.slice(
    (currentPage - 1) * TABLE_PAGE_SIZE,
    currentPage * TABLE_PAGE_SIZE,
  )
  const selectedVehicle =
    selected && vehicles.find((vehicle) => vehicle.id === selected.vehicleId)

  if (loading) return <LoadingState label="Carregando manutenções" />

  const closeDetails = () => setSelected(null)

  async function removeSelected() {
    if (
      !selected ||
      deleting ||
      !window.confirm(`Excluir a manutenção "${selected.descricao}"?`)
    )
      return
    setDeleting(true)
    setMutationError('')
    try {
      await maintenanceService.remove(selected.id)
      setSelected(null)
      setNotice('Manutenção excluída com sucesso.')
    } catch (cause) {
      setMutationError(
        cause instanceof Error ? cause.message : 'Não foi possível excluir a manutenção.',
      )
    } finally {
      setDeleting(false)
    }
  }

  const columns: DataTableColumn<Maintenance>[] = [
    {
      key: 'vehicle',
      header: 'Placa / veículo',
      isPrimary: true,
      minWidth: 10,
      render: (row) =>
        vehicleLabel(vehicles.find((vehicle) => vehicle.id === row.vehicleId)),
    },
    {
      key: 'type',
      header: 'Tipo',
      keepTogether: true,
      render: (row) => row.tipo,
    },
    {
      key: 'service',
      header: 'Serviço',
      minWidth: 11,
      render: (row) => row.descricao,
    },
    {
      key: 'date',
      header: 'Data',
      keepTogether: true,
      render: (row) => date(row.dataServico),
    },
    {
      key: 'km',
      header: 'Km',
      keepTogether: true,
      render: (row) => km(row.quilometragem),
    },
    {
      key: 'workshop',
      header: 'Oficina',
      minWidth: 7.5,
      render: (row) => row.oficina,
    },
    {
      key: 'value',
      header: 'Custo',
      keepTogether: true,
      render: (row) => money(row.valorEstimado),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={maintenanceStatusVariant[row.status]}>{row.status}</Badge>
      ),
    },
  ]
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <PageHeader
          title="Manutenções"
          subtitle="Planeje revisões e acompanhe os serviços da frota em um só lugar."
        />
        {canManage && (
          <ButtonLink to="/manutencoes/nova">+ Registrar manutenção</ButtonLink>
        )}
      </div>
      {loadError && (
        <Alert variant="danger">
          {loadError}{' '}
          <Button variant="primary" type="button" onClick={refresh}>
            Tentar novamente
          </Button>
        </Alert>
      )}
      {mutationError && !selected && <Alert variant="danger">{mutationError}</Alert>}
      {notice && (
        <Alert variant="success" onDismiss={() => setNotice('')}>
          {notice}
        </Alert>
      )}
      <StatGrid
        label="Resumo das manutenções"
        columns={4}
        cards={[
          {
            label: 'Serviços concluídos',
            value: filtered.filter((item) => item.status === 'Concluída').length,
            hint: 'No período selecionado',
            variant: 'success',
          },
          {
            label: 'Em andamento',
            value: stats.emAndamento,
            hint: 'Veículo em manutenção',
            variant: 'warning',
          },
          {
            label: 'Agendadas',
            value: stats.agendadas,
            hint: 'Próximas manutenções',
            variant: 'info',
          },
          {
            label: 'Custo realizado',
            value: money(
              filtered
                .filter((item) => item.status === 'Concluída')
                .reduce((total, item) => total + item.valorEstimado, 0),
            ),
            hint: 'Somente serviços concluídos',
            variant: 'danger',
          },
        ]}
      />
      <Toolbar
        label="Filtrar manutenções"
        onSubmit={(e) => {
          e.preventDefault()
          const days = period === 'all' ? 0 : Number(period)
          const from = new Date()
          from.setDate(from.getDate() - days)
          setFilters({
            ...draft,
            from: days ? from.toISOString().slice(0, 10) : undefined,
            to: days ? new Date().toISOString().slice(0, 10) : undefined,
          })
          setPage(1)
        }}
      >
        <TextField
          id="maintenance-search"
          type="search"
          label="Buscar serviço ou oficina"
          placeholder="Buscar no histórico..."
          value={draft.search}
          onChange={(search) => setDraft((current) => ({ ...current, search }))}
        />
        <SelectField
          id="maintenance-vehicle"
          label="Veículo"
          value={draft.vehicleId}
          options={[
            { value: 'all', label: 'Todos os veículos' },
            ...vehicles.map((vehicle) => ({
              value: vehicle.id,
              label: vehicleLabel(vehicle),
            })),
          ]}
          onChange={(vehicleId) => setDraft((current) => ({ ...current, vehicleId }))}
        />
        <SelectField<MaintenanceFiltersValue['status']>
          id="maintenance-status"
          label="Status"
          value={draft.status}
          options={[
            { value: 'all', label: 'Todos os status' },
            ...MAINTENANCE_STATUSES.map((status) => ({ value: status, label: status })),
          ]}
          onChange={(status) => setDraft((current) => ({ ...current, status }))}
        />
        <SelectField
          id="maintenance-period"
          label="Período"
          value={period}
          options={[
            { value: 'all', label: 'Todo o período' },
            { value: '30', label: 'Últimos 30 dias' },
            { value: '90', label: 'Últimos 90 dias' },
            { value: '365', label: 'Últimos 12 meses' },
          ]}
          onChange={setPeriod}
        />
        <Button type="submit">Filtrar</Button>
      </Toolbar>
      <TablePanel
        title="Histórico de manutenções"
        recordCount={filtered.length}
        footer={
          <Pagination
            itemLabel="manutenções"
            shownCount={rows.length}
            totalCount={filtered.length}
            currentPage={currentPage}
            totalPages={pageCount}
            hasPrevious={currentPage > 1}
            hasNext={currentPage < pageCount}
            onPrevious={() => setPage(currentPage - 1)}
            onNext={() => setPage(currentPage + 1)}
          />
        }
      >
        {!rows.length ? (
          <p className={styles.empty}>Nenhuma manutenção encontrada.</p>
        ) : (
          <DataTable
            caption="Histórico de manutenções"
            className={styles.historyTable}
            rows={rows}
            columns={columns}
            getRowKey={(row) => row.id}
            renderActions={(row) => (
              <Button
                variant="secondary"
                className={styles.detailsButton}
                onClick={() => setSelected(row)}
              >
                Detalhes
              </Button>
            )}
          />
        )}
      </TablePanel>
      <p className={styles.maintenanceFooterNotice}>
        ⓘ Agendadas não bloqueiam o veículo. Ao concluir um serviço, revise a
        disponibilidade antes de liberar novas viagens.
      </p>
      {selected && (
        <RecordDetailsDialog
          title="Detalhes da manutenção"
          description="Informações do serviço e da próxima revisão."
          titleAccessory={
            <Badge
              className={detailStyles.detailBadge}
              variant={maintenanceStatusVariant[selected.status]}
            >
              {selected.status === 'Concluída' && (
                <CircleCheck size={14} aria-hidden="true" />
              )}
              {selected.status}
            </Badge>
          }
          plate={selectedVehicle?.placa}
          vehicleName={
            selectedVehicle
              ? [selectedVehicle.marca, selectedVehicle.modelo]
                  .filter(Boolean)
                  .join(' ') || selectedVehicle.codigo
              : 'Veículo não encontrado'
          }
          notice={mutationError && <Alert variant="danger">{mutationError}</Alert>}
          editTo={canManage ? `/manutencoes/editar/${selected.id}` : undefined}
          onDelete={canManage ? removeSelected : undefined}
          deleting={deleting}
          onClose={closeDetails}
        >
          <section className={detailStyles.detailService}>
            <h3>Informações do serviço</h3>
            <dl className={detailStyles.details}>
              <div>
                <dt className={detailStyles.detailLabel}>Serviço</dt>
                <dd className={detailStyles.detailValue}>{selected.descricao || '—'}</dd>
              </div>
              <div>
                <dt className={detailStyles.detailLabel}>Oficina</dt>
                <dd className={detailStyles.detailValue}>{selected.oficina || '—'}</dd>
              </div>
              <div>
                <dt className={detailStyles.detailLabel}>Data e horário</dt>
                <dd className={detailStyles.detailValue}>
                  {date(selected.dataServico)}
                  {selected.horaServico && ` às ${selected.horaServico.slice(0, 5)}`}
                </dd>
              </div>
              <div>
                <dt className={detailStyles.detailLabel}>Quilometragem</dt>
                <dd className={detailStyles.detailValue}>{km(selected.quilometragem)}</dd>
              </div>
            </dl>
          </section>
          <dl className={`${detailStyles.details} ${detailStyles.detailHighlight}`}>
            <div>
              <dt>Valor da manutenção</dt>
              <dd className={detailStyles.detailPrice}>
                {money(selected.valorEstimado)}
              </dd>
            </div>
            <div>
              <dt>Próxima revisão</dt>
              <dd>
                <strong>
                  {[
                    selected.proximaRevisaoData && date(selected.proximaRevisaoData),
                    selected.proximaRevisaoKm != null && km(selected.proximaRevisaoKm),
                  ]
                    .filter(Boolean)
                    .join(' · ') || 'Não definida'}
                </strong>
                {selected.tipoProximaRevisao !== 'Não definida' && (
                  <span className={detailStyles.detailLabel}>
                    Programada por {selected.tipoProximaRevisao.toLowerCase()}
                  </span>
                )}
              </dd>
            </div>
          </dl>
          <dl className={detailStyles.detailReceipt}>
            <dt>Comprovante</dt>
            <dd>{selected.comprovanteNome || 'Não informado'}</dd>
          </dl>
        </RecordDetailsDialog>
      )}
    </div>
  )
}

const emptyForm: MaintenanceInput = {
  vehicleId: '',
  tipo: 'Preventiva',
  descricao: '',
  dataServico: '',
  horaServico: '',
  quilometragem: 0,
  oficina: '',
  valorEstimado: 0,
  status: 'Agendada',
  tipoProximaRevisao: 'Não definida',
  notificarRevisao: false,
}

export function RegistrarManutencaoPage() {
  const { id } = useParams<{ id: string }>()
  const { maintenances, vehicles, loading, error, refresh, canManage } = useMaintenances()
  if (loading) return <LoadingState label="Carregando manutenção" />
  if (error)
    return (
      <div className={styles.page}>
        <p role="alert">{error}</p>
        <Button variant="primary" onClick={refresh}>
          Tentar novamente
        </Button>
      </div>
    )
  if (!canManage)
    return (
      <div className={styles.page}>
        <p role="alert">Você não tem permissão para gerenciar manutenções.</p>
        <ButtonLink to="/manutencoes">Voltar à listagem</ButtonLink>
      </div>
    )
  const editing = id ? maintenances.find((item) => item.id === id) : undefined
  if (id && !editing)
    return (
      <div className={styles.page}>
        <h1>Manutenção não encontrada</h1>
        <ButtonLink to="/manutencoes">Voltar à listagem</ButtonLink>
      </div>
    )
  return (
    <MaintenanceForm
      key={id ?? 'nova'}
      editing={editing}
      maintenances={maintenances}
      vehicles={vehicles}
    />
  )
}
function MaintenanceForm({
  editing,
  maintenances,
  vehicles,
}: {
  editing: Maintenance | undefined
  maintenances: Maintenance[]
  vehicles: Vehicle[]
}) {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<MaintenanceInput>(() =>
    editing ? { ...editing } : { ...emptyForm },
  )
  const [receipt, setReceipt] = useState<File | null>(null)
  const receiptInput = useRef<HTMLInputElement>(null)
  const [indisponibilizar, setIndisponibilizar] = useState(false)
  const [dataLembrete, setDataLembrete] = useState('')
  const [error, setError] = useState('')
  const vehicle = vehicles.find((v) => v.id === form.vehicleId)
  const lastKm = lastKnownKm(maintenances, vehicle, editing?.id)
  const last = vehicle
    ? lastMaintenanceOf(maintenances, vehicle.id, editing?.id)
    : undefined
  const needsKm =
    form.tipoProximaRevisao === 'Quilometragem' ||
    form.tipoProximaRevisao === 'Data e quilometragem'
  const needsDate =
    form.tipoProximaRevisao === 'Data' ||
    form.tipoProximaRevisao === 'Data e quilometragem'
  const change = <K extends keyof MaintenanceInput>(key: K, value: MaintenanceInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (
      !form.vehicleId ||
      form.descricao.trim().length < 3 ||
      !form.dataServico ||
      form.quilometragem <= 0 ||
      form.oficina.trim().length < 2 ||
      form.valorEstimado <= 0
    ) {
      setError(
        'Preencha todos os campos obrigatórios. Descrição: mínimo de 3 caracteres; oficina: mínimo de 2; quilometragem e valor maiores que zero.',
      )
      return
    }
    if (
      needsKm &&
      (!form.proximaRevisaoKm || form.proximaRevisaoKm <= form.quilometragem)
    ) {
      setError('A quilometragem da próxima revisão deve ser maior que a atual.')
      return
    }
    if (
      needsDate &&
      (!form.proximaRevisaoData || form.proximaRevisaoData <= form.dataServico)
    ) {
      setError('A próxima revisão deve ter data posterior à do serviço.')
      return
    }
    if (form.notificarRevisao && !needsKm && !needsDate) {
      setError('Defina a próxima revisão para ativar o lembrete.')
      return
    }
    const input: MaintenanceInput = {
      ...form,
      descricao: form.descricao.trim(),
      oficina: form.oficina.trim(),
      comprovanteNome: receipt?.name ?? form.comprovanteNome,
      proximaRevisaoKm: needsKm ? form.proximaRevisaoKm : undefined,
      proximaRevisaoData: needsDate ? form.proximaRevisaoData : undefined,
    }
    if (saving) return
    setSaving(true)
    setError('')
    try {
      if (editing) await maintenanceService.update(editing.id, input)
      else await maintenanceService.create(input)
      navigate('/manutencoes')
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Não foi possível salvar a manutenção.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.page}>
      <PageHeader
        className={styles.formHeader}
        title={editing ? 'Editar manutenção' : 'Registrar manutenção'}
        subtitle="Planeje um serviço ou registre uma manutenção já realizada."
        breadcrumb={<BackLink to="/manutencoes">Voltar para Manutenções</BackLink>}
      />
      {error && <Alert variant="danger">{error}</Alert>}
      <form className={styles.form} onSubmit={save} aria-busy={saving}>
        <fieldset disabled={saving}>
          <div className={styles.formLayout}>
            <div className={styles.formColumn}>
              <section className={styles.card}>
                <div className={styles.cardBody}>
                  <div className={styles.sectionHeading}>
                    <h2 className={styles.sectionTitle}>Dados do serviço</h2>
                    <p className={styles.hint}>Campos com * são obrigatórios.</p>
                  </div>
                  <div className={styles.fieldsGrid}>
                    <div>
                      <label htmlFor="form-vehicle" className={styles.label}>
                        Veículo *
                      </label>
                      <select
                        required
                        id="form-vehicle"
                        className={styles.input}
                        value={form.vehicleId}
                        onChange={(e) => change('vehicleId', e.target.value)}
                      >
                        <option value="">Selecione</option>
                        {vehicles.map((v) => (
                          <option key={v.id} value={v.id}>
                            {vehicleLabel(v)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="form-type" className={styles.label}>
                        Tipo de manutenção *
                      </label>
                      <select
                        id="form-type"
                        className={styles.input}
                        value={form.tipo}
                        onChange={(e) =>
                          change('tipo', e.target.value as MaintenanceInput['tipo'])
                        }
                      >
                        {MAINTENANCE_TYPES.map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.fieldFull}>
                      <label htmlFor="form-description" className={styles.label}>
                        Serviço / descrição *
                      </label>
                      <input
                        id="form-description"
                        className={styles.input}
                        type="text"
                        minLength={3}
                        maxLength={200}
                        required
                        placeholder="Ex.: Revisão dos 45 mil km"
                        value={form.descricao}
                        onChange={(e) => change('descricao', e.target.value)}
                      />
                      <p className={styles.hint}>
                        Inspeção de freios, suspensão, correias e níveis dos fluidos.
                      </p>
                    </div>
                    <div className={styles.dateTimeFields}>
                      <div>
                        <label htmlFor="form-date" className={styles.label}>
                          Data do serviço *
                        </label>
                        <input
                          id="form-date"
                          className={styles.input}
                          type="date"
                          required
                          value={form.dataServico}
                          onChange={(e) => change('dataServico', e.target.value)}
                        />
                      </div>
                      <div>
                        <label htmlFor="form-time" className={styles.label}>
                          Horário
                        </label>
                        <input
                          id="form-time"
                          className={styles.input}
                          type="time"
                          value={form.horaServico ?? ''}
                          onChange={(e) => change('horaServico', e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="form-km" className={styles.label}>
                        Quilometragem de referência *
                      </label>
                      <input
                        id="form-km"
                        className={styles.input}
                        type="number"
                        min={1}
                        step={1}
                        required
                        value={form.quilometragem || ''}
                        onChange={(e) => change('quilometragem', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label htmlFor="form-workshop" className={styles.label}>
                        Fornecedor / oficina *
                      </label>
                      <input
                        id="form-workshop"
                        className={styles.input}
                        minLength={2}
                        maxLength={120}
                        required
                        value={form.oficina}
                        onChange={(e) => change('oficina', e.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor="form-value" className={styles.label}>
                        Valor estimado *
                      </label>
                      <input
                        id="form-value"
                        className={styles.input}
                        type="number"
                        min="0.01"
                        step="0.01"
                        required
                        value={form.valorEstimado || ''}
                        onChange={(e) => change('valorEstimado', Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              </section>
              <section className={styles.card}>
                <div className={styles.cardBody}>
                  <h2 className={styles.sectionTitle}>Status e próxima revisão</h2>
                  <div className={styles.fieldsGrid}>
                    <div>
                      <label htmlFor="form-status" className={styles.label}>
                        Status *
                      </label>
                      <select
                        id="form-status"
                        className={styles.input}
                        value={form.status}
                        onChange={(e) =>
                          change('status', e.target.value as MaintenanceInput['status'])
                        }
                      >
                        {MAINTENANCE_STATUSES.map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="form-revision-type" className={styles.label}>
                        Próxima revisão por
                      </label>
                      <select
                        id="form-revision-type"
                        className={styles.input}
                        value={form.tipoProximaRevisao}
                        onChange={(e) =>
                          change(
                            'tipoProximaRevisao',
                            e.target.value as MaintenanceInput['tipoProximaRevisao'],
                          )
                        }
                      >
                        {NEXT_REVISION_TYPES.map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    </div>
                    {needsKm && (
                      <div>
                        <label htmlFor="form-next-km" className={styles.label}>
                          Próxima revisão (km) *
                        </label>
                        <input
                          id="form-next-km"
                          className={styles.input}
                          type="number"
                          min={form.quilometragem + 1}
                          required
                          value={form.proximaRevisaoKm || ''}
                          onChange={(e) =>
                            change('proximaRevisaoKm', Number(e.target.value))
                          }
                        />
                      </div>
                    )}
                    {needsDate && (
                      <div>
                        <label htmlFor="form-next-date" className={styles.label}>
                          Próxima revisão (data) *
                        </label>
                        <input
                          id="form-next-date"
                          className={styles.input}
                          type="date"
                          min={form.dataServico || undefined}
                          required
                          value={form.proximaRevisaoData ?? ''}
                          onChange={(e) => change('proximaRevisaoData', e.target.value)}
                        />
                      </div>
                    )}
                    <div>
                      <label htmlFor="form-reminder-date" className={styles.label}>
                        Data de lembrete (opcional)
                      </label>
                      <input
                        id="form-reminder-date"
                        className={styles.input}
                        type="date"
                        value={dataLembrete}
                        onChange={(e) => setDataLembrete(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div className={styles.availabilityOption}>
                  <div>
                    <strong id="form-availability-label">
                      Indisponibilizar durante o serviço
                    </strong>
                    <p id="form-availability-hint" className={styles.hint}>
                      {indisponibilizar
                        ? 'Sim, ao iniciar a manutenção.'
                        : 'Opção desativada.'}
                    </p>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      role="switch"
                      aria-checked={indisponibilizar}
                      checked={indisponibilizar}
                      onChange={(e) => setIndisponibilizar(e.target.checked)}
                      aria-labelledby="form-availability-label"
                      aria-describedby="form-availability-hint"
                    />
                    <span className={styles.switchSlider} />
                  </label>
                </div>
              </section>
              <section className={styles.card}>
                <div className={styles.cardBody}>
                  <h2 className={styles.sectionTitle}>Comprovante (opcional)</h2>
                  <div className={styles.receiptRow}>
                    <Upload aria-hidden="true" size={18} className={styles.receiptIcon} />
                    <div className={styles.receiptDetails}>
                      <p aria-live="polite">
                        {receipt?.name || form.comprovanteNome || 'Selecionar arquivo'}
                      </p>
                      <p id="form-receipt-hint" className={styles.hint}>
                        PDF ou imagem. Apenas o nome do arquivo é salvo.
                      </p>
                    </div>
                    <input
                      ref={receiptInput}
                      id="form-receipt"
                      type="file"
                      hidden
                      accept=".pdf,image/*"
                      onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
                    />
                    <Button
                      variant="secondary"
                      aria-describedby="form-receipt-hint"
                      onClick={() => receiptInput.current?.click()}
                    >
                      Anexar
                    </Button>
                  </div>
                </div>
              </section>
            </div>
            <aside className={styles.summaryColumn}>
              {vehicle && (
                <section className={`${styles.card} ${styles.vehicleInfoCard}`}>
                  <h2 className={styles.vehicleInfoTitle}>
                    {[
                      vehicle.codigo !== '—' && vehicle.codigo,
                      [vehicle.marca, vehicle.modelo].filter(Boolean).join(' '),
                    ]
                      .filter(Boolean)
                      .join(' · ') || vehicle.placa}
                  </h2>

                  <div className={styles.vehicleInfoDetails}>
                    <MercosulPlate plate={vehicle.placa} size="sm" />
                    <Badge variant={vehicleStatusVariant[vehicle.status]}>
                      {vehicle.status}
                    </Badge>
                  </div>

                  <p className={styles.vehicleInfoFooter}>
                    {[
                      km(lastKm),
                      vehicle.frota !== 'Não informada' && vehicle.frota,
                      vehicle.combustivel,
                      vehicle.capacidadeLitros
                        ? `${vehicle.capacidadeLitros}\u00a0L`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </section>
              )}

              <section className={`${styles.card} ${styles.registrationSummaryCard}`}>
                <h2 className={styles.sidebarCardTitle}>Resumo do registro</h2>

                <div>
                  <Badge variant={maintenanceStatusVariant[form.status]}>
                    {form.status}
                  </Badge>
                </div>

                <p className={styles.summaryDescription}>
                  {form.descricao || 'Descreva o serviço para visualizar o resumo.'}
                </p>

                <p className={styles.summaryMeta}>
                  {form.dataServico ? date(form.dataServico) : 'Data não informada'}
                  {' · '}
                  {form.oficina || 'Oficina não informada'}
                </p>

                <div className={styles.summaryPriceArea}>
                  <span>Valor estimado</span>
                  <strong>{money(form.valorEstimado)}</strong>
                </div>
              </section>

              {form.status === 'Agendada' && (
                <section className={styles.sidebarNotice}>
                  <TriangleAlert size={18} aria-hidden="true" />
                  <div>
                    <strong>Sem bloqueio imediato</strong>
                    <p>
                      A manutenção agendada mantém a disponibilidade atual do veículo.
                    </p>
                  </div>
                </section>
              )}

              {vehicle && form.quilometragem > 0 && form.quilometragem < lastKm && (
                <Alert variant="warning">
                  A quilometragem informada é inferior à última registrada ({km(lastKm)}).
                </Alert>
              )}

              {last && (
                <section className={`${styles.card} ${styles.lastMaintenanceCard}`}>
                  <h2 className={styles.sidebarCardTitle}>Última manutenção</h2>

                  <div>
                    <Badge variant={maintenanceStatusVariant[last.status]}>
                      {last.status} · {last.tipo}
                    </Badge>
                  </div>

                  <p className={styles.summaryDescription}>{last.descricao}</p>

                  <p className={styles.summaryMeta}>
                    {date(last.dataServico)} · {km(last.quilometragem)}
                  </p>

                  <strong className={styles.lastMaintenancePrice}>
                    {money(last.valorEstimado)}
                  </strong>
                </section>
              )}
            </aside>
            <div className={styles.formActions}>
              <p className={styles.hint}>Revise os dados antes de salvar.</p>
              <div className={styles.formButtons}>
                <Button variant="secondary" onClick={() => navigate('/manutencoes')}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {saving
                    ? 'Salvando...'
                    : editing
                      ? 'Salvar alterações'
                      : 'Salvar manutenção'}
                </Button>
              </div>
            </div>
          </div>
        </fieldset>
      </form>
    </div>
  )
}
