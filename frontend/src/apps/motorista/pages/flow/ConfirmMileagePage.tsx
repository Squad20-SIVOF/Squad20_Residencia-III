import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatKm } from '@/utils/format'
import { useTripCapture } from '../../components/TripCaptureContext'
import { recordTripCapture } from '../../services/driverAppService'
import { useDriverTrip } from './useDriverTrip'
import { TripState } from './TripState'
import styles from './DriverFlow.module.scss'
export function ConfirmMileagePage() {
  const { id = '', action } = useParams()
  const type = action === 'fim' ? 'fim' : 'inicio'
  useDocumentTitle(type === 'inicio' ? 'Confirmar início' : 'Confirmar finalização')
  const result = useDriverTrip()
  const { capture, setCapture } = useTripCapture()
  const draft = capture?.tripId === id && capture.type === type ? capture : null
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  if (result.status !== 'success')
    return (
      <TripState
        error={result.status === 'error' ? result.error : undefined}
        reload={result.reload}
      />
    )
  const trip = result.data
  if (!draft || !/^\d{1,10}$/.test(draft.km))
    return (
      <section className={styles.content}>
        <h1>Leitura não disponível</h1>
        <p>Nenhuma leitura foi enviada.</p>
        <Link to={`/viagens/${id}/${type}/painel`}>Fotografar painel</Link>
      </section>
    )
  const km = Number(draft.km)
  const minimum = Math.max(trip.quilometragem, trip.km_inicial ?? 0)
  const valid = km >= minimum && km <= 2147483647
  async function confirm() {
    if (!draft || saving || !valid) return
    setSaving(true)
    setError('')
    try {
      await recordTripCapture(id, type, km, draft.foto)
      setCapture(null)
      navigate(`/viagens/${id}`, { replace: true })
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Não foi possível registrar a leitura.',
      )
    } finally {
      setSaving(false)
    }
  }
  return (
    <section className={styles.content}>
      <h1>{type === 'inicio' ? 'Confirmar início' : 'Confirmar finalização'}</h1>
      <p className={styles.muted}>Confira a leitura com a foto antes de confirmar.</p>
      <img
        src={draft.foto}
        alt="Foto do painel a ser registrada"
        className={styles.photo}
      />
      <Card>
        <p className={styles.reading}>{formatKm(km)}</p>
        <p>
          {trip.modelo} · {trip.placa}
        </p>
        <p>Última leitura registrada: {formatKm(minimum)}</p>
        <time dateTime={draft.capturedAt}>
          {new Date(draft.capturedAt).toLocaleString('pt-BR')}
        </time>
      </Card>
      {!valid && (
        <p role="alert" className={styles.error}>
          A quilometragem deve ser igual ou superior à última leitura registrada e estar
          no limite permitido.
        </p>
      )}
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      <div className={styles.actions}>
        <Button isLoading={saving} disabled={!valid} onClick={() => void confirm()}>
          {type === 'inicio' ? 'Confirmar e iniciar viagem' : 'Confirmar finalização'}
        </Button>
        <Button
          variant="secondary"
          disabled={saving}
          onClick={() => navigate(`/viagens/${id}/${type}/corrigir-leitura`)}
        >
          Corrigir leitura
        </Button>
        <Button
          variant="secondary"
          disabled={saving}
          onClick={() => navigate(`/viagens/${id}/${type}/painel`)}
        >
          Fotografar novamente
        </Button>
      </div>
    </section>
  )
}
