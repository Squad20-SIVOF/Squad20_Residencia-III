import { useState, type FormEvent } from 'react'
import { Breadcrumb } from '@/components/Breadcrumb'
import { Button } from '@/components/Button'
import { TextField } from '@/components/TextField'
import { SelectField } from '@/components/SelectField'
import { CheckboxField } from '@/components/CheckboxField'
import { Card } from '@/components/Card'
import { PageHeader } from '@/components/PageHeader'
import { Alert } from '@/components/Alert'
import styles from './VehicleForm.module.scss'
import { api } from '@/service/api'
import type { Vehicle, Fleet } from './types'

interface Props {
  vehicle: Vehicle | null
  onSave: () => void
  onCancel: () => void
  onBackToList?: () => void
}
export function VehicleForm({ vehicle, onSave, onCancel, onBackToList }: Props) {
  const [values, setValues] = useState({
    placa: vehicle?.plate ?? '',
    identificacao: vehicle?.identification === '—' ? '' : (vehicle?.identification ?? ''),
    marca: vehicle?.brand ?? '',
    proxima_vistoria:
      vehicle?.nextInspection?.length === 7
        ? `${vehicle.nextInspection}-01`
        : (vehicle?.nextInspection ?? ''),
    modelo: vehicle?.model ?? '',
    tipo_combustivel: vehicle?.fuelType ?? '',
    capacidade_maxima: String(vehicle?.maxCapacity ?? ''),
    quilometragem: String(vehicle?.mileageKm ?? 0),
    teto_gasto_mensal: vehicle?.monthlyCap == null ? '' : String(vehicle.monthlyCap),
  })
  const [fleet, setFleet] = useState<Fleet>(vehicle?.fleet ?? 'Não informada')
  const [exclusiveSvo, setExclusiveSvo] = useState(vehicle?.exclusiveSvo ?? false)
  const [checklist, setChecklist] = useState(vehicle?.inspectionChecklist ?? [])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const body = {
        ...values,
        proxima_vistoria: values.proxima_vistoria || null,
        checklist_vistoria: checklist,
        frota: fleet === 'Não informada' ? null : fleet,
        exclusivo_svo: exclusiveSvo,
        capacidade_maxima: Number(values.capacidade_maxima),
        quilometragem: Number(values.quilometragem),
        ultimo_km_alertado: vehicle?.lastAlertedKm ?? 0,
        teto_gasto_mensal:
          values.teto_gasto_mensal === '' ? undefined : Number(values.teto_gasto_mensal),
      }
      await api(vehicle ? `/vehicles/${encodeURIComponent(vehicle.id)}` : '/vehicles', {
        method: vehicle ? 'PUT' : 'POST',
        body: JSON.stringify(body),
      })
      onSave()
    } catch (cause) {
      setError((cause as Error).message)
    } finally {
      setSaving(false)
    }
  }
  const fields = [
    ['identificacao', 'Identificação interna', 'text'],
    ['marca', 'Marca', 'text'],
    ['proxima_vistoria', 'Próxima vistoria (opcional)', 'date'],
    ['placa', 'Placa', 'text'],
    ['modelo', 'Modelo', 'text'],
    ['tipo_combustivel', 'Combustível', 'text'],
    ['capacidade_maxima', 'Capacidade máxima', 'number'],
    ['quilometragem', 'Quilometragem atual', 'number'],
    ['teto_gasto_mensal', 'Teto de gasto mensal (opcional)', 'number'],
  ] as const
  function renderFields(keys: (typeof fields)[number][0][]) {
    return fields
      .filter(([key]) => keys.includes(key))
      .map(([key, label, type]) => (
        <TextField
          key={key}
          id={`vehicle-${key}`}
          label={label}
          type={type}
          min={key === 'capacidade_maxima' ? 1 : 0}
          step={key === 'teto_gasto_mensal' ? '0.01' : '1'}
          value={values[key]}
          onChange={(value) =>
            setValues((current) => ({
              ...current,
              [key]: key === 'placa' ? value.toUpperCase() : value,
            }))
          }
          disabled={saving}
          required={
            !['teto_gasto_mensal', 'identificacao', 'marca', 'proxima_vistoria'].includes(
              key,
            )
          }
        />
      ))
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title={vehicle ? 'Editar veículo' : 'Cadastrar veículo'}
        breadcrumb={
          <Breadcrumb
            items={[
              { label: 'Veículos', to: '/veiculos', onClick: onBackToList ?? onCancel },
              { label: vehicle ? 'Editar cadastro' : 'Novo cadastro' },
            ]}
          />
        }
        subtitle="Adicione um veículo e defina as condições iniciais de operação."
      />
      <div className={styles.layout}>
        <form onSubmit={submit} className={styles.form} aria-busy={saving}>
          {error && <Alert variant="danger">{error}</Alert>}
          <Card title="Identificação do veículo" className={styles.card}>
            <p className={styles.hint}>Confira a placa e o modelo antes de salvar.</p>
            <div className={styles.grid}>
              {renderFields(['identificacao', 'marca', 'modelo', 'placa'])}
              <fieldset disabled={saving} className={styles.controls}>
                <SelectField
                  label="Frota"
                  value={fleet}
                  options={(
                    [
                      'Não informada',
                      'Administrativa',
                      'Assistencial',
                      'Operacional',
                      'SVO',
                    ] as Fleet[]
                  ).map((value) => ({ value, label: value }))}
                  onChange={(value) => {
                    setFleet(value)
                    if (value !== 'SVO') setExclusiveSvo(false)
                  }}
                />
              </fieldset>
              <CheckboxField
                label="Exclusivo SVO"
                description="Este veículo pertence exclusivamente à frota SVO."
                checked={exclusiveSvo}
                onChange={(checked) => {
                  setExclusiveSvo(checked)
                  if (checked) setFleet('SVO')
                }}
                disabled={saving}
              />
            </div>
          </Card>
          <Card title="Operação e limites" className={styles.card}>
            <p className={styles.hint}>
              Dados iniciais para viagens e controle de abastecimento.
            </p>
            <div className={styles.grid}>
              {renderFields([
                'tipo_combustivel',
                'capacidade_maxima',
                'quilometragem',
                'teto_gasto_mensal',
              ])}
            </div>
          </Card>
          <Card title="Vistoria do veículo" className={styles.card}>
            <div className={styles.grid}>{renderFields(['proxima_vistoria'])}</div>
            <p className={styles.hint}>
              Registre os itens verificados. Itens desmarcados ficam pendentes; sem itens,
              nenhuma vistoria é registrada.
            </p>
            {checklist.map((item, index) => (
              <CheckboxField
                key={item.id}
                label={item.label}
                checked={item.isOk}
                disabled={saving}
                onChange={(isOk) =>
                  setChecklist((current) =>
                    current.map((entry, i) => (i === index ? { ...entry, isOk } : entry)),
                  )
                }
              />
            ))}
            {!checklist.length && (
              <Button
                variant="secondary"
                disabled={saving}
                onClick={() =>
                  setChecklist(
                    ['Pneus e rodas', 'Freios', 'Iluminação', 'Documentação'].map(
                      (label, i) => ({ id: `item-${i + 1}`, label, isOk: false }),
                    ),
                  )
                }
              >
                Registrar checklist de vistoria
              </Button>
            )}
          </Card>
          <footer className={styles.footer}>
            <p className={styles.hint}>Revise os dados antes de salvar.</p>
            <div className={styles.actions}>
              <Button variant="secondary" onClick={onCancel} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" isLoading={saving}>
                {vehicle ? 'Salvar alterações' : 'Cadastrar veículo'}
              </Button>
            </div>
          </footer>
        </form>
        <aside className={styles.preview} aria-label="Prévia do veículo">
          <Card title="Prévia do veículo" className={styles.card}>
            <span className={styles.badge}>
              {vehicle ? 'Em edição' : 'Novo cadastro'}
            </span>
            <div className={styles.plate}>
              <span>BRASIL</span>
              <strong>{values.placa || 'ABC1D23'}</strong>
            </div>
            <p className={styles.model}>{values.modelo || 'Modelo do veículo'}</p>
            <p className={styles.hint}>
              {fleet}
              {exclusiveSvo ? ' · Exclusivo SVO' : ''} ·{' '}
              {values.tipo_combustivel || 'Combustível não informado'}
              {values.capacidade_maxima ? ` · ${values.capacidade_maxima} L` : ''}
            </p>
          </Card>
          <Card title="Dados do cadastro" className={styles.card}>
            <p className={styles.hint}>
              As informações serão vinculadas ao histórico do veículo.
            </p>
            <p className={styles.hint}>
              Marca, identificação interna e vistoria ficam salvas no cadastro.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  )
}
