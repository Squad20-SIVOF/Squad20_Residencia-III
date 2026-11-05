import { useCallback, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
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
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const selected = options.veiculos.find((v) => v.id === form.veiculo_id)
  const total = calculateFuelTotal(Number(form.litros), Number(form.preco_litro))
  const month = form.data_abastecimento.slice(0, 7)
  const loadHistory = useCallback(async () => {
    if (!form.veiculo_id || !month) return 0
    if (mode === 'driver') return fuelService.ownSpent(form.veiculo_id, month)
    const rows = await fuelService.list({
      ...monthRange(month),
      veiculo_id: form.veiculo_id,
    })
    return rows
      .filter((row) => row.id !== id)
      .reduce((sum, row) => sum + Number(row.valor_total), 0)
  }, [form.veiculo_id, month, mode, id])
  const history = useAsync(loadHistory)
  const spent = history.status === 'success' ? history.data : null
  const cap = selected?.teto_gasto_mensal
  function setField(key: keyof FormValues, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
    setError('')
  }
  function field(key: keyof FormValues, label: string, type = 'text', step?: string) {
    return (
      <div className={styles.formGroup}>
        <label htmlFor={key}>{label} *</label>
        <input
          id={key}
          type={type}
          required
          value={form[key]}
          min={
            type === 'number'
              ? key === 'km_momento_abastecimento'
                ? 0
                : step
              : undefined
          }
          step={step}
          maxLength={key === 'posto' ? 150 : undefined}
          onChange={(e) => setField(key, e.target.value)}
        />
      </div>
    )
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
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>{id ? 'Editar abastecimento' : 'Registrar abastecimento'}</h1>
          <p>Registre a despesa e mantenha o histórico do veículo atualizado.</p>
        </div>
      </header>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">Abastecimento registrado com sucesso.</Alert>}
      {!options.veiculos.length && (
        <Alert variant="warning">
          Nenhum veículo disponível. Peça ao gestor para revisar os vínculos do motorista.
        </Alert>
      )}
      <div className={styles.layoutGrid}>
        <form className={styles.formColumn} onSubmit={submit} aria-busy={saving}>
          <fieldset className={styles.fieldset} disabled={saving}>
            <section className={styles.card}>
              <h2>Veículo e responsável</h2>
              <p className={styles.subtitle}>Campos com * são obrigatórios.</p>
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
                      km_momento_abastecimento: String(vehicle?.quilometragem ?? ''),
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
                {field('data_abastecimento', 'Data e horário', 'datetime-local')}
              </div>
            </section>
            <section className={styles.card}>
              <h2>Dados da despesa</h2>
              <div className={styles.row}>
                {field('combustivel', 'Combustível')}
                {field('km_momento_abastecimento', 'Hodômetro', 'number', '1')}
              </div>
              <div className={styles.row}>
                {field('litros', 'Volume abastecido (L)', 'number', '0.01')}
                {field('preco_litro', 'Preço por litro (R$)', 'number', '0.0001')}
              </div>
              <div className={styles.totalBox}>
                <span>Total calculado</span>
                <strong>{money(total || 0)}</strong>
              </div>
              {field('posto', 'Posto')}
            </section>
            <div className={styles.actions}>
              <Link
                to={mode === 'driver' ? '/' : '/abastecimentos'}
                className={styles.btnSecondary}
              >
                Cancelar
              </Link>
              <Button type="submit" isLoading={saving}>
                {id ? 'Salvar alterações' : 'Salvar abastecimento'}
              </Button>
            </div>
          </fieldset>
        </form>
        <aside className={styles.summaryColumn} aria-label="Resumo do abastecimento">
          <div className={styles.card}>
            <h3>
              {selected
                ? `${selected.identificacao || selected.modelo} · ${selected.placa}`
                : 'Selecione um veículo'}
            </h3>
            {selected && (
              <p className={styles.vehicleInfo}>
                {selected.quilometragem.toLocaleString('pt-BR')} km ·{' '}
                {selected.frota ?? 'Frota não informada'} · {selected.tipo_combustivel}
              </p>
            )}
          </div>
          <div className={styles.card}>
            <h3>Impacto no teto mensal</h3>
            <p className={styles.subtitle}>{month}</p>
            {!selected ? (
              <p>Selecione o veículo para consultar o teto.</p>
            ) : history.status === 'loading' ? (
              <StateMessage variant="loading" title="Calculando gastos do mês" />
            ) : history.status === 'error' ? (
              <Alert
                variant="danger"
                action={<Button onClick={history.reload}>Tentar novamente</Button>}
              >
                Não foi possível consultar os gastos do mês.
              </Alert>
            ) : (
              <>
                <p>Já registrado: {money(spent ?? 0)}</p>
                <p>Este abastecimento: {money(total || 0)}</p>
                <p>Após salvar: {money((spent ?? 0) + (total || 0))}</p>
                <p>
                  {cap == null
                    ? 'Teto mensal não definido'
                    : `Teto mensal: ${money(cap)}`}
                </p>
                {cap != null && (spent ?? 0) + (total || 0) > Number(cap) && (
                  <Alert variant="warning">
                    O abastecimento ultrapassa o teto mensal. O registro será sinalizado.
                  </Alert>
                )}
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
