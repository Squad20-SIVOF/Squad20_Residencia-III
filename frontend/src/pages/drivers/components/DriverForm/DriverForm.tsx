import { useId, type ComponentProps, type ReactNode } from 'react'
import {
  CalendarDays,
  Check,
  CircleCheck,
  Info,
  Mail,
  Phone,
  ShieldAlert,
} from 'lucide-react'
import { useVehicles } from '@/pages/vehicles/hooks/useVehicles'
import { DriverVehiclesField } from '../DriverVehiclesField/DriverVehiclesField'
import { DRIVER_FLEETS } from '../../types'
import { PhotoUpload } from '../PhotoUpload'
import { Alert } from '@/components/Alert'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { CheckboxField } from '@/components/CheckboxField'
import { SelectField } from '@/components/SelectField'
import type { SelectOption } from '@/components/SelectField'
import { TextField } from '@/components/TextField'
import { maskCpf, maskDate, onlyDigits } from '@/utils/masks'
import { CNH_CATEGORIES } from '../../types'
import type { CnhCategory, Driver, DriverInput } from '../../types'
import { DRIVER_FIELD_ID_PREFIX, useDriverForm } from '../../hooks/useDriverForm'
import styles from './DriverForm.module.scss'

const CATEGORY_OPTIONS: SelectOption<CnhCategory | ''>[] = [
  { value: '', label: 'Selecione' },
  ...CNH_CATEGORIES.map((category) => ({ value: category, label: category })),
]

const fieldId = (field: string) => `${DRIVER_FIELD_ID_PREFIX}${field}`

function FieldWithIcon({
  icon,
  ...props
}: ComponentProps<typeof TextField> & { icon: ReactNode }) {
  return (
    <div className={styles.withIcon}>
      <TextField {...props} />
      <span className={styles.fieldIcon} aria-hidden="true">
        {icon}
      </span>
    </div>
  )
}

export interface DriverFormProps {
  initial?: Driver | undefined
  onSubmit: (input: DriverInput) => Promise<void>
  onCancel: () => void
}

export function DriverForm({ initial, onSubmit, onCancel }: DriverFormProps) {
  const sectionId = useId()
  const form = useDriverForm(initial, onSubmit)
  const vehiclesRequest = useVehicles()
  const { values, errors, setField } = form
  const vehicles = vehiclesRequest.status === 'success' ? vehiclesRequest.data : []
  const eligibleVehicles = vehicles.filter(
    (vehicle) =>
      vehicle.status !== 'inativo' &&
      (values.isWildcard || (values.fleet && vehicle.fleet === values.fleet)),
  )
  const incompatible = values.vehicles.filter(
    (plate) =>
      vehiclesRequest.status === 'success' &&
      !eligibleVehicles.some((vehicle) => vehicle.plate === plate),
  )

  return (
    <form
      onSubmit={form.handleSubmit}
      autoComplete="off"
      noValidate
      className={styles.form}
      aria-busy={form.isSubmitting}
    >
      <fieldset disabled={form.isSubmitting} className={styles.section}>
        <Card className={styles.card}>
          <Alert variant="info" className={styles.notice}>
            <span className={styles.noticeRow}>
              <span className={styles.noticeText}>
                <Info size={16} aria-hidden="true" />
                Os dados serão validados antes de salvar o cadastro.
              </span>
              <strong>* Campos obrigatórios</strong>
            </span>
          </Alert>

          {(form.hasErrors || form.submitError) && (
            <Alert variant="danger">
              {form.submitError ?? 'Corrija os campos destacados.'}
            </Alert>
          )}

          <div className={styles.layout}>
            <aside className={styles.photo}>
              <PhotoUpload
                name={values.name}
                photo={values.photo}
                onChange={(photo) => setField('photo', photo)}
              />
            </aside>

            <div className={styles.sections}>
              <section
                className={styles.section}
                aria-labelledby={`${sectionId}-personal`}
              >
                <div className={styles.sectionHeader}>
                  <h2 id={`${sectionId}-personal`}>Dados pessoais</h2>
                  <span className={styles.sectionHint}>Identificação e contato</span>
                </div>
                <div className={styles.grid2}>
                  <TextField
                    id={fieldId('name')}
                    label="Nome completo *"
                    placeholder="Ex.: João da Silva"
                    value={values.name}
                    onChange={(value) => setField('name', value)}
                    isInvalid={!!errors.name}
                    errorMessage={errors.name}
                  />
                  <FieldWithIcon
                    id={fieldId('cpf')}
                    icon={<CircleCheck size={16} />}
                    label="CPF *"
                    inputMode="numeric"
                    placeholder="000.000.000-00"
                    value={values.cpf}
                    onChange={(value) => setField('cpf', maskCpf(value))}
                    isInvalid={!!errors.cpf}
                    errorMessage={errors.cpf}
                  />
                  <FieldWithIcon
                    id={fieldId('phone')}
                    icon={<Phone size={16} />}
                    label="Telefone *"
                    type="tel"
                    placeholder="(79) 00000-0000"
                    value={values.phone}
                    onChange={(value) => setField('phone', value)}
                    isInvalid={!!errors.phone}
                    errorMessage={errors.phone}
                  />
                  <FieldWithIcon
                    id={fieldId('email')}
                    icon={<Mail size={16} />}
                    label="E-mail *"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={values.email}
                    onChange={(value) => setField('email', value)}
                    isInvalid={!!errors.email}
                    errorMessage={errors.email}
                  />
                </div>
              </section>

              <section
                className={styles.section}
                aria-labelledby={`${sectionId}-license`}
              >
                <div className={styles.sectionHeader}>
                  <h2 id={`${sectionId}-license`}>Habilitação (CNH)</h2>
                  <span className={styles.sectionHint}>
                    Documento obrigatório para viagens
                  </span>
                </div>
                <div className={styles.grid3}>
                  <TextField
                    id={fieldId('cnh')}
                    label="Nº da CNH *"
                    inputMode="numeric"
                    placeholder="00000000000"
                    value={values.cnh}
                    onChange={(value) => setField('cnh', onlyDigits(value).slice(0, 11))}
                    isInvalid={!!errors.cnh}
                    errorMessage={errors.cnh}
                  />
                  <SelectField
                    id={fieldId('cnhCategory')}
                    label="Categoria *"
                    value={values.cnhCategory}
                    options={CATEGORY_OPTIONS}
                    onChange={(value) => setField('cnhCategory', value)}
                    errorMessage={errors.cnhCategory}
                  />
                  <FieldWithIcon
                    id={fieldId('cnhExpiry')}
                    icon={<CalendarDays size={16} />}
                    label="Validade *"
                    inputMode="numeric"
                    placeholder="dd/mm/aaaa"
                    value={values.cnhExpiry}
                    onChange={(value) => setField('cnhExpiry', maskDate(value))}
                    isInvalid={!!errors.cnhExpiry}
                    errorMessage={errors.cnhExpiry}
                  />
                </div>
                <Alert variant="danger" className={styles.notice}>
                  <span className={styles.noticeText}>
                    <ShieldAlert size={16} aria-hidden="true" />
                    CNH vencida bloqueia o motorista automaticamente para novas viagens. A
                    validade deve ser posterior à data de hoje.
                  </span>
                </Alert>
              </section>

              <section className={styles.section} aria-labelledby={`${sectionId}-fleet`}>
                <div className={styles.sectionHeader}>
                  <h2 id={`${sectionId}-fleet`}>Vínculo com a frota</h2>
                  <span className={styles.sectionHint}>
                    Alocação e disponibilidade operacional
                  </span>
                </div>
                <div className={styles.grid2}>
                  <SelectField
                    id={fieldId('fleet')}
                    label="Frota *"
                    value={values.fleet}
                    options={[
                      { value: '', label: 'Selecione (Administrativa, SVO...)' },
                      ...DRIVER_FLEETS.map((value) => ({ value, label: value })),
                    ]}
                    onChange={(value) => setField('fleet', value)}
                    errorMessage={errors.fleet}
                  />
                  <DriverVehiclesField
                    value={values.vehicles}
                    options={eligibleVehicles.map((vehicle) => vehicle.plate)}
                    onChange={(value) => setField('vehicles', value)}
                  />
                </div>

                {incompatible.length > 0 && (
                  <Alert variant="warning">
                    Remova os veículos incompatíveis com a frota selecionada:{' '}
                    {incompatible.join(', ')}.
                  </Alert>
                )}

                <div className={styles.wildcard}>
                  <CheckboxField
                    variant="plain"
                    label="Motorista coringa — pode atuar em todas as frotas (inclusive SVO)"
                    description="Ao marcar, o vínculo específico de frota deixa de ser obrigatório."
                    checked={values.isWildcard}
                    onChange={(checked) => setField('isWildcard', checked)}
                  />
                  <Info size={16} aria-hidden="true" className={styles.infoIcon} />
                </div>
              </section>

              <div className={styles.footer}>
                <fieldset disabled className={styles.status}>
                  <SelectField
                    label="Status *"
                    value={values.status}
                    options={[
                      { value: 'ativo', label: 'Ativo' },
                      { value: 'em_viagem', label: 'Em viagem' },
                      { value: 'ferias', label: 'Férias' },
                      { value: 'bloqueado', label: 'Bloqueado' },
                    ]}
                    onChange={() => {}}
                  />
                  <p className={styles.helper}>
                    O motorista ficará disponível para novos vínculos após a validação.
                  </p>
                </fieldset>
                <div className={styles.actions}>
                  <Button variant="secondary" onClick={onCancel}>
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    isLoading={form.isSubmitting}
                    iconStart={<Check size={16} />}
                  >
                    Salvar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </fieldset>
    </form>
  )
}
