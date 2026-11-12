import { useEffect, useState } from 'react'
import { Button } from '@/components/Button'
import { currentUser } from '@/service/authService'
import { vehicleQrPayload } from '@/utils/vehicleQr'
export function VehicleQrPrintButton({
  id,
  plate,
  model,
}: {
  id: string
  plate: string
  model: string
}) {
  const [allowed, setAllowed] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    currentUser()
      .then((user) => {
        if (active) setAllowed(user.permissoes.includes('veiculos:gerenciar'))
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])
  async function generate() {
    setError('')
    const sheet = window.open('', '_blank')
    if (!sheet) {
      setError('Permita abrir a etiqueta em uma nova janela.')
      return
    }
    sheet.opener = null
    try {
      const qr = await import('qrcode')
      const image = await qr.toDataURL(vehicleQrPayload(id), {
        width: 720,
        margin: 4,
        errorCorrectionLevel: 'M',
      })
      const doc = sheet.document
      doc.title = `Etiqueta do veículo ${plate}`
      const style = doc.createElement('style')
      style.textContent =
        'body{font-family:Arial,sans-serif;text-align:center;margin:24px;color:#000}img{width:80mm;max-width:100%;height:auto}h1{font-size:28px}p{font-size:18px}button{padding:12px;font-size:16px}@media print{button{display:none}@page{size:A4;margin:15mm}}'
      doc.head.append(style)
      const title = doc.createElement('h1')
      title.textContent = 'SIVOF · Veículo'
      const subtitle = doc.createElement('p')
      subtitle.textContent = `${model} · ${plate}`
      const img = doc.createElement('img')
      img.src = image
      img.alt = `QR Code do veículo ${plate}`
      const code = doc.createElement('p')
      code.textContent = id
      const note = doc.createElement('p')
      note.textContent =
        'Leia pelo aplicativo do motorista. Esta etiqueta identifica o veículo e não concede acesso.'
      const button = doc.createElement('button')
      button.textContent = 'Imprimir / salvar como PDF'
      button.onclick = () => sheet.print()
      doc.body.append(title, subtitle, img, code, note, button)
    } catch {
      sheet.close()
      setError('Não foi possível gerar a etiqueta. Tente novamente.')
    }
  }
  if (!allowed) return null
  return (
    <div>
      <Button variant="secondary" onClick={() => void generate()}>
        Gerar QR Code para impressão
      </Button>
      {error && <p role="alert">{error}</p>}
    </div>
  )
}
