import { useId, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Alert } from '@/components/Alert'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { ButtonLink } from '@/components/ButtonLink'
import { Card } from '@/components/Card'
import { PageHeader } from '@/components/PageHeader'
import { StateMessage } from '@/components/StateMessage'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { maskPhone } from '@/utils/masks'
import { DriverCard } from './components/DriverCard'
import { EtaPanel } from './components/EtaPanel'
import { PickupCard } from './components/PickupCard'
import { RequestIcon } from './components/RequestIcon'
import { RouteMap } from './components/RouteMap'
import { TripProgress } from './components/TripProgress'
import { useRequestTracking } from './hooks/useRequestTracking'
import type { RequestTracking } from './types'
import {
  getArrivalTime,
  getSecondsSince,
  getStageMapBadge,
  isLocationStale,
} from './utils/requestRules'
import styles from './RequestTrackingPage.module.scss'

/** Acompanhamento da rota do motorista até o ponto de embarque (`/viagens/:id`). */
export function RequestTrackingPage() {
  useDocumentTitle('Acompanhar rota')
  const { id = '' } = useParams()
  const { request, tracking, now } = useRequestTracking(id)

  function renderContent() {
    if (request.status === 'loading') {
      return <StateMessage variant="loading" title="Carregando acompanhamento..." />
    }

    if (request.status === 'error' || !tracking) {
      return (
        <StateMessage
          variant="error"
          title="Não foi possível carregar o acompanhamento."
          description="Verifique sua conexão e tente de novo."
          action={
            <Button variant="secondary" onClick={request.reload}>
              Tentar novamente
            </Button>
          }
        />
      )
    }

    return <TrackingContent tracking={tracking} now={now} />
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <ButtonLink
          variant="secondary"
          className={styles.back}
          to="/viagens"
          iconStart={<RequestIcon name="back" />}
        >
          Voltar
        </ButtonLink>
        <PageHeader className={styles.header} title="SIVOF" subtitle="Acompanhar rota" />
        {tracking ? (
          <Badge variant="info" className={styles.code}>
            <span className={styles.hidden}>Solicitação </span>#{tracking.code}
          </Badge>
        ) : (
          <span className={styles.code} />
        )}
      </div>
      {renderContent()}
    </div>
  )
}

interface TrackingContentProps {
  tracking: RequestTracking
  now: Date
}

function TrackingContent({ tracking, now }: TrackingContentProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const detailsId = useId()
  const { driver, vehicle, pickup } = tracking

  return (
    <div className={styles.layout}>
      <RouteMap
        className={styles.map}
        progress={tracking.progress}
        label="Mapa ilustrativo com a posição do veículo e o ponto de embarque"
      >
        <span className={styles.mapBadge}>
          <RequestIcon name="navigation" className={styles.mapBadgeIcon} />
          {getStageMapBadge(tracking.stage)}
        </span>
      </RouteMap>

      <div className={styles.panel}>
        <EtaPanel
          stage={tracking.stage}
          etaMinutes={tracking.etaMinutes}
          arrivalAt={getArrivalTime(tracking.updatedAt, tracking.etaMinutes)}
          remainingKm={tracking.remainingKm}
          secondsSinceUpdate={getSecondsSince(tracking.updatedAt, now)}
        />
        <TripProgress stage={tracking.stage} />

        {isLocationStale(tracking.updatedAt, now) && (
          <Alert variant="warning">
            A localização do motorista não é atualizada há algum tempo. Verifique sua
            conexão.
          </Alert>
        )}
        <Alert variant="info">{pickup.instructions}</Alert>

        <DriverCard
          name={driver.name}
          phone={driver.phone}
          vehicleModel={vehicle.model}
          plate={vehicle.plate}
        />
        <PickupCard address={pickup.address} />

        <div className={styles.actions}>
          <ButtonLink to={`sms:${driver.phone}`} iconStart={<RequestIcon name="chat" />}>
            Contato
          </ButtonLink>
          <Button
            variant="secondary"
            iconStart={<RequestIcon name="document" />}
            aria-expanded={isDetailsOpen}
            aria-controls={detailsId}
            onClick={() => setIsDetailsOpen((isOpen) => !isOpen)}
          >
            {isDetailsOpen ? 'Ocultar detalhes' : 'Ver detalhes'}
          </Button>
        </div>

        <div id={detailsId} hidden={!isDetailsOpen}>
          <Card title="Detalhes da solicitação">
            <dl className={styles.details}>
              <dt>Solicitação</dt>
              <dd>#{tracking.code}</dd>
              <dt>Origem</dt>
              <dd>{tracking.origin}</dd>
              <dt>Destino</dt>
              <dd>{tracking.destination}</dd>
              <dt>Veículo</dt>
              <dd>
                {vehicle.model} · {vehicle.plate}
              </dd>
              <dt>Telefone do motorista</dt>
              <dd>{maskPhone(driver.phone)}</dd>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  )
}
