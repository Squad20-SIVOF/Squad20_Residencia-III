export type VehicleStatus = 'Disponível' | 'Em uso' | 'Em manutenção' | 'Inativo'

export interface Vehicle {
  id: string
  codigo: string
  placa: string
  marca: string
  modelo: string
  quilometragem: number
  status: VehicleStatus
}
