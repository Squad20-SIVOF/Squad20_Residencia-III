export type DriverTripStatus =
  'Agendada' | 'Em deslocamento' | 'Em andamento' | 'Finalizada' | 'Cancelada'
export interface DriverVehicle {
  id: string
  placa: string
  modelo: string
  identificacao: string | null
  quilometragem: number
  tipo_combustivel: string
}
export interface DriverTrip extends Omit<DriverVehicle, 'id'> {
  id: string
  veiculo_id: string
  motorista_id: string
  status: DriverTripStatus
  km_inicial: number | null
  km_final: number | null
  data_inicio: string | null
  data_fim: string | null
  data_necessidade: string | null
  criado_em: string
  categoria: string | null
  flag_urgencia: boolean | null
}
export interface DriverHomeData {
  motorista: { id: string; nome: string }
  veiculos: DriverVehicle[]
  viagem: DriverTrip | null
}
export interface DriverTripPage {
  dados: DriverTrip[]
  total: number
  pagina: number
  limite: number
}
export type CaptureType = 'inicio' | 'fim'
