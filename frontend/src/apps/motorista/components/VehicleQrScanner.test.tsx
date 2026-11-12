import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { VehicleQrScanner } from './VehicleQrScanner'
const { decode, stop } = vi.hoisted(() => ({
  decode: vi.fn<(...args: unknown[]) => Promise<{ stop: () => void }>>(),
  stop: vi.fn<() => void>(),
}))
vi.mock('@zxing/browser', () => ({
  BrowserQRCodeReader: class {
    decodeFromConstraints = decode
  },
}))
test('encerra a câmera ao sair da tela', async () => {
  decode.mockResolvedValue({ stop })
  const view = render(<VehicleQrScanner onRead={vi.fn<(code: string) => void>()} />)
  await userEvent.click(screen.getByRole('button', { name: 'Ler QR Code com a câmera' }))
  await waitFor(() => expect(decode).toHaveBeenCalled())
  view.unmount()
  expect(stop).toHaveBeenCalled()
})
