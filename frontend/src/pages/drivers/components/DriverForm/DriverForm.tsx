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

export interface DriverFormProps {
  /** Motorista em edição; sem ele o formulário é de cadastro. */
  initial?: Driver | undefined
  onSubmit: (input: DriverInput) => Promise<void>
  onCancel: () => void
}

export function DriverForm({ initial, onSubmit, onCancel }: DriverFormProps) {
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
      noValidate
      className={styles.form}
      aria-busy={form.isSubmitting}
    >
      <fieldset disabled={form.isSubmitting} className={styles.section}>
        <Card className={styles.card}>
          <Alert variant="info">
            Os dados serão validados antes de salvar o cadastro.
            <span className={styles.required}>* Campos obrigatórios</span>
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
              <fieldset className={styles.section}>
                <legend className={styles.legend}>Dados pessoais</legend>
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
                  <TextField
                    id={fieldId('cpf')}
                    label="CPF *"
                    inputMode="numeric"
                    placeholder="000.000.000-00"
                    value={values.cpf}
                    onChange={(value) => setField('cpf', maskCpf(value))}
                    isInvalid={!!errors.cpf}
                    errorMessage={errors.cpf}
                  />
                  <TextField
                    id={fieldId('phone')}
                    label="Telefone"
                    type="tel"
                    placeholder="(79) 00000-0000"
                    value={values.phone}
                    onChange={(value) => setField('phone', value)}
                    isInvalid={!!errors.phone}
                    errorMessage={errors.phone}
                  />
                  <TextField
                    id={fieldId('email')}
                    label="E-mail"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={values.email}
                    onChange={(value) => setField('email', value)}
                    isInvalid={!!errors.email}
                    errorMessage={errors.email}
                  />
                </div>
                <p className={styles.helper}>
                  Contato e foto são opcionais e ficam salvos no cadastro.
                </p>
              </fieldset>

              <fieldset className={styles.section}>
                <legend className={styles.legend}>Habilitação (CNH)</legend>
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
                  <TextField
                    id={fieldId('cnhExpiry')}
                    label="Validade *"
                    inputMode="numeric"
                    placeholder="dd/mm/aaaa"
                    value={values.cnhExpiry}
                    onChange={(value) => setField('cnhExpiry', maskDate(value))}
                    isInvalid={!!errors.cnhExpiry}
                    errorMessage={errors.cnhExpiry}
                  />
                </div>
                <Alert variant="danger">
                  CNH vencida bloqueia o motorista automaticamente para novas viagens. A
                  validade deve ser posterior à data de hoje.
                </Alert>
              </fieldset>

              <fieldset className={styles.section}>
                <legend className={styles.legend}>Vínculo com a frota</legend>
                <div className={styles.grid2}>
                  <SelectField
                    id={fieldId('fleet')}
                    label="Frota"
                    value={values.fleet}
                    options={[
                      { value: '', label: 'Selecione a frota' },
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
                {vehiclesRequest.status === 'loading' && (
                  <p className={styles.helper}>Carregando veículos...</p>
                )}
                {vehiclesRequest.status === 'error' && (
                  <Alert
                    variant="danger"
                    action={
                      <Button variant="secondary" onClick={vehiclesRequest.reload}>
                        Tentar novamente
                      </Button>
                    }
                  >
                    Não foi possível carregar os veículos. Os vínculos existentes serão
                    mantidos.
                  </Alert>
                )}
                {incompatible.length > 0 && (
                  <Alert variant="warning">
                    Remova os veículos incompatíveis com a frota selecionada:{' '}
                    {incompatible.join(', ')}. Ou marque motorista coringa.
                  </Alert>
                )}
                <p className={styles.helper}>
                  Veículos exclusivos SVO só podem ser vinculados a motoristas SVO ou
                  coringas. A API valida todos os vínculos ao salvar.
                </p>
                <div className={styles.wildcard}>
                  <CheckboxField
                    label="Motorista coringa — pode atuar em todas as frotas (inclusive SVO)"
                    description="Ao marcar, o vínculo específico de frota deixa de ser obrigatório."
                    checked={values.isWildcard}
                    onChange={(checked) => setField('isWildcard', checked)}
                  />
                </div>
              </fieldset>

              <div className={styles.footer}>
                <fieldset disabled className={styles.status}>
                  <SelectField
                    label="Status"
                    value={values.status}
                    options={[
                      { value: 'ativo', label: 'Ativo' },
                      { value: 'em_viagem', label: 'Em viagem' },
                      { value: 'ferias', label: 'Férias' },
                      { value: 'bloqueado', label: 'Bloqueado' },
                    ]}
                    onChange={() => {}}
                  />
                  <p className={styles.helper}>Status gerenciado pelo sistema.</p>
                </fieldset>
                <div className={styles.actions}>
                  <Button variant="secondary" onClick={onCancel}>
                    Cancelar
                  </Button>
                  <Button type="submit" isLoading={form.isSubmitting}>
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
