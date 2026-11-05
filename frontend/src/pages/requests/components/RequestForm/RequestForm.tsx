import { Alert } from '@/components/Alert'
import { Button } from '@/components/Button'
import { CheckboxField } from '@/components/CheckboxField'
import { SelectField } from '@/components/SelectField'
import type { SelectOption } from '@/components/SelectField'
import { TextAreaField } from '@/components/TextAreaField'
import { TextField } from '@/components/TextField'
import type { Vehicle } from '@/pages/vehicles/types'
import { classNames } from '@/utils/classNames'
import { maskDate, maskTime, onlyDigits } from '@/utils/masks'
import { requestFieldId } from '../../hooks/useRequestForm'
import type { RequestFormState } from '../../hooks/useRequestForm'
import { REQUEST_SECTORS } from '../../types'
import type { RequestSector } from '../../types'
import { RequestIcon } from '../RequestIcon'
import styles from './RequestForm.module.scss'

const SECTOR_OPTIONS: SelectOption<RequestSector | ''>[] = [
  { value: '', label: 'Selecione...' },
  ...REQUEST_SECTORS.map((sector) => ({ value: sector, label: sector })),
]

export interface RequestFormProps {
  id: string
  form: RequestFormState
  /** Veículos disponíveis para o campo "Veículo preferencial". */
  vehicles: Vehicle[]
  vehiclesStatus: 'loading' | 'error' | 'success'
  onReloadVehicles: () => void
  className?: string
}

export function RequestForm({
  id,
  form,
  vehicles,
  vehiclesStatus,
  onReloadVehicles,
  className,
}: RequestFormProps) {
  const { values, errors, setField } = form
  const vehicleOptions: SelectOption<string>[] = [
    { value: '', label: 'Selecione...' },
    ...vehicles.map((vehicle) => ({
      value: vehicle.id,
      label: `${vehicle.model} · ${vehicle.plate} (até ${vehicle.maxCapacity} passageiros)`,
    })),
  ]

  return (
    <form
      id={id}
      onSubmit={form.handleSubmit}
      noValidate
      className={classNames(styles.form, className)}
      aria-busy={form.isSubmitting}
    >
      <fieldset disabled={form.isSubmitting} className={styles.fields}>
        {(form.hasErrors || form.submitError) && (
          <Alert variant="danger">
            {form.submitError ?? 'Corrija os campos destacados.'}
          </Alert>
        )}

        <SelectField
          id={requestFieldId('sector')}
          label="Setor solicitante"
          value={values.sector}
          options={SECTOR_OPTIONS}
          onChange={(value) => setField('sector', value)}
          errorMessage={errors.sector}
        />

        <div className={styles.grid2}>
          <TextField
            id={requestFieldId('date')}
            label="Data da solicitação"
            inputMode="numeric"
            placeholder="DD/MM/AAAA"
            aria-required="true"
            value={values.date}
            onChange={(value) => setField('date', maskDate(value))}
            isInvalid={!!errors.date}
            errorMessage={errors.date}
          />
          <TextField
            id={requestFieldId('departureTime')}
            label="Horário de saída"
            inputMode="numeric"
            placeholder="00:00"
            aria-required="true"
            value={values.departureTime}
            onChange={(value) => setField('departureTime', maskTime(value))}
            isInvalid={!!errors.departureTime}
            errorMessage={errors.departureTime}
          />
          <TextField
            id={requestFieldId('returnTime')}
            label="Horário retorno previsto"
            inputMode="numeric"
            placeholder="00:00"
            value={values.returnTime}
            onChange={(value) => setField('returnTime', maskTime(value))}
            isInvalid={!!errors.returnTime}
            errorMessage={errors.returnTime}
          />
          <TextField
            id={requestFieldId('passengers')}
            label="Nº de passageiros"
            inputMode="numeric"
            placeholder="Ex: 2"
            aria-required="true"
            value={values.passengers}
            onChange={(value) => setField('passengers', onlyDigits(value).slice(0, 2))}
            isInvalid={!!errors.passengers}
            errorMessage={errors.passengers}
          />
        </div>

        <SelectField
          id={requestFieldId('vehicleId')}
          label="Veículo preferencial"
          value={values.vehicleId}
          options={vehicleOptions}
          onChange={(value) => setField('vehicleId', value)}
          errorMessage={errors.vehicleId}
        />
        {vehiclesStatus === 'loading' && (
          <output className={styles.helper}>Carregando veículos...</output>
        )}
        {vehiclesStatus === 'error' && (
          <Alert
            variant="warning"
            action={
              <Button variant="secondary" onClick={onReloadVehicles}>
                Tentar novamente
              </Button>
            }
          >
            Não foi possível carregar os veículos. Você pode enviar sem preferência.
          </Alert>
        )}

        <TextAreaField
          id={requestFieldId('reason')}
          label="Motivo da solicitação"
          placeholder="Escreva o motivo detalhado..."
          aria-required="true"
          value={values.reason}
          onChange={(value) => setField('reason', value)}
          isInvalid={!!errors.reason}
          errorMessage={errors.reason}
        />

        <CheckboxField
          variant="plain"
          label="Marcar como importante"
          iconStart={<RequestIcon name="flag" className={styles.flag} />}
          checked={values.isImportant}
          onChange={(checked) => setField('isImportant', checked)}
        />

        <p className={styles.status}>
          <span className={styles.statusDot} aria-hidden="true" />
          Status: Aguardando aprovação
        </p>

        <Button
          type="submit"
          isFullWidth
          isLoading={form.isSubmitting}
          iconStart={<RequestIcon name="send" />}
        >
          Enviar Solicitação
        </Button>
      </fieldset>
    </form>
  )
}
