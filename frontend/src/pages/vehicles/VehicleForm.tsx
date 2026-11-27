import { useCallback, useState, type FormEvent } from 'react'
import { BackLink } from '@/components/BackLink/BackLink'
import { Button } from '@/components/Button'
import { TextField } from '@/components/TextField'
import { SelectField } from '@/components/SelectField'
import { CheckboxField } from '@/components/CheckboxField'
import { Card } from '@/components/Card'
import { PageHeader } from '@/components/PageHeader'
import { Alert } from '@/components/Alert'
import { useAsync } from '@/hooks/useAsync'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { classNames } from '@/utils/classNames'
import { readPhoto } from '@/utils/photo'
import styles from './VehicleForm.module.scss'
import { api } from '@/service/api'
import { SwitchField } from './components/SwitchField'
import { VehicleFormAside } from './components/VehicleFormAside'
import type { Vehicle, VehicleResponse, Fleet } from './types'

const FLEET_OPTIONS = (
  ['Não informada', 'Administrativa', 'Assistencial', 'Operacional', 'SVO'] as Fleet[]
).map((value) => ({ value, label: value }))

interface Props {
  vehicle: Vehicle | null
  onSave: () => void
  onCancel: () => void
  onBackToList?: () => void
}
export function VehicleForm({ vehicle, onSave, onCancel, onBackToList }: Props) {
  const title = vehicle ? 'Editar veículo' : 'Cadastrar veículo'
  useDocumentTitle(title)
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
  const [available, setAvailable] = useState(true)
  const [checklist, setChecklist] = useState(vehicle?.inspectionChecklist ?? [])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [photoChange, setPhotoChange] = useState<string | null>()
  const [photoError, setPhotoError] = useState('')
  const [readingPhoto, setReadingPhoto] = useState(false)
  const vehicleId = vehicle?.id
  const needsPhoto = vehicle?.hasPhoto === true && vehicle.photo === undefined
  const loadPhoto = useCallback(async () => {
    if (!vehicleId || !needsPhoto) return null
    const { message } = await api<{ message: VehicleResponse }>(
      `/vehicles/${encodeURIComponent(vehicleId)}`,
    )
    return message.foto ?? null
  }, [needsPhoto, vehicleId])
  const photoRequest = useAsync(loadPhoto)
  const photo =
    photoChange === undefined
      ? (vehicle?.photo ?? (photoRequest.status === 'success' ? photoRequest.data : null))
      : photoChange

  async function selectPhoto(file: File) {
    setReadingPhoto(true)
    setPhotoError('')
    try {
      setPhotoChange(await readPhoto(file))
    } catch (cause) {
      setPhotoError(
        cause instanceof Error ? cause.message : 'Não foi possível ler a foto.',
      )
    } finally {
      setReadingPhoto(false)
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (saving || readingPhoto) return
    setSaving(true)
    setError('')
    try {
      const body = {
        ...values,
        proxima_vistoria: values.proxima_vistoria || null,
        checklist_vistoria: checklist,
        frota: fleet === 'Não informada' ? null : fleet,
        exclusivo_svo: exclusiveSvo,
        ...(photoChange !== undefined && { foto: photoChange }),
        ...(!vehicle && { ativo: available }),
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
  // [campo, rótulo, tipo, exemplo]. Obrigatórios levam " *" no rótulo.
  const fields = [
    ['identificacao', 'Identificação interna', 'text', 'Ex.: SVO-01'],
    ['marca', 'Marca', 'text', 'Ex.: Fiat'],
    ['proxima_vistoria', 'Próxima vistoria (opcional)', 'date', ''],
    ['modelo', 'Modelo', 'text', 'Ex.: Fiorino 1.4'],
    ['placa', 'Placa Mercosul', 'text', 'ABC1D23'],
    ['tipo_combustivel', 'Combustível', 'text', 'Ex.: Flex (gasolina e etanol)'],
    ['capacidade_maxima', 'Capacidade do tanque (L)', 'number', 'Ex.: 58'],
    ['quilometragem', 'Quilometragem atual (km)', 'number', ''],
    ['teto_gasto_mensal', 'Teto mensal de abastecimento (R$)', 'number', 'Opcional'],
  ] as const
  const OPTIONAL_FIELDS: readonly string[] = [
    'teto_gasto_mensal',
    'identificacao',
    'marca',
    'proxima_vistoria',
  ]
  function renderFields(keys: (typeof fields)[number][0][]) {
    return fields
      .filter(([key]) => keys.includes(key))
      .map(([key, label, type, placeholder]) => {
        const isRequired = !OPTIONAL_FIELDS.includes(key)
        return (
          <TextField
            key={key}
            id={`vehicle-${key}`}
            label={isRequired ? `${label} *` : label}
            type={type}
            placeholder={placeholder || undefined}
            min={key === 'capacidade_maxima' ? 1 : 0}
            step={key === 'teto_gasto_mensal' ? '0.01' : '1'}
            inputMode={
              type !== 'number'
                ? undefined
                : key === 'teto_gasto_mensal'
                  ? 'decimal'
                  : 'numeric'
            }
            value={values[key]}
            onChange={(value) =>
              setValues((current) => ({
                ...current,
                [key]: key === 'placa' ? value.toUpperCase() : value,
              }))
            }
            disabled={saving}
            required={isRequired}
          />
        )
      })
  }

  return (
    <div className={styles.page}>
      <PageHeader
        className={styles.header}
        title={title}
        breadcrumb={
          <BackLink to="/veiculos" onClick={onBackToList ?? onCancel}>
            Voltar para Veículos
          </BackLink>
        }
        subtitle={
          vehicle
            ? 'Atualize os dados e as condições de operação do veículo.'
            : 'Adicione um veículo e defina as condições iniciais de operação.'
        }
      />
      <form onSubmit={submit} className={styles.layout} aria-busy={saving}>
        <div className={styles.form}>
          {error && <Alert variant="danger">{error}</Alert>}
          <Card title="Identificação do veículo" className={styles.card}>
            <p className={styles.hint}>Campos com * são obrigatórios.</p>
            <div className={classNames(styles.grid, styles.gridThree)}>
              {renderFields(['identificacao', 'marca'])}
              {renderFields(['modelo', 'placa'])}
              <fieldset disabled={saving} className={styles.controls}>
                <SelectField
                  label="Frota"
                  value={fleet}
                  options={FLEET_OPTIONS}
                  onChange={(value) => {
                    setFleet(value)
                    if (value !== 'SVO') setExclusiveSvo(false)
                  }}
                />
              </fieldset>
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
            {!vehicle && (
              <SwitchField
                className={styles.switch}
                label="Disponível para viagens"
                description={
                  available
                    ? 'Ativado · liberado para novas viagens'
                    : 'Desativado · indisponível para novas viagens'
                }
                checked={available}
                onChange={setAvailable}
                disabled={saving}
              />
            )}
            <details className={styles.settings} open={Boolean(vehicle)}>
              <summary>Exclusividade SVO e vistoria</summary>
              <div className={styles.settingsBody}>
                <SwitchField
                  label="Exclusivo SVO"
                  description={
                    exclusiveSvo
                      ? 'Ativado · veículo reservado à frota SVO'
                      : 'Desativado · pode atender qualquer frota'
                  }
                  checked={exclusiveSvo}
                  onChange={(checked) => {
                    setExclusiveSvo(checked)
                    if (checked) setFleet('SVO')
                  }}
                  disabled={saving}
                />
                <h3>Vistoria do veículo</h3>
                <p className={styles.hint}>
                  Registre os itens verificados. Itens desmarcados ficam pendentes; sem
                  itens, nenhuma vistoria é registrada.
                </p>
                <div className={styles.grid}>{renderFields(['proxima_vistoria'])}</div>
                {checklist.length > 0 && (
                  <div className={styles.checklist}>
                    {checklist.map((item, index) => (
                      <CheckboxField
                        key={item.id}
                        variant="plain"
                        label={item.label}
                        checked={item.isOk}
                        disabled={saving}
                        onChange={(isOk) =>
                          setChecklist((current) =>
                            current.map((entry, i) =>
                              i === index ? { ...entry, isOk } : entry,
                            ),
                          )
                        }
                      />
                    ))}
                  </div>
                )}
                {!checklist.length && (
                  <Button
                    variant="secondary"
                    className={styles.checklistButton}
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
              </div>
            </details>
          </Card>
        </div>
        <VehicleFormAside
          isEditing={vehicle !== null}
          identification={values.identificacao}
          brand={values.marca}
          model={values.modelo}
          plate={values.placa}
          fleet={fleet}
          isExclusiveSvo={exclusiveSvo}
          fuelType={values.tipo_combustivel}
          capacity={values.capacidade_maxima}
          photo={photo}
          photoError={
            photoError ||
            (photoChange === undefined && photoRequest.status === 'error'
              ? 'Não foi possível carregar a foto atual.'
              : '')
          }
          photoDisabled={
            saving || readingPhoto || (needsPhoto && photoRequest.status === 'loading')
          }
          onPhotoSelected={selectPhoto}
          onPhotoRemoved={() => {
            setPhotoChange(null)
            setPhotoError('')
          }}
        />
        <footer className={styles.footer}>
          <p className={styles.hint}>Revise os dados antes de salvar.</p>
          <div className={styles.actions}>
            <Button variant="secondary" onClick={onCancel} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={saving} disabled={readingPhoto}>
              {vehicle ? 'Salvar alterações' : 'Cadastrar veículo'}
            </Button>
          </div>
        </footer>
      </form>
    </div>
  )
}
