import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button'
import { TextField } from '@/components/TextField'
import { Card } from '@/components/Card'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { VehicleQrScanner } from '../../components/VehicleQrScanner'
import { useDriverTrip } from './useDriverTrip'
import { TripState } from './TripState'
import styles from './DriverFlow.module.scss'
const normalize = (value: string) =>
  value
    .trim()
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
export function IdentifyVehiclePage() {
  useDocumentTitle('Identificar veículo')
  const result = useDriverTrip()
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  if (result.status !== 'success')
    return (
      <TripState
        error={result.status === 'error' ? result.error : undefined}
        reload={result.reload}
      />
    )
  const trip = result.data
  function identify(value: string) {
    const expected = [trip.veiculo_id, trip.placa, trip.identificacao].filter(
      (v): v is string => Boolean(v),
    )
    if (!normalize(value) || !expected.some((v) => normalize(v) === normalize(value))) {
      setError(
        'O código não corresponde ao veículo desta viagem. Confira a placa ou identificação.',
      )
      return
    }
    navigate(`/viagens/${trip.id}/inicio/painel`)
  }
  return (
    <section className={styles.content}>
      <h1>Identificar veículo</h1>
      <p className={styles.muted}>
        Etapa 1 de 3 · Confira o veículo atribuído à sua viagem.
      </p>
      <Card>
        <strong>
          {trip.modelo} · {trip.placa}
        </strong>
        <p>Identificação: {trip.identificacao || 'Não informada'}</p>
      </Card>
      {trip.status === 'Agendada' ? (
        <>
          <VehicleQrScanner onRead={identify} />
          <form
            className={styles.panel}
            onSubmit={(event: FormEvent) => {
              event.preventDefault()
              identify(code)
            }}
          >
            <TextField
              label="Código do veículo"
              placeholder="Placa, identificação ou UUID"
              value={code}
              onChange={setCode}
              autoComplete="off"
              required
              maxLength={150}
            />
            {error && (
              <p role="alert" className={styles.error}>
                {error}
              </p>
            )}
            <Button type="submit" disabled={!code.trim()}>
              Confirmar veículo
            </Button>
          </form>
        </>
      ) : (
        <p>
          Esta viagem não está mais agendada.{' '}
          <Link to={`/viagens/${trip.id}`}>Consultar viagem</Link>
        </p>
      )}
    </section>
  )
}
