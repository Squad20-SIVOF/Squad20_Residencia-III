import { useEffect, useState } from 'react'
import { LoadingState } from '@/components/LoadingState/LoadingState'
import { Link, useNavigate } from 'react-router-dom'
import { Alert } from '@/components/Alert'
import { PageHeader } from '@/components/PageHeader'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useVehicles } from '@/pages/vehicles/hooks/useVehicles'
import { RequestForm } from './components/RequestForm'
import { RouteCard } from './components/RouteCard'
import { BackLink } from '@/components/BackLink/BackLink'
import { REQUEST_FORM_ID, requestFieldId, useRequestForm } from './hooks/useRequestForm'
import { createRequest } from './services/requestService'
import type { RequestInput } from './types'
import styles from './RequestFormPage.module.scss'

const PENDING_REQUESTS_PATH = '/viagens/solicitacoes'
// Tempo para o aviso de envio ser lido (e anunciado) antes do redirecionamento.
export const REDIRECT_DELAY_MS = 2000

/** Solicitação de veículo (`/viagens/solicitar`). */
export function RequestFormPage() {
  useDocumentTitle('Solicitar Veículo')
  const navigate = useNavigate()
  const [isSent, setIsSent] = useState(false)
  const vehiclesRequest = useVehicles()
  // Só veículos disponíveis podem ser indicados como preferência.
  const vehicles =
    vehiclesRequest.status === 'success'
      ? vehiclesRequest.data.filter((vehicle) => vehicle.status === 'ativo')
      : []

  async function handleSubmit(input: RequestInput) {
    await createRequest(input)
    setIsSent(true)
  }

  const form = useRequestForm(vehicles, handleSubmit)

  useEffect(() => {
    if (!isSent) return
    const timer = setTimeout(() => navigate(PENDING_REQUESTS_PATH), REDIRECT_DELAY_MS)
    return () => clearTimeout(timer)
  }, [isSent, navigate])

  if (vehiclesRequest.status === 'loading')
    return <LoadingState label="Carregando veículos..." />

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <PageHeader
          title="Solicitar Veículo"
          breadcrumb={<BackLink to="/viagens">Voltar para o Painel de Viagens</BackLink>}
          subtitle="Preencha os dados abaixo para solicitar uma viagem institucional."
        />
        <p>A solicitação será enviada para aprovação do gestor.</p>
        <Link to={PENDING_REQUESTS_PATH}>Ver solicitações pendentes</Link>
      </div>

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
        notice={
          isSent && (
            <Alert variant="success">
              Solicitação enviada! Aguardando aprovação do gestor.
            </Alert>
          )
        }
      />
    </div>
  )
}
