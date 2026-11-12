import { useState } from 'react'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { ButtonLink } from '@/components/ButtonLink'
import { Card } from '@/components/Card'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatKm } from '@/utils/format'
import { confirmArrival } from '../../services/driverAppService'
import { useDriverTrip } from './useDriverTrip'
import { TripState } from './TripState'
import styles from './DriverFlow.module.scss'
export function MobileTripPage() {
  useDocumentTitle('Minha viagem')
  const result = useDriverTrip()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  if (result.status !== 'success')
    return (
      <TripState
        error={result.status === 'error' ? result.error : undefined}
        reload={result.reload}
      />
    )
  const trip = result.data
  async function arrive() {
    if (saving) return
    setSaving(true)
    setError('')
    try {
      await confirmArrival(trip.id)
      result.reload()
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Não foi possível alterar o status.',
      )
    } finally {
      setSaving(false)
    }
  }
  return (
    <section className={styles.content}>
      <div className={styles.summary}>
        <h1>Viagem #{trip.id.slice(0, 8)}</h1>
        <Badge variant="info">{trip.status}</Badge>
      </div>
      <Card title="Veículo atribuído">
        <p>
          {trip.modelo} · {trip.placa}
        </p>
        <p>{trip.categoria ?? 'Categoria não informada'}</p>
        {trip.data_necessidade && (
          <p>Necessidade: {new Date(trip.data_necessidade).toLocaleString('pt-BR')}</p>
        )}
        <p className={styles.muted}>
          Rota e localização em tempo real não foram informadas para esta viagem.
        </p>
      </Card>
      <Card title="Quilometragem">
        <p>
          Inicial:{' '}
          {trip.km_inicial === null ? 'Não registrada' : formatKm(trip.km_inicial)}
        </p>
        <p>
          Final: {trip.km_final === null ? 'Não registrada' : formatKm(trip.km_final)}
        </p>
        {trip.km_final !== null && trip.km_inicial !== null && (
          <p>Percorrido: {formatKm(trip.km_final - trip.km_inicial)}</p>
        )}
      </Card>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      <div className={styles.actions}>
        {trip.status === 'Agendada' && (
          <ButtonLink to={`/viagens/${trip.id}/inicio/identificar`}>
            Identificar veículo
          </ButtonLink>
        )}
        {trip.status === 'Em deslocamento' && (
          <Button isLoading={saving} onClick={() => void arrive()}>
            Confirmar chegada
          </Button>
        )}
        {trip.status === 'Em andamento' && (
          <ButtonLink to={`/viagens/${trip.id}/fim/painel`}>Finalizar viagem</ButtonLink>
        )}
        <ButtonLink to="/abastecimento" variant="secondary">
          Abastecer
        </ButtonLink>
        <Button variant="secondary" onClick={result.reload}>
          Atualizar viagem
        </Button>
      </div>
    </section>
  )
}
