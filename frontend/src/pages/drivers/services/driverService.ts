import { api } from '@/service/api'
import type { Driver, DriverInput, CnhCategory, DriverStatus } from '../types'

interface DriverResponse {
  id: string
  nome: string
  telefone?: string | null
  email?: string | null
  foto?: string | null
  cpf: string
  cnh: string
  categoria: CnhCategory
  validade_cnh: string
  frota?: Driver['fleet'] | null
  veiculos?: string[]
  motorista_coringa: boolean
  status: string
  ativo: boolean
  criado_em: string
}
const toDriver = (row: DriverResponse): Driver => ({
  id: row.id,
  name: row.nome,
  cpf: row.cpf,
  cnh: row.cnh,
  cnhCategory: row.categoria,
  cnhExpiry: row.validade_cnh,
  isWildcard: row.motorista_coringa,
  createdAt: row.criado_em,
  status: !row.ativo
    ? 'bloqueado'
    : ['ativo', 'em_viagem', 'ferias', 'bloqueado'].includes(row.status)
      ? (row.status as DriverStatus)
      : 'ativo',
  phone: row.telefone ?? '',
  email: row.email ?? '',
  ...(row.foto ? { photo: row.foto } : {}),
  fleet: row.frota ?? '',
  vehicles: row.veiculos ?? [],
})
const toBody = (input: DriverInput) => ({
  nome: input.name,
  telefone: input.phone || null,
  email: input.email || null,
  foto: input.photo ?? null,
  cpf: input.cpf,
  cnh: input.cnh,
  categoria: input.cnhCategory,
  validade_cnh: input.cnhExpiry,
  motorista_coringa: input.isWildcard,
  frota: input.fleet || null,
  veiculos: input.vehicles,
})
export async function getDrivers(): Promise<Driver[]> {
  return (await api<{ message: DriverResponse[] }>('/drivers')).message.map(toDriver)
}
export async function getDriver(id: string): Promise<Driver> {
  return toDriver(
    (await api<{ message: DriverResponse }>(`/drivers/${encodeURIComponent(id)}`))
      .message,
  )
}
export async function createDriver(input: DriverInput): Promise<Driver> {
  return toDriver(
    (
      await api<{ message: DriverResponse }>('/drivers', {
        method: 'POST',
        body: JSON.stringify(toBody(input)),
      })
    ).message,
  )
}
export async function updateDriver(id: string, input: DriverInput): Promise<Driver> {
  return toDriver(
    (
      await api<{ message: DriverResponse }>(`/drivers/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(toBody(input)),
      })
    ).message,
  )
}
export async function deleteDriver(id: string): Promise<void> {
  await api(`/drivers/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
