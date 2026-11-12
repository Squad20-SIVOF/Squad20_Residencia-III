import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/Button'
import { TextField } from '@/components/TextField'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useTripCapture } from '../../components/TripCaptureContext'
import removeIcon from '../../assets/delete.svg'
import styles from './DriverFlow.module.scss'
const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete']
export function CorrectMileagePage() {
  useDocumentTitle('Corrigir leitura')
  const { id = '', action } = useParams()
  const type = action === 'fim' ? 'fim' : 'inicio'
  const { capture, setCapture } = useTripCapture()
  const draft = capture?.tripId === id && capture.type === type ? capture : null
  const [km, setKm] = useState(draft?.km ?? '')
  const navigate = useNavigate()
  if (!draft)
    return (
      <section className={styles.content}>
        <h1>Foto não disponível</h1>
        <p>
          A leitura não foi gravada. Ao recarregar a página é necessário fotografar
          novamente.
        </p>
        <Link to={`/viagens/${id}/${type}/painel`}>Fotografar painel</Link>
      </section>
    )
  const valid = /^\d{1,10}$/.test(km) && Number(km) <= 2147483647
  return (
    <section className={styles.content}>
      <h1>Corrigir leitura</h1>
      <p>Digite o valor exibido no hodômetro da foto.</p>
      {draft.simulada ? (
        <p>Painel simulado · Informe uma leitura de teste.</p>
      ) : (
        <img
          src={draft.foto}
          alt="Foto do painel para conferir a leitura"
          className={styles.photo}
        />
      )}
      <TextField
        label="Quilometragem (km)"
        value={km}
        onChange={(value) => setKm(value.replace(/\D/g, '').slice(0, 10))}
        inputMode="numeric"
        autoComplete="off"
      />
      <div className={styles.actions}>
        <Button
          disabled={!valid}
          onClick={() => {
            setCapture({ ...draft, km })
            navigate(`/viagens/${id}/${type}/quilometragem`)
          }}
        >
          Salvar leitura
        </Button>
        <Button
          variant="secondary"
          onClick={() => navigate(`/viagens/${id}/${type}/painel`)}
        >
          Fotografar novamente
        </Button>
      </div>
      <section className={styles.keypad} aria-label="Teclado numérico">
        {keys.map((key) =>
          key ? (
            <button
              type="button"
              key={key}
              aria-label={key === 'delete' ? 'Apagar' : `Adicionar ${key}`}
              onClick={() =>
                setKm((value) =>
                  key === 'delete' ? value.slice(0, -1) : (value + key).slice(0, 10),
                )
              }
            >
              {key === 'delete' ? <img src={removeIcon} alt="" /> : key}
            </button>
          ) : (
            <span key="spacer" />
          ),
        )}
      </section>
    </section>
  )
}
