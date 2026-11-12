import { expect, test } from 'vitest'
import { readVehicleQr, vehicleQrPayload } from './vehicleQr'
test('etiqueta gerada pode ser lida sem conter credencial ou URL executável', () => {
  const id = '30000000-0000-4000-8000-000000000001'
  expect(readVehicleQr(vehicleQrPayload(id))).toBe(id)
  expect(readVehicleQr(id)).toBe(id)
  for (const invalid of [
    'javascript:alert(1)',
    'https://example.com/' + id,
    'sivof:veiculo:v2:' + id,
    '',
  ])
    expect(() => readVehicleQr(invalid)).toThrow('QR inválido')
})
