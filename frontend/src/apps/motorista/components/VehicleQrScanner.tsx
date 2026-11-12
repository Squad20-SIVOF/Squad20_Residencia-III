import { useEffect, useRef, useState } from 'react'
import type { IScannerControls } from '@zxing/browser'
import { Button } from '@/components/Button'
import camera from '../assets/camera.svg'
import styles from '../pages/flow/DriverFlow.module.scss'
export function VehicleQrScanner({ onRead }: { onRead: (code: string) => void }) {
  const video = useRef<HTMLVideoElement>(null)
  const onReadRef = useRef(onRead)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    onReadRef.current = onRead
  }, [onRead])
  useEffect(() => {
    const element = video.current
    if (!scanning || !element) return
    let disposed = false
    let controls: IScannerControls | undefined
    import('@zxing/browser')
      .then(async ({ BrowserQRCodeReader }) => {
        if (disposed) return
        const result = await new BrowserQRCodeReader().decodeFromConstraints(
          { video: { facingMode: { ideal: 'environment' } }, audio: false },
          element,
          (code, _error, active) => {
            if (disposed) {
              active.stop()
              return
            }
            if (code) {
              active.stop()
              setScanning(false)
              onReadRef.current(code.getText())
            }
          },
        )
        if (disposed) result.stop()
        else controls = result
      })
      .catch(() => {
        if (!disposed) {
          setScanning(false)
          setError(
            'Não foi possível acessar a câmera. Permita o acesso ou digite o código manualmente. A câmera exige HTTPS ou localhost.',
          )
        }
      })
    return () => {
      disposed = true
      controls?.stop()
      const stream = element.srcObject as MediaStream | null
      stream?.getTracks().forEach((track) => track.stop())
      element.srcObject = null
    }
  }, [scanning])
  return (
    <>
      <div className={styles.camera}>
        {scanning ? (
          <video
            ref={video}
            muted
            playsInline
            aria-label="Câmera para leitura do QR Code"
          />
        ) : (
          <img src={camera} alt="" />
        )}
      </div>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      <Button
        variant="secondary"
        onClick={() => {
          setError('')
          setScanning((v) => !v)
        }}
      >
        {scanning ? 'Parar câmera' : 'Ler QR Code com a câmera'}
      </Button>
    </>
  )
}
