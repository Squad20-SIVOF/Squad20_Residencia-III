import { PageHeader } from '@/components/PageHeader'
import { ButtonLink } from '@/components/ButtonLink'
import { useCallback, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { currentUser } from '@/service/authService'
import { useAsync } from '@/hooks/useAsync'
import { StateMessage } from '@/components/StateMessage'
import { Alert } from '@/components/Alert'
import { Button } from '@/components/Button'
import {
  fuelService,
  monthRange,
  money,
  calculateFuelTotal,
  type FuelRecord,
} from '../services/fuelService'
import styles from './RegistrarAbastecimento.module.scss'

function localDate(value: string) {
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

interface FormValues {
  veiculo_id: string
  motorista_id: string
  data_abastecimento: string
  combustivel: string
  posto: string
  litros: string
  preco_litro: string
  km_momento_abastecimento: string
}

export default function RegistrarAbastecimento({
  mode = 'manager',
}: {
  mode?: 'manager' | 'driver'
}) {
  const { id } = useParams()
  const loader = useCallback(async () => {
    const [options, record, user] = await Promise.all([
      mode === 'driver' ? fuelService.ownOptions() : fuelService.options(),
      id ? fuelService.get(id) : Promise.resolve(null),
      currentUser(),
    ])
    return {
      options,
      record,
      canManage: user.permissoes.includes(
        mode === 'driver' ? 'abastecimentos:criar-proprio' : 'abastecimentos:gerenciar',
      ),
    }
  }, [id, mode])

  const request = useAsync(loader)

  if (request.status === 'loading')
    return <StateMessage variant="loading" title="Carregando abastecimento" />
  if (request.status === 'error')
    return (
      <StateMessage
        variant="error"
        title="Não foi possível abrir o cadastro"
        description={request.error instanceof Error ? request.error.message : undefined}
        action={<Button onClick={request.reload}>Tentar novamente</Button>}
      />
    )
  if (!request.data.canManage)
    return (
      <StateMessage title="Seu usuário não possui acesso ao cadastro de abastecimentos." />
    )

  return <FuelForm key={id ?? 'new'} id={id} mode={mode} {...request.data} />
}

function FuelForm({
  id,
  options,
  record,
  mode,
}: {
  id: string | undefined
  mode: 'manager' | 'driver'
  options: Awaited<ReturnType<typeof fuelService.options>>
  record: FuelRecord | null
}) {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormValues>(() => ({
    veiculo_id: record?.veiculo_id ?? '',
    motorista_id:
      record?.motorista_id ??
      (mode === 'driver' ? (options.motoristas[0]?.id ?? '') : ''),
    data_abastecimento: record
      ? localDate(record.data_abastecimento)
      : localDate(new Date().toISOString()),
    combustivel: record?.combustivel ?? '',
    posto: record?.posto ?? '',
    litros: record ? String(record.litros) : '',
    preco_litro: record?.preco_litro != null ? String(record.preco_litro) : '',
    km_momento_abastecimento: record ? String(record.km_momento_abastecimento) : '',
  }))

  const [receipt, setReceipt] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const selected = options.veiculos.find((v) => v.id === form.veiculo_id)
  const total = calculateFuelTotal(Number(form.litros), Number(form.preco_litro))
  const month = form.data_abastecimento.slice(0, 7)

  const loadHistory = useCallback(async () => {
    if (!form.veiculo_id || !month) return { spent: 0, last: null }
    const rows = await fuelService.list({
      ...monthRange(month),
      veiculo_id: form.veiculo_id,
    })

    const validRows = rows.filter((row) => row.id !== id)
    const spent = validRows.reduce((sum, row) => sum + Number(row.valor_total), 0)

    const sorted = [...validRows].sort(
      (a, b) =>
        new Date(b.data_abastecimento).getTime() -
        new Date(a.data_abastecimento).getTime(),
    )
    const last = sorted.length > 0 ? sorted[0] : null

    return { spent, last }
  }, [form.veiculo_id, month, id])

  const history = useAsync(loadHistory)
  const spent = history.status === 'success' ? history.data.spent : 0
  const lastFuel = history.status === 'success' ? history.data.last : null
  const cap = selected?.teto_gasto_mensal ? Number(selected.teto_gasto_mensal) : null

  function setField(key: keyof FormValues, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
    setError('')
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      const input = {
        ...form,
        data_abastecimento: new Date(form.data_abastecimento).toISOString(),
        litros: Number(form.litros),
        preco_litro: Number(form.preco_litro),
        km_momento_abastecimento: Number(form.km_momento_abastecimento),
      }
      if (mode === 'driver') {
        await fuelService.saveOwn(input)
        setSuccess(true)
        setForm((current) => ({
          ...current,
          litros: '',
          preco_litro: '',
          posto: '',
          data_abastecimento: localDate(new Date().toISOString()),
        }))
        history.reload()
      } else {
        await fuelService.save(input, id)
        navigate('/abastecimentos')
      }
    } catch (cause) {
      setError((cause as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const beforePercent = cap ? Math.min((spent / cap) * 100, 100) : 0
  const afterPercent = cap ? Math.min(((spent + total) / cap) * 100, 100) : 0
  const isOverCap = cap ? spent + total > cap : false

  const formatPlate = (plate?: string | null) =>
    plate?.replace('-', '').toUpperCase() || ''

  return (
    <div className={styles.page}>
      <PageHeader
        title={id ? 'Editar abastecimento' : 'Registrar abastecimento'}
        subtitle="Registre a despesa e mantenha o histórico do veículo atualizado."
      />

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">Abastecimento registrado com sucesso.</Alert>}

      <div className={styles.layoutGrid}>
        <form className={styles.formColumn} onSubmit={submit} aria-busy={saving}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Veículo e responsável</h2>
            <p className={styles.cardSubtitle}>Campos com * são obrigatórios.</p>

            <div className={styles.formGroup}>
              <label htmlFor="veiculo">Veículo *</label>
              <select
                id="veiculo"
                required
                value={form.veiculo_id}
                onChange={(e) => {
                  const vehicle = options.veiculos.find((v) => v.id === e.target.value)
                  setForm((current) => ({
                    ...current,
                    veiculo_id: e.target.value,
                    combustivel: vehicle?.tipo_combustivel ?? '',
                    km_momento_abastecimento: '', // <-- CORRIGIDO: Campo limpo ao trocar de veículo
                  }))
                }}
              >
                <option value="">Selecione o veículo</option>
                {options.veiculos.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.identificacao ? `${v.identificacao} · ` : ''}
                    {v.modelo} · {v.placa}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label htmlFor="motorista">Motorista *</label>
                <select
                  id="motorista"
                  required
                  disabled={mode === 'driver'}
                  value={form.motorista_id}
                  onChange={(e) => setField('motorista_id', e.target.value)}
                >
                  <option value="">Selecione o motorista</option>
                  {options.motoristas.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="data">Data e horário *</label>
                <input
                  id="data"
                  type="datetime-local"
                  required
                  value={form.data_abastecimento}
                  onChange={(e) => setField('data_abastecimento', e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Dados da despesa</h2>

            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label htmlFor="combustivel">Combustível *</label>
                <select
                  id="combustivel"
                  required
                  value={form.combustivel}
                  onChange={(e) => setField('combustivel', e.target.value)}
                >
                  <option value="">Selecione</option>
                  <option value="Gasolina">Gasolina</option>
                  <option value="Etanol">Etanol</option>
                  <option value="Diesel S10">Diesel S10</option>
                  <option value="Diesel S500">Diesel S500</option>
                  <option value="GNV">GNV</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="km">Hodômetro *</label>
                <input
                  id="km"
                  type="number"
                  required
                  min={0}
                  value={form.km_momento_abastecimento}
                  onChange={(e) => setField('km_momento_abastecimento', e.target.value)}
                  // <-- CORRIGIDO: Placeholder dinâmico
                  placeholder={
                    selected
                      ? `Ex: ${selected.quilometragem.toLocaleString('pt-BR')}`
                      : 'Ex.: 45.000'
                  }
                />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label htmlFor="litros">Volume abastecido (L) *</label>
                <input
                  id="litros"
                  type="number"
                  step="0.01"
                  required
                  min={0}
                  value={form.litros}
                  onChange={(e) => setField('litros', e.target.value)}
                  placeholder="Ex: 30,00"
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="preco">Preço por litro *</label>
                <input
                  id="preco"
                  type="number"
                  step="0.0001"
                  required
                  min={0}
                  value={form.preco_litro}
                  onChange={(e) => setField('preco_litro', e.target.value)}
                  placeholder="Ex: 8,50"
                />
              </div>
            </div>

            <div className={styles.totalBox}>
              <div>
                <p>Total calculado</p>
                <span>
                  {form.litros || 0} L × R$ {form.preco_litro || 0} / L
                </span>
              </div>
              <strong>{money(total || 0)}</strong>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="posto">Posto *</label>
              <input
                id="posto"
                type="text"
                required
                maxLength={150}
                value={form.posto}
                onChange={(e) => setField('posto', e.target.value)}
                placeholder="Ex: Posto Sul"
              />
              <p className={styles.helperText}>
                Abastecimento parcial - não utilizado isoladamente no cálculo de consumo
                médio.
              </p>
            </div>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Comprovante (opcional)</h2>
            <div className={styles.uploadArea}>
              <div className={styles.uploadInfo}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <div>
                  <p>Selecionar arquivo</p>
                  <span>PDF, JPG ou PNG · até 10 MB</span>
                </div>
              </div>
              <label className={styles.attachBtn}>
                Anexar
                <input
                  type="file"
                  hidden
                  onChange={(e) => setReceipt(e.target.files?.[0] || null)}
                />
              </label>
            </div>
            {receipt && (
              <p className={styles.helperText}>Arquivo selecionado: {receipt.name}</p>
            )}
          </section>

          <div className={styles.footer}>
            <span className={styles.footerText}>Revise os dados antes de salvar.</span>
            <div className={styles.actions}>
              <ButtonLink
                variant="secondary"
                to={mode === 'driver' ? '/' : '/abastecimentos'}
              >
                Cancelar
              </ButtonLink>
              <Button type="submit" isLoading={saving}>
                Salvar abastecimento
              </Button>
            </div>
          </div>
        </form>

        <aside className={styles.summaryColumn}>
          <div className={styles.card}>
            <h3 className={styles.vehicleTitle}>
              {selected
                ? `${selected.identificacao || selected.modelo} · ${selected.modelo}`
                : 'Selecione um veículo'}
            </h3>

            {selected && (
              <>
                <div className={styles.vehicleHeader}>
                  <div className={styles.plate}>
                    <div className={styles.plateHeader}>BRASIL</div>
                    <div className={styles.plateText}>{formatPlate(selected.placa)}</div>
                  </div>
                  <span className={styles.badgeAvailable}>Disponível</span>
                </div>
                <p className={styles.vehicleInfo}>
                  {selected.quilometragem.toLocaleString('pt-BR')} km ·{' '}
                  {selected.frota || 'Administrativa'} · {selected.tipo_combustivel} ·{' '}
                  {selected.capacidade_maxima} L
                </p>
              </>
            )}
          </div>

          {selected && (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Impacto no teto mensal</h3>
              <p className={styles.cardSubtitle}>
                Abastecimento ·{' '}
                {new Date(form.data_abastecimento).toLocaleDateString('pt-BR', {
                  month: 'long',
                  year: 'numeric',
                })}
              </p>

              {history.status === 'loading' ? (
                <StateMessage variant="loading" title="Calculando..." />
              ) : cap ? (
                <>
                  <div className={styles.progressInfo}>
                    <span>Antes deste registro</span>
                  </div>
                  <div className={styles.progressValues}>
                    <strong>{money(spent)}</strong>
                    <span>{Math.round(beforePercent)}% do teto</span>
                  </div>
                  <div className={styles.progressBarBg}>
                    <div
                      className={styles.progressBarBlue}
                      style={{ width: `${beforePercent}%` }}
                    />
                  </div>
                  <p className={styles.progressSub}>
                    de {money(cap)} ·{' '}
                    {new Date(form.data_abastecimento).toLocaleDateString('pt-BR', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>

                  <div className={styles.spacer} />

                  <div className={styles.progressInfo}>
                    <span>Este abastecimento</span>
                    <strong className={styles.textBlue}>+ {money(total)}</strong>
                  </div>

                  <div className={styles.spacer} />

                  <div className={styles.progressInfo}>
                    <span>Após salvar</span>
                  </div>
                  <div className={styles.progressValues}>
                    <strong>{money(spent + total)}</strong>
                    <span>{Math.round(afterPercent)}% do teto</span>
                  </div>
                  <div className={styles.progressBarBg}>
                    <div
                      className={
                        isOverCap ? styles.progressBarDanger : styles.progressBarWarning
                      }
                      style={{ width: `${afterPercent}%` }}
                    />
                  </div>
                  <p className={styles.progressSub}>
                    de {money(cap)} ·{' '}
                    {new Date(form.data_abastecimento).toLocaleDateString('pt-BR', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>

                  {isOverCap ? (
                    <span className={`${styles.badgeWarning} ${styles.badgeDanger}`}>
                      Atenção · teto excedido
                    </span>
                  ) : (
                    <span className={styles.badgeWarning}>
                      Atenção · saldo de {money(cap - (spent + total))}
                    </span>
                  )}

                  <div className={styles.warningBox}>
                    <p>
                      ⚠️{' '}
                      <strong>{Math.round(afterPercent)}% do teto será utilizado</strong>
                    </p>
                    <p>
                      Este registro ficará {isOverCap ? 'fora' : 'dentro'} do limite de{' '}
                      {money(cap)}. Planeje os próximos abastecimentos.
                    </p>
                  </div>
                </>
              ) : (
                <p className={styles.cardSubtitle}>
                  Teto mensal não definido para este veículo.
                </p>
              )}
            </div>
          )}

          {lastFuel && (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Último abastecimento</h3>
              <p className={styles.cardSubtitle}>
                {new Date(lastFuel.data_abastecimento).toLocaleDateString('pt-BR')} ·{' '}
                {lastFuel.posto}
              </p>
              <p className={styles.lastFuelInfo}>
                {Number(lastFuel.litros).toLocaleString('pt-BR')} L ·{' '}
                {money(lastFuel.valor_total)} ·{' '}
                {lastFuel.km_momento_abastecimento.toLocaleString('pt-BR')} km
              </p>
              <p className={styles.lastFuelDriver}>
                Responsável: {lastFuel.motorista_nome}
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
