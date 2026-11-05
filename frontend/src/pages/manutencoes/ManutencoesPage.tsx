import { LoadingState } from '@/components/LoadingState/LoadingState'
import 'bootstrap/dist/css/bootstrap.min.css'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Breadcrumb } from '@/components/Breadcrumb'
import type { Vehicle } from './types/vehicle'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
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

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Manutenções</h1>
          <p className="text-secondary mb-0">
            Monitore e gerencie as manutenções da frota em um só lugar.
          </p>
        </div>
        {canManage && (
          <Link className="btn btn-primary" to="/manutencoes/nova">
            + Registrar manutenção
          </Link>
        )}
      </header>
      {loadError && (
        <div className="alert alert-danger" role="alert">
          {loadError}{' '}
          <button type="button" onClick={refresh}>
            Tentar novamente
          </button>
        </div>
      )}
      {mutationError && !selected && (
        <div className="alert alert-danger" role="alert">
          {mutationError}
        </div>
      )}
      {notice && (
        <output className="alert alert-success d-flex justify-content-between">
          {notice}
          <button
            type="button"
            className="btn-close"
            aria-label="Fechar"
            onClick={() => setNotice('')}
          />
        </output>
      )}
      <div className="row g-3">
        {(
          [
            ['Total de manutenções', stats.total.toString()],
            ['Em andamento', stats.emAndamento.toString()],
            ['Agendadas', stats.agendadas.toString()],
            ['Custo total (exceto canceladas)', money(stats.custoTotal)],
          ] as const
        ).map(([label, value]) => (
          <div className="col-sm-6 col-xl-3" key={label}>
            <div className="card h-100">
              <div className="card-body">
                <div className="text-secondary small">{label}</div>
                <div className="fs-4 fw-semibold mt-2">{value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <form
        className="card"
        onSubmit={(e) => {
          e.preventDefault()
          setFilters(draft)
          setPage(1)
        }}
      >
        <div className="card-body">
          <h2 className="h5">Filtros</h2>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label" htmlFor="maintenance-search">
                Buscar
              </label>
              <input
                id="maintenance-search"
                className="form-control"
                placeholder="Placa, serviço, oficina..."
                value={draft.search}
                onChange={(e) => setDraft({ ...draft, search: e.target.value })}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label" htmlFor="maintenance-vehicle">
                Veículo
              </label>
              <select
                id="maintenance-vehicle"
                className="form-select"
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
            <div className="col-md-4">
              <label className="form-label" htmlFor="maintenance-status">
                Status
              </label>
              <select
                id="maintenance-status"
                className="form-select"
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
            <div className="col-md-3">
              <label className="form-label" htmlFor="maintenance-from">
                De
              </label>
              <input
                id="maintenance-from"
                type="date"
                className="form-control"
                value={draft.from ?? ''}
                onChange={(e) =>
                  setDraft({ ...draft, from: e.target.value || undefined })
                }
              />
            </div>
            <div className="col-md-3">
              <label className="form-label" htmlFor="maintenance-to">
                Até
              </label>
              <input
                id="maintenance-to"
                type="date"
                className="form-control"
                value={draft.to ?? ''}
                onChange={(e) => setDraft({ ...draft, to: e.target.value || undefined })}
              />
            </div>
            <div className="col-md-6 d-flex align-items-end gap-2">
              <button className="btn btn-primary" type="submit">
                Aplicar filtros
              </button>
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={() => {
                  setDraft(emptyFilters)
                  setFilters(emptyFilters)
                  setPage(1)
                }}
              >
                Limpar
              </button>
            </div>
          </div>
        </div>
      </form>
      <section className="card">
        <div className="card-body">
          <h2 className="h5 mb-3">
            Registros <span className="text-secondary small">({filtered.length})</span>
          </h2>
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Veículo</th>
                  <th>Serviço</th>
                  <th>Tipo</th>
                  <th>Status</th>
                  <th>Valor</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr key={m.id}>
                    <td>{date(m.dataServico)}</td>
                    <td>{vehicleLabel(vehicles.find((v) => v.id === m.vehicleId))}</td>
                    <td>{m.descricao}</td>
                    <td>{m.tipo}</td>
                    <td>
                      <span className="badge text-bg-secondary">{m.status}</span>
                    </td>
                    <td>{money(m.valorEstimado)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => setSelected(m)}
                      >
                        Detalhes
                      </button>
                    </td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-secondary">
                      {loading ? (
                        <LoadingState label="Carregando manutenções" />
                      ) : (
                        'Nenhuma manutenção encontrada.'
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <span className="text-secondary small">
              Página {currentPage} de {pageCount}
            </span>
            <div className="btn-group">
              <button
                className="btn btn-outline-secondary"
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </button>
              <button
                className="btn btn-outline-secondary"
                type="button"
                disabled={currentPage >= pageCount}
                onClick={() => setPage((p) => p + 1)}
              >
                Próxima
              </button>
            </div>
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
          {mutationError && (
            <div className="alert alert-danger" role="alert">
              {mutationError}
            </div>
          )}
          <dl className="row mt-3">
            <dt className="col-5">Veículo</dt>
            <dd className="col-7">
              {vehicleLabel(vehicles.find((v) => v.id === selected.vehicleId))}
            </dd>
            <dt className="col-5">Serviço</dt>
            <dd className="col-7">{selected.descricao}</dd>
            <dt className="col-5">Data</dt>
            <dd className="col-7">
              {date(selected.dataServico)} {selected.horaServico}
            </dd>
            <dt className="col-5">Oficina</dt>
            <dd className="col-7">{selected.oficina}</dd>
            <dt className="col-5">Quilometragem</dt>
            <dd className="col-7">{km(selected.quilometragem)}</dd>
            <dt className="col-5">Status</dt>
            <dd className="col-7">{selected.status}</dd>
            <dt className="col-5">Valor</dt>
            <dd className="col-7">{money(selected.valorEstimado)}</dd>
            <dt className="col-5">Próxima revisão</dt>
            <dd className="col-7">
              {selected.tipoProximaRevisao}
              {selected.proximaRevisaoKm ? ` · ${km(selected.proximaRevisaoKm)}` : ''}
              {selected.proximaRevisaoData
                ? ` · ${date(selected.proximaRevisaoData)}`
                : ''}
            </dd>
            <dt className="col-5">Comprovante</dt>
            <dd className="col-7">{selected.comprovanteNome ?? 'Não informado'}</dd>
          </dl>
          {canManage && (
            <div className="d-flex gap-2 justify-content-end">
              <button
                type="button"
                className="btn btn-outline-danger"
                disabled={deleting}
                onClick={removeSelected}
              >
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>
              <Link className="btn btn-primary" to={`/manutencoes/editar/${selected.id}`}>
                Editar
              </Link>
            </div>
          )}
        </ConfirmDialog>
      )}
    </main>
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
      <main className={styles.page}>
        <LoadingState label="Carregando manutenção" />
      </main>
    )
  if (error)
    return (
      <main className={styles.page}>
        <p role="alert">{error}</p>
        <button onClick={refresh}>Tentar novamente</button>
      </main>
    )
  if (!canManage)
    return (
      <main className={styles.page}>
        <p role="alert">Você não tem permissão para gerenciar manutenções.</p>
        <Link to="/manutencoes">Voltar à listagem</Link>
      </main>
    )
  const editing = id ? maintenances.find((item) => item.id === id) : undefined
  if (id && !editing)
    return (
      <main className={styles.page}>
        <h1>Manutenção não encontrada</h1>
        <Link to="/manutencoes">Voltar à listagem</Link>
      </main>
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
    <main className={styles.page}>
      <header>
        <Breadcrumb
          items={[
            { label: 'Manutenções', to: '/manutencoes' },
            { label: editing ? 'Editar cadastro' : 'Novo cadastro' },
          ]}
        />
        <h1>{editing ? 'Editar manutenção' : 'Registrar manutenção'}</h1>
        <p className="text-secondary">
          Registre um serviço ou agende uma manutenção da frota.
        </p>
      </header>
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      <form onSubmit={save} aria-busy={saving}>
        <fieldset disabled={saving}>
          <div className="row g-4">
            <div className="col-lg-8">
              <section className="card">
                <div className="card-body">
                  <h2 className="h5 mb-3">Dados da manutenção</h2>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label htmlFor="form-vehicle" className="form-label">
                        Veículo *
                      </label>
                      <select
                        required
                        id="form-vehicle"
                        className="form-select"
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
                    <div className="col-md-6">
                      <label htmlFor="form-type" className="form-label">
                        Tipo *
                      </label>
                      <select
                        id="form-type"
                        className="form-select"
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
                    <div className="col-12">
                      <label htmlFor="form-description" className="form-label">
                        Descrição do serviço *
                      </label>
                      <textarea
                        id="form-description"
                        className="form-control"
                        minLength={3}
                        maxLength={200}
                        required
                        rows={3}
                        value={form.descricao}
                        onChange={(e) => change('descricao', e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="form-date" className="form-label">
                        Data do serviço *
                      </label>
                      <input
                        id="form-date"
                        className="form-control"
                        type="date"
                        required
                        value={form.dataServico}
                        onChange={(e) => change('dataServico', e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="form-time" className="form-label">
                        Horário
                      </label>
                      <input
                        id="form-time"
                        className="form-control"
                        type="time"
                        value={form.horaServico ?? ''}
                        onChange={(e) => change('horaServico', e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="form-km" className="form-label">
                        Quilometragem *
                      </label>
                      <input
                        id="form-km"
                        className="form-control"
                        type="number"
                        min={1}
                        step={1}
                        required
                        value={form.quilometragem || ''}
                        onChange={(e) => change('quilometragem', Number(e.target.value))}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="form-workshop" className="form-label">
                        Oficina / fornecedor *
                      </label>
                      <input
                        id="form-workshop"
                        className="form-control"
                        minLength={2}
                        maxLength={120}
                        required
                        value={form.oficina}
                        onChange={(e) => change('oficina', e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="form-value" className="form-label">
                        Valor estimado (R$) *
                      </label>
                      <input
                        id="form-value"
                        className="form-control"
                        type="number"
                        min="0.01"
                        step="0.01"
                        required
                        value={form.valorEstimado || ''}
                        onChange={(e) => change('valorEstimado', Number(e.target.value))}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="form-status" className="form-label">
                        Status *
                      </label>
                      <select
                        id="form-status"
                        className="form-select"
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
              <section className="card mt-3">
                <div className="card-body">
                  <h2 className="h5">Próxima revisão</h2>
                  <div className="row g-3">
                    <div className="col-12">
                      <label htmlFor="form-revision-type" className="form-label">
                        Programar por
                      </label>
                      <select
                        id="form-revision-type"
                        className="form-select"
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
                      <div className="col-md-6">
                        <label htmlFor="form-next-km" className="form-label">
                          Próxima revisão (km) *
                        </label>
                        <input
                          id="form-next-km"
                          className="form-control"
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
                      <div className="col-md-6">
                        <label htmlFor="form-next-date" className="form-label">
                          Próxima revisão (data) *
                        </label>
                        <input
                          id="form-next-date"
                          className="form-control"
                          type="date"
                          min={form.dataServico || undefined}
                          required
                          value={form.proximaRevisaoData ?? ''}
                          onChange={(e) => change('proximaRevisaoData', e.target.value)}
                        />
                      </div>
                    )}
                    <div className="col-12">
                      <div className="form-check">
                        <input
                          id="form-notify"
                          className="form-check-input"
                          type="checkbox"
                          checked={form.notificarRevisao}
                          onChange={(e) => change('notificarRevisao', e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="form-notify">
                          Receber lembrete da próxima revisão por e-mail
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
              <section className="card mt-3">
                <div className="card-body">
                  <h2 className="h5">Comprovante</h2>
                  <label htmlFor="form-receipt" className="form-label">
                    Anexar arquivo (opcional)
                  </label>
                  <input
                    id="form-receipt"
                    type="file"
                    className="form-control"
                    accept=".pdf,image/*"
                    onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
                  />
                  <p className="text-secondary small mt-2 mb-0">
                    Nesta versão demonstrativa, somente o nome do arquivo é salvo; o
                    conteúdo não é enviado.
                  </p>
                  {form.comprovanteNome && !receipt && (
                    <p className="small mt-2">Atual: {form.comprovanteNome}</p>
                  )}
                </div>
              </section>
              <div className="d-flex gap-2 justify-content-end mt-3">
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => navigate('/manutencoes')}
                >
                  Cancelar
                </button>
                <button className="btn btn-primary" type="submit">
                  {saving
                    ? 'Salvando...'
                    : editing
                      ? 'Salvar alterações'
                      : 'Salvar manutenção'}
                </button>
              </div>
            </div>
            <aside className="col-lg-4">
              <div className="card">
                <div className="card-body">
                  <h2 className="h5">Resumo</h2>
                  <p className="mb-1">
                    <strong>Veículo:</strong> {vehicleLabel(vehicle)}
                  </p>
                  <p className="mb-1">
                    <strong>Serviço:</strong> {form.descricao || 'Não informado'}
                  </p>
                  <p className="mb-1">
                    <strong>Valor:</strong> {money(form.valorEstimado)}
                  </p>
                  <p className="mb-1">
                    <strong>Status:</strong> {form.status}
                  </p>
                  <p className="mb-0">
                    <strong>Data:</strong> {date(form.dataServico)}
                  </p>
                </div>
              </div>
              {vehicle && (
                <div className="card mt-3">
                  <div className="card-body">
                    <h2 className="h6">Veículo selecionado</h2>
                    <p className="mb-1">{vehicleLabel(vehicle)}</p>
                    <p className="mb-0">Última quilometragem conhecida: {km(lastKm)}</p>
                  </div>
                </div>
              )}
              {vehicle && form.quilometragem > 0 && form.quilometragem < lastKm && (
                <div className="alert alert-warning mt-3">
                  A quilometragem informada é inferior à última registrada ({km(lastKm)}).
                </div>
              )}
              {last && (
                <div className="card mt-3">
                  <div className="card-body">
                    <h2 className="h6">Última manutenção</h2>
                    <p className="mb-1">{last.descricao}</p>
                    <p className="mb-0 text-secondary">
                      {date(last.dataServico)} · {km(last.quilometragem)}
                    </p>
                  </div>
                </div>
              )}
            </aside>
          </div>
        </fieldset>
      </form>
    </main>
  )
}
