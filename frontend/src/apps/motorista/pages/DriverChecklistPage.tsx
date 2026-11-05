import { useState } from 'react'
import { api } from '@/service/api'
import { useAsync } from '@/hooks/useAsync'
import { Alert } from '@/components/Alert'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { CheckboxField } from '@/components/CheckboxField'
import { PageHeader } from '@/components/PageHeader'
import { StateMessage } from '@/components/StateMessage'
import type { InspectionItem } from '@/pages/vehicles/types'
import styles from './DriverPages.module.scss'
interface Vehicle {
  id: string
  placa: string
  modelo: string
  checklist_vistoria: InspectionItem[]
}
const load = async () =>
  (await api<{ message: Vehicle[] }>('/motorista/vistorias')).message
const emptyItems = ['Pneus e rodas', 'Freios', 'Iluminação', 'Documentação'].map(
  (label, i) => ({ id: `item-${i + 1}`, label, isOk: false }),
)
export function DriverChecklistPage() {
  const request = useAsync(load)
  const [vehicleId, setVehicleId] = useState('')
  const [checked, setChecked] = useState<InspectionItem[] | null>(null)
  const [saving, setSaving] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const vehicles = request.status === 'success' ? request.data : []
  const selected = vehicles.find((v) => v.id === vehicleId)
  const items =
    checked ??
    (selected?.checklist_vistoria.length ? selected.checklist_vistoria : emptyItems)
  async function submit() {
    if (!selected || saving) return
    setSaving(true)
    setError('')
    setSent(false)
    try {
      await api('/motorista/vistorias', {
        method: 'POST',
        body: JSON.stringify({ veiculo_id: selected.id, itens: items }),
      })
      setSent(true)
      request.reload()
    } catch (cause) {
      setError((cause as Error).message)
    } finally {
      setSaving(false)
    }
  }
  return (
    <div className={styles.page}>
      <PageHeader
        title="Checklist do veículo"
        subtitle="Selecione o veículo e marque os itens verificados."
      />
      {request.status === 'loading' ? (
        <StateMessage variant="loading" title="Carregando checklist" />
      ) : request.status === 'error' ? (
        <StateMessage
          variant="error"
          title="Não foi possível carregar a vistoria"
          description={request.error instanceof Error ? request.error.message : undefined}
          action={<Button onClick={request.reload}>Tentar novamente</Button>}
        />
      ) : !vehicles.length ? (
        <StateMessage title="Nenhum veículo vinculado ao seu cadastro." />
      ) : (
        <>
          <label htmlFor="inspection-vehicle">Veículo</label>
          <select
            id="inspection-vehicle"
            value={vehicleId}
            disabled={saving}
            onChange={(event) => {
              setVehicleId(event.target.value)
              setChecked(null)
              setSent(false)
              setError('')
            }}
          >
            <option value="">Selecione</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.placa} · {v.modelo}
              </option>
            ))}
          </select>
          {selected && (
            <Card>
              <ul className={styles.list}>
                {items.map((item, index) => (
                  <li key={item.id}>
                    <CheckboxField
                      disabled={saving}
                      label={item.label}
                      checked={item.isOk}
                      onChange={(isOk) => {
                        setChecked(
                          items.map((entry, i) =>
                            i === index ? { ...entry, isOk } : entry,
                          ),
                        )
                        setSent(false)
                      }}
                    />
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {sent && <Alert variant="success">Vistoria registrada.</Alert>}
          {error && <Alert variant="danger">{error}</Alert>}
          <Button isFullWidth isLoading={saving} disabled={!selected} onClick={submit}>
            Salvar vistoria
          </Button>
        </>
      )}
    </div>
  )
}
