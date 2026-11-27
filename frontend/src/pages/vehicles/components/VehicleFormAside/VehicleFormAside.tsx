import { useRef } from 'react'
import { Upload } from 'lucide-react'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { vehicleFullModel } from '../../utils/vehicleRules'
import { MercosulPlate } from '../MercosulPlate'
import styles from './VehicleFormAside.module.scss'

export interface VehicleFormAsideProps {
  isEditing: boolean
  identification: string
  brand: string
  model: string
  plate: string
  fleet: string
  isExclusiveSvo: boolean
  fuelType: string
  capacity: string
  photo: string | null
  photoError: string
  photoDisabled: boolean
  onPhotoSelected: (file: File) => void
  onPhotoRemoved: () => void
}

/** Prévia que acompanha o que é digitado e orientações do que vem depois do cadastro. */
export function VehicleFormAside({
  isEditing,
  identification,
  brand,
  model,
  plate,
  fleet,
  isExclusiveSvo,
  fuelType,
  capacity,
  photo,
  photoError,
  photoDisabled,
  onPhotoSelected,
  onPhotoRemoved,
}: VehicleFormAsideProps) {
  const photoInput = useRef<HTMLInputElement>(null)
  const name = [
    identification.trim(),
    model.trim() ? vehicleFullModel({ brand, model: model.trim() }) : 'Modelo do veículo',
  ].filter(Boolean)
  const meta = [
    fleet,
    isExclusiveSvo ? 'Exclusivo SVO' : null,
    fuelType.trim() || 'Combustível não informado',
    capacity ? `${capacity} L` : null,
  ].filter(Boolean)

  return (
    <aside className={styles.aside} aria-label="Prévia do veículo">
      <Card title="Prévia do veículo" className={styles.card}>
        <Badge variant="info" className={styles.badge}>
          {isEditing ? 'Em edição' : 'Novo cadastro'}
        </Badge>
        <MercosulPlate plate={plate || 'ABC1D23'} className={styles.plate} />
        <div className={styles.summary}>
          <p className={styles.name}>{name.join(' · ')}</p>
          <p className={styles.meta}>{meta.join(' · ')}</p>
        </div>
        {isEditing && (
          <>
            {photo && <img src={photo} alt="Foto do veículo" className={styles.photo} />}
            <input
              ref={photoInput}
              type="file"
              accept="image/jpeg,image/png"
              aria-label="Arquivo da foto do veículo"
              disabled={photoDisabled}
              hidden
              onChange={(event) => {
                const file = event.currentTarget.files?.[0]
                event.currentTarget.value = ''
                if (file) onPhotoSelected(file)
              }}
            />
            <Button
              variant="secondary"
              className={styles.photoButton}
              iconStart={<Upload size={16} />}
              disabled={photoDisabled}
              onClick={() => photoInput.current?.click()}
            >
              {photo ? 'Trocar foto do veículo' : 'Adicionar foto do veículo'}
            </Button>
            {photo && (
              <Button
                variant="secondary"
                disabled={photoDisabled}
                onClick={onPhotoRemoved}
              >
                Remover foto
              </Button>
            )}
            {photoError && (
              <p className={styles.photoError} role="alert">
                {photoError}
              </p>
            )}
          </>
        )}
      </Card>
      {!isEditing && (
        <Card title="Depois de cadastrar" className={styles.card}>
          <p className={styles.meta}>Você não precisa registrar gastos agora.</p>
          <ul className={styles.steps}>
            <li className={styles.step}>
              <span className={styles.stepTitle}>
                <svg
                  className={styles.icon}
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12.6 3.4a4 4 0 0 0-5 5.1L3.3 12.8a1.6 1.6 0 0 0 2.3 2.3l4.3-4.3a4 4 0 0 0 5.1-5l-2.4 2.4-2-.4-.4-2z" />
                </svg>
                Registrar manutenção
              </span>
              <span className={styles.meta}>
                Agende revisões e acompanhe serviços, custos e oficinas.
              </span>
              <span className={styles.availability}>Disponível após salvar</span>
            </li>
            <li className={styles.step}>
              <span className={styles.stepTitle}>
                <svg
                  className={styles.icon}
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M4 17V4.5A1.5 1.5 0 0 1 5.5 3h5A1.5 1.5 0 0 1 12 4.5V17M3 17h10M5.5 7.5h5M12 9h1.5a1 1 0 0 1 1 1v3.5a1 1 0 0 0 2 0V7l-2-2" />
                </svg>
                Registrar abastecimento
              </span>
              <span className={styles.meta}>
                Registre litros, valor e posto a partir do painel.
              </span>
              <span className={styles.availability}>Disponível após salvar</span>
            </li>
          </ul>
        </Card>
      )}
      <p className={styles.note}>
        <svg
          className={styles.noteIcon}
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M10 2.5l6 2.2v4.6c0 3.9-2.6 6.9-6 8.2-3.4-1.3-6-4.3-6-8.2V4.7z" />
          <path d="M7.4 10l1.8 1.8 3.4-3.6" />
        </svg>
        O cadastro não cria despesas. Os registros ficam vinculados ao histórico do
        veículo.
      </p>
    </aside>
  )
}
