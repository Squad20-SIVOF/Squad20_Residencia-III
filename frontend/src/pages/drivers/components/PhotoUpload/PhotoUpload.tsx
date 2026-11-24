import { useRef, useState } from 'react'
import { Avatar } from '@/components/Avatar'
import { Button } from '@/components/Button'
import styles from './PhotoUpload.module.scss'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png']
const MAX_SIZE_BYTES = 5 * 1024 * 1024

export interface PhotoUploadProps {
  name: string
  photo: string | undefined
  onChange: (photo: string) => void
}

export function PhotoUpload({ name, photo, onChange }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  function handleFile(file: File | undefined) {
    if (!file) return

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Envie uma imagem JPG ou PNG.')
      return
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError('A imagem deve ter até 5 MB.')
      return
    }

    setError(null)
    const reader = new FileReader()
    reader.onload = () => onChange(reader.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div className={styles.wrapper}>
      <Avatar name={name || 'Motorista'} src={photo} size="lg" />
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        className={styles.input}
        aria-label="Arquivo da foto"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
      <Button variant="secondary" onClick={() => inputRef.current?.click()}>
        Enviar foto
      </Button>
      <p className={styles.hint}>JPG ou PNG · até 5 MB</p>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
