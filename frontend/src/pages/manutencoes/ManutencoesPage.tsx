import { CheckboxField } from '@/components/CheckboxField'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { Button } from '@/components/Button'
import { ButtonLink } from '@/components/ButtonLink'
import { Alert } from '@/components/Alert'
import { DataTable, type DataTableColumn } from '@/components/DataTable'
import { Badge } from '@/components/Badge'
import { LoadingState } from '@/components/LoadingState/LoadingState'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Breadcrumb } from '@/components/Breadcrumb'
import type { Vehicle } from './types/vehicle'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
const PAGE_SIZE = 6

export function ManutencoesPage() {
  const {
    maintenances,
    vehicles,
    loading,
    error: loadError,
    refresh,
    canManage,
  } = useMaintenances()
  const [draft, setDraft] = useState<MaintenanceFiltersValue>(emptyFilters)
  const [filters, setFilters] = useState<MaintenanceFiltersValue>(emptyFilters)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Maintenance | null>(null)
  const [notice, setNotice] = useState('')
  const [mutationError, setMutationError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const filtered = useMemo(
    () => sortByDateDesc(filterMaintenances(maintenances, vehicles, filters)),
    [maintenances, vehicles, filters],
  )
  const stats = computeStats(filtered)
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

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
      key: 'service',
      header: 'Serviço',
      isPrimary: true,
      render: (row) => row.descricao,
    },
    {
      key: 'vehicle',
      header: 'Veículo',
      render: (row) =>
        vehicleLabel(vehicles.find((vehicle) => vehicle.id === row.vehicleId)),
    },
    { key: 'date', header: 'Data', render: (row) => date(row.dataServico) },
    { key: 'type', header: 'Tipo', render: (row) => row.tipo },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge
          variant={
            row.status === 'Concluída'
              ? 'success'
              : row.status === 'Cancelada'
                ? 'danger'
                : row.status === 'Em andamento'
                  ? 'warning'
                  : 'info'
          }
        >
          {row.status}
        </Badge>
      ),
    },
    { key: 'value', header: 'Valor', render: (row) => money(row.valorEstimado) },
  ]
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <PageHeader
          title="Manutenções"
          subtitle="Monitore e gerencie as manutenções da frota em um só lugar."
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
      <section className={styles.statsGrid} aria-label="Resumo das manutenções">
        <StatCard label="Total de manutenções" value={stats.total} variant="info" />
        <StatCard label="Em andamento" value={stats.emAndamento} variant="warning" />
        <StatCard label="Agendadas" value={stats.agendadas} variant="info" />
        <StatCard
          label="Custo total (exceto canceladas)"
          value={money(stats.custoTotal)}
          variant="success"
        />
      </section>
      <form
        className={styles.card}
        onSubmit={(e) => {
          e.preventDefault()
          setFilters(draft)
          setPage(1)
        }}
      >
        <div className={styles.cardBody}>
          <h2 className={styles.sectionTitle}>Filtros</h2>
          <div className={styles.fieldsGrid}>
            <div className={styles.fieldThird}>
              <label className={styles.label} htmlFor="maintenance-search">
                Buscar
              </label>
              <input
                id="maintenance-search"
                className={styles.input}
                placeholder="Placa, serviço, oficina..."
                value={draft.search}
                onChange={(e) => setDraft({ ...draft, search: e.target.value })}
              />
            </div>
            <div className={styles.fieldThird}>
              <label className={styles.label} htmlFor="maintenance-vehicle">
                Veículo
              </label>
              <select
                id="maintenance-vehicle"
                className={styles.input}
                value={draft.vehicleId}
                onChange={(e) => setDraft({ ...draft, vehicleId: e.target.value })}
              >
                <option value="all">Todos</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {vehicleLabel(v)}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.fieldThird}>
              <label className={styles.label} htmlFor="maintenance-status">
                Status
              </label>
              <select
                id="maintenance-status"
                className={styles.input}
                value={draft.status}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    status: e.target.value as MaintenanceFiltersValue['status'],
                  })
                }
              >
                <option value="all">Todos</option>
                {MAINTENANCE_STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className={styles.fieldQuarter}>
              <label className={styles.label} htmlFor="maintenance-from">
                De
              </label>
              <input
                id="maintenance-from"
                type="date"
                className={styles.input}
                value={draft.from ?? ''}
                onChange={(e) =>
                  setDraft({ ...draft, from: e.target.value || undefined })
                }
              />
            </div>
            <div className={styles.fieldQuarter}>
              <label className={styles.label} htmlFor="maintenance-to">
                Até
              </label>
              <input
                id="maintenance-to"
                type="date"
                className={styles.input}
                value={draft.to ?? ''}
                onChange={(e) => setDraft({ ...draft, to: e.target.value || undefined })}
              />
            </div>
            <div className={styles.filterActions}>
              <Button variant="primary" type="submit">
                Aplicar filtros
              </Button>
              <Button
                variant="secondary"

                type="button"
                onClick={() => {
                  setDraft(emptyFilters)
                  setFilters(emptyFilters)
                  setPage(1)
                }}
              >
                Limpar
              </Button>
            </div>
          </div>
        </div>
      </form>
      <section className={styles.list} aria-label="Manutenções">
        <h2 className={styles.sectionTitle}>
          Registros <span className={styles.muted}>({filtered.length})</span>
        </h2>
        {loading ? (
          <LoadingState label="Carregando manutenções" />
        ) : !rows.length ? (
          <p className={styles.empty}>Nenhuma manutenção encontrada.</p>
        ) : (
          <DataTable
            caption="Registros de manutenções"
            rows={rows}
            columns={columns}
            getRowKey={(row) => row.id}
            renderActions={(row) => (
              <Button variant="secondary" onClick={() => setSelected(row)}>
                Detalhes
              </Button>
            )}
          />
        )}
        <div className={styles.pagination}>
          <span className={styles.muted}>
            Página {currentPage} de {pageCount}
          </span>
          <div className={styles.actions}>
            <Button
              variant="secondary"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="secondary"
              disabled={currentPage >= pageCount}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      </section>
      {selected && (
        <ConfirmDialog
          isOpen
          title="Detalhes da manutenção"
          description={vehicleLabel(vehicles.find((v) => v.id === selected.vehicleId))}
          confirmLabel="Fechar"
          cancelLabel={null}
          onConfirm={() => setSelected(null)}
          onCancel={() => setSelected(null)}
        >
          {mutationError && <Alert variant="danger">{mutationError}</Alert>}
          <dl className={styles.details}>
            <dt className={styles.detailLabel}>Veículo</dt>
            <dd className={styles.detailValue}>
              {vehicleLabel(vehicles.find((v) => v.id === selected.vehicleId))}
            </dd>
            <dt className={styles.detailLabel}>Serviço</dt>
            <dd className={styles.detailValue}>{selected.descricao}</dd>
            <dt className={styles.detailLabel}>Data</dt>
            <dd className={styles.detailValue}>
              {date(selected.dataServico)} {selected.horaServico}
            </dd>
            <dt className={styles.detailLabel}>Oficina</dt>
            <dd className={styles.detailValue}>{selected.oficina}</dd>
            <dt className={styles.detailLabel}>Quilometragem</dt>
            <dd className={styles.detailValue}>{km(selected.quilometragem)}</dd>
            <dt className={styles.detailLabel}>Status</dt>
            <dd className={styles.detailValue}>{selected.status}</dd>
            <dt className={styles.detailLabel}>Valor</dt>
            <dd className={styles.detailValue}>{money(selected.valorEstimado)}</dd>
            <dt className={styles.detailLabel}>Próxima revisão</dt>
            <dd className={styles.detailValue}>
              {selected.tipoProximaRevisao}
              {selected.proximaRevisaoKm ? ` · ${km(selected.proximaRevisaoKm)}` : ''}
              {selected.proximaRevisaoData
                ? ` · ${date(selected.proximaRevisaoData)}`
                : ''}
            </dd>
            <dt className={styles.detailLabel}>Comprovante</dt>
            <dd className={styles.detailValue}>
              {selected.comprovanteNome ?? 'Não informado'}
            </dd>
          </dl>
          {canManage && (
            <div className={styles.actions}>
              <Button
                variant="danger"
                type="button"

                disabled={deleting}
                onClick={removeSelected}
              >
                {deleting ? 'Excluindo...' : 'Excluir'}
              </Button>
              <ButtonLink to={`/manutencoes/editar/${selected.id}`}>Editar</ButtonLink>
            </div>
          )}
        </ConfirmDialog>
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
  if (loading)
    return (
      <div className={styles.page}>
        <LoadingState label="Carregando manutenção" />
      </div>
    )
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
        title={editing ? 'Editar manutenção' : 'Registrar manutenção'}
        subtitle="Registre um serviço ou agende uma manutenção da frota."
        breadcrumb={
          <Breadcrumb
            items={[
              { label: 'Manutenções', to: '/manutencoes' },
              { label: editing ? 'Editar cadastro' : 'Novo cadastro' },
            ]}
          />
        }
      />
      {error && <Alert variant="danger">{error}</Alert>}
      <form className={styles.form} onSubmit={save} aria-busy={saving}>
        <fieldset disabled={saving}>
          <div className={styles.formLayout}>
            <div className={styles.formColumn}>
              <section className={styles.card}>
                <div className={styles.cardBody}>
                  <h2 className={styles.sectionTitle}>Dados da manutenção</h2>
                  <div className={styles.fieldsGrid}>
                    <div className={styles.fieldHalf}>
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
                    <div className={styles.fieldHalf}>
                      <label htmlFor="form-type" className={styles.label}>
                        Tipo *
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
                        Descrição do serviço *
                      </label>
                      <textarea
                        id="form-description"
                        className={styles.input}
                        minLength={3}
                        maxLength={200}
                        required
                        rows={3}
                        value={form.descricao}
                        onChange={(e) => change('descricao', e.target.value)}
                      />
                    </div>
                    <div className={styles.fieldHalf}>
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
                    <div className={styles.fieldHalf}>
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
                    <div className={styles.fieldHalf}>
                      <label htmlFor="form-km" className={styles.label}>
                        Quilometragem *
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
                    <div className={styles.fieldHalf}>
                      <label htmlFor="form-workshop" className={styles.label}>
                        Oficina / fornecedor *
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
                    <div className={styles.fieldHalf}>
                      <label htmlFor="form-value" className={styles.label}>
                        Valor estimado (R$) *
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
                    <div className={styles.fieldHalf}>
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
                  </div>
                </div>
              </section>
              <section className={styles.cardSpaced}>
                <div className={styles.cardBody}>
                  <h2 className={styles.sectionTitle}>Próxima revisão</h2>
                  <div className={styles.fieldsGrid}>
                    <div className={styles.fieldFull}>
                      <label htmlFor="form-revision-type" className={styles.label}>
                        Programar por
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
                      <div className={styles.fieldHalf}>
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
                      <div className={styles.fieldHalf}>
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
                    <div className={styles.fieldFull}>
                      <CheckboxField
                        id="form-notify"
                        variant="plain"
                        label="Receber lembrete da próxima revisão por e-mail"
                        checked={form.notificarRevisao}
                        onChange={(checked) => change('notificarRevisao', checked)}
                      />
                    </div>
                  </div>
                </div>
              </section>
              <section className={styles.cardSpaced}>
                <div className={styles.cardBody}>
                  <h2 className={styles.sectionTitle}>Comprovante</h2>
                  <label htmlFor="form-receipt" className={styles.label}>
                    Anexar arquivo (opcional)
                  </label>
                  <input
                    id="form-receipt"
                    type="file"
                    className={styles.input}
                    accept=".pdf,image/*"
                    onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
                  />
                  <p className={styles.hint}>
                    Nesta versão demonstrativa, somente o nome do arquivo é salvo; o
                    conteúdo não é enviado.
                  </p>
                  {form.comprovanteNome && !receipt && (
                    <p className={styles.hint}>Atual: {form.comprovanteNome}</p>
                  )}
                </div>
              </section>
              <div className={styles.formActions}>
                <Button
                  variant="secondary"

                  type="button"
                  onClick={() => navigate('/manutencoes')}
                >
                  Cancelar
                </Button>
                <Button variant="primary" type="submit">
                  {saving
                    ? 'Salvando...'
                    : editing
                      ? 'Salvar alterações'
                      : 'Salvar manutenção'}
                </Button>
              </div>
            </div>
            <aside className={styles.summaryColumn}>
              <div className={styles.card}>
                <div className={styles.cardBody}>
                  <h2 className={styles.sectionTitle}>Resumo</h2>
                  <p className={styles.summaryLine}>
                    <strong>Veículo:</strong> {vehicleLabel(vehicle)}
                  </p>
                  <p className={styles.summaryLine}>
                    <strong>Serviço:</strong> {form.descricao || 'Não informado'}
                  </p>
                  <p className={styles.summaryLine}>
                    <strong>Valor:</strong> {money(form.valorEstimado)}
                  </p>
                  <p className={styles.summaryLine}>
                    <strong>Status:</strong> {form.status}
                  </p>
                  <p className={styles.summaryLine}>
                    <strong>Data:</strong> {date(form.dataServico)}
                  </p>
                </div>
              </div>
              {vehicle && (
                <div className={styles.cardSpaced}>
                  <div className={styles.cardBody}>
                    <h2 className={styles.sectionTitle}>Veículo selecionado</h2>
                    <p className={styles.summaryLine}>{vehicleLabel(vehicle)}</p>
                    <p className={styles.summaryLine}>
                      Última quilometragem conhecida: {km(lastKm)}
                    </p>
                  </div>
                </div>
              )}
              {vehicle && form.quilometragem > 0 && form.quilometragem < lastKm && (
                <Alert variant="warning">
                  A quilometragem informada é inferior à última registrada ({km(lastKm)}).
                </Alert>
              )}
              {last && (
                <div className={styles.cardSpaced}>
                  <div className={styles.cardBody}>
                    <h2 className={styles.sectionTitle}>Última manutenção</h2>
                    <p className={styles.summaryLine}>{last.descricao}</p>
                    <p className={styles.muted}>
                      {date(last.dataServico)} · {km(last.quilometragem)}
                    </p>
                  </div>
                </div>
              )}
            </aside>
          </div>
        </fieldset>
      </form>
    </div>
  )
}
