import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/Button'
import { readPhoto } from '@/utils/photo'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useTripCapture } from '../../components/TripCaptureContext'
import { useDriverTrip } from './useDriverTrip'
import { TripState } from './TripState'
import styles from './DriverFlow.module.scss'
export function CapturePanelPage() {
  useDocumentTitle('Fotografar painel')
  const { action } = useParams()
  const type = action === 'fim' ? 'fim' : 'inicio'
  const result = useDriverTrip()
  const { capture, setCapture } = useTripCapture()
  const navigate = useNavigate()
  const alive = useRef(true)
  const [reading, setReading] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])
  if (result.status !== 'success')
    return (
      <TripState
        error={result.status === 'error' ? result.error : undefined}
        reload={result.reload}
      />
    )
  const trip = result.data
  const draft = capture?.tripId === trip.id && capture.type === type ? capture : null
  const allowed = trip.status === (type === 'inicio' ? 'Agendada' : 'Em andamento')
  async function choose(file: File | undefined) {
    if (!file || reading) return
    setReading(true)
    setError('')
    try {
      const foto = await readPhoto(file)
      if (alive.current)
        setCapture({
          tripId: trip.id,
          type,
          foto,
          km: '',
          capturedAt: new Date().toISOString(),
        })
    } catch (cause) {
      if (alive.current)
        setError(cause instanceof Error ? cause.message : 'Não foi possível ler a foto.')
    } finally {
      if (alive.current) setReading(false)
    }
  }
  return (
    <section className={styles.content}>
      <h1>Fotografar painel</h1>
      <p className={styles.muted}>
        {type === 'inicio' ? 'Etapa 2 de 3 · Preparar início' : 'Registrar finalização'}
      </p>
      <p>
        {trip.modelo} · {trip.placa}
      </p>
      {!allowed ? (
        <p>
          O status atual não permite esta leitura.{' '}
          <Link to={`/viagens/${trip.id}`}>Atualizar viagem</Link>
        </p>
      ) : (
        <>
          {draft && (
            <img
              src={draft.foto}
              className={styles.photo}
              alt="Foto selecionada do painel"
            />
          )}
          <label htmlFor="panel-photo">Foto do painel (JPG ou PNG, até 5 MB)</label>
          <input
            id="panel-photo"
            type="file"
            accept="image/jpeg,image/png"
            capture="environment"
            disabled={reading}
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              void choose(file)
            }}
          />
          <p>
            Fotografe o hodômetro. A leitura da quilometragem será informada manualmente;
            não há leitura automática nesta versão.
          </p>
          {error && (
            <p role="alert" className={styles.error}>
              {error}
            </p>
          )}
          <Button
            isLoading={reading}
            disabled={!draft}
            onClick={() => navigate(`/viagens/${trip.id}/${type}/corrigir-leitura`)}
          >
            Informar quilometragem
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setCapture(null)
              navigate(`/viagens/${trip.id}`)
            }}
          >
            Descartar leitura
          </Button>
        </>
      )}
    </section>
  )
}
