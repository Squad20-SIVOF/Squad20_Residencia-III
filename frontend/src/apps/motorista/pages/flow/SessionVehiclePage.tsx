import { useNavigate } from 'react-router-dom'
import { ButtonLink } from '@/components/ButtonLink'
import { useState } from 'react'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { TextField } from '@/components/TextField'
import { api } from '@/service/api'
import { useAsync } from '@/hooks/useAsync'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { readVehicleQr } from '@/utils/vehicleQr'
import { VehicleQrScanner } from '../../components/VehicleQrScanner'
import type { DriverVehicle } from '../../types'
import styles from './DriverFlow.module.scss'
const load = async () =>
  (await api<{ message: DriverVehicle | null }>('/motorista/veiculo-sessao')).message
export function SessionVehiclePage() {
  useDocumentTitle('Veículo da sessão')
  const result = useAsync(load)
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  async function select(value: string) {
    if (saving) return
    setSaving(true)
    setError('')
    try {
      const veiculo_id = readVehicleQr(value)
      await api('/motorista/veiculo-sessao', {
        method: 'POST',
        body: JSON.stringify({ veiculo_id }),
      })
      navigate('/', { replace: true })
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Não foi possível vincular o veículo.',
      )
    } finally {
      setSaving(false)
    }
  }
  return (
    <section className={styles.content}>
      <h1>Veículo da sessão</h1>
      <p>
        Leia a etiqueta do carro. A seleção vale somente para esta sessão e não altera seu
        cadastro ou suas viagens.
      </p>
      {result.status === 'success' && (
        <Card title="Veículo selecionado">
          {result.data ? (
            <>
              <p>
                {result.data.modelo} · {result.data.placa}
              </p>
              <ButtonLink to="/">Continuar para o início</ButtonLink>
              <Button
                variant="secondary"
                disabled={saving}
                onClick={async () => {
                  setSaving(true)
                  setError('')
                  try {
                    await api('/motorista/veiculo-sessao', { method: 'DELETE' })
                    result.reload()
                  } catch {
                    setError('Não foi possível remover a seleção.')
                  } finally {
                    setSaving(false)
                  }
                }}
              >
                Desvincular desta sessão
              </Button>
            </>
          ) : (
            <p>Nenhum veículo selecionado.</p>
          )}
        </Card>
      )}
      {result.status === 'error' && (
        <>
          <p role="alert">Não foi possível consultar a seleção atual.</p>
          <Button onClick={result.reload}>Tentar novamente</Button>
        </>
      )}
      {!saving && <VehicleQrScanner onRead={(value) => void select(value)} />}
      <form
        className={styles.panel}
        onSubmit={(event) => {
          event.preventDefault()
          void select(code)
        }}
      >
        <TextField
          label="Código da etiqueta"
          value={code}
          onChange={setCode}
          required
          disabled={saving}
        />
        <Button type="submit" isLoading={saving} disabled={!code.trim()}>
          Vincular nesta sessão
        </Button>
      </form>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      <p>
        Somente veículos liberados para sua conta podem ser selecionados. O QR não concede
        permissão.
      </p>
    </section>
  )
}
