import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useVehicles } from '@/pages/vehicles/hooks/useVehicles'
import { RequestForm } from './components/RequestForm'
import { RouteCard } from './components/RouteCard'
import { REQUEST_FORM_ID, requestFieldId, useRequestForm } from './hooks/useRequestForm'
import { createRequest } from './services/requestService'
import type { RequestInput } from './types'
import styles from './RequestFormPage.module.scss'

/** Solicitação de veículo (`/viagens`). */
export function RequestFormPage() {
  useDocumentTitle('Solicitar Veículo')
  const navigate = useNavigate()
  const vehiclesRequest = useVehicles()
  // Só veículos disponíveis podem ser indicados como preferência.
  const vehicles =
    vehiclesRequest.status === 'success'
      ? vehiclesRequest.data.filter((vehicle) => vehicle.status === 'ativo')
      : []

  async function handleSubmit(input: RequestInput) {
    const request = await createRequest(input)
    navigate(`/viagens/${request.id}`)
  }

  const form = useRequestForm(vehicles, handleSubmit)

  return (
    <div className={styles.page}>
      <PageHeader
        className={styles.header}
        title="Solicitar Veículo"
        subtitle="Preencha os dados abaixo para reservar um veículo oficial do setor SVO."
      />

      <RouteCard
        className={styles.route}
        formId={REQUEST_FORM_ID}
        originId={requestFieldId('origin')}
        destinationId={requestFieldId('destination')}
        origin={form.values.origin}
        destination={form.values.destination}
        onOriginChange={(value) => form.setField('origin', value)}
        onDestinationChange={(value) => form.setField('destination', value)}
        originError={form.errors.origin}
        destinationError={form.errors.destination}
        isDisabled={form.isSubmitting}
      />

      <RequestForm
        id={REQUEST_FORM_ID}
        className={styles.form}
        form={form}
        vehicles={vehicles}
        vehiclesStatus={vehiclesRequest.status}
        onReloadVehicles={vehiclesRequest.reload}
      />
    </div>
  )
}
