const prefix = 'sivof:veiculo:v1:'
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
export const vehicleQrPayload = (id: string) => `${prefix}${id}`
export function readVehicleQr(value: string): string {
  const id = value.trim().startsWith(prefix)
    ? value.trim().slice(prefix.length)
    : value.trim()
  if (!uuid.test(id))
    throw new Error('QR inválido. Use a etiqueta de veículo gerada pelo gestor.')
  return id
}
