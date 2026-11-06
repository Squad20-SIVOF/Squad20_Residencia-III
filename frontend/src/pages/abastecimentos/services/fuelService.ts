import { api } from '@/service/api'
export interface FuelInput {
  veiculo_id: string
  motorista_id: string
  data_abastecimento: string
  combustivel: string
  posto: string
  litros: number
  preco_litro: number
  km_momento_abastecimento: number
}
export interface FuelRecord extends Omit<
  FuelInput,
  'litros' | 'preco_litro' | 'combustivel' | 'posto'
> {
  id: string
  litros: string | number
  preco_litro: string | number | null
  combustivel: string | null
  posto: string | null
  valor_total: string | number
  alerta_teto_excedido: boolean
  placa: string | null
  modelo: string | null
  identificacao: string | null
  motorista_nome: string | null
  teto_gasto_mensal: string | number | null
}
export interface FuelVehicle {
  id: string
  identificacao: string | null
  placa: string
  modelo: string
  quilometragem: number
  tipo_combustivel: string
  capacidade_maxima: number
  teto_gasto_mensal: string | number | null
  frota: string | null
}
export const fuelService = {
  async list(
    filters: { veiculo_id?: string; data_inicio?: string; data_fim?: string } = {},
  ) {
    const query = new URLSearchParams(Object.entries(filters).filter(([, v]) => !!v))
    return (await api<{ message: FuelRecord[] }>(`/abastecimentos?${query}`)).message
  },
  async get(id: string) {
    return (
      await api<{ message: FuelRecord }>(`/abastecimentos/${encodeURIComponent(id)}`)
    ).message
  },
  async ownOptions() {
    return (
      await api<{
        message: { veiculos: FuelVehicle[]; motoristas: { id: string; nome: string }[] }
      }>('/motorista/abastecimentos/opcoes')
    ).message
  },
  async ownSpent(vehicle: string, month: string) {
    const query = new URLSearchParams({ ...monthRange(month), veiculo_id: vehicle })
    return (
      await api<{ message: { total: number } }>(
        `/motorista/abastecimentos/resumo?${query}`,
      )
    ).message.total
  },
  async saveOwn(input: FuelInput) {
    const { motorista_id: _driver, ...body } = input
    return (
      await api<{ message: FuelRecord }>('/motorista/abastecimentos', {
        method: 'POST',
        body: JSON.stringify(body),
      })
    ).message
  },
  async options() {
    return (
      await api<{
        message: { veiculos: FuelVehicle[]; motoristas: { id: string; nome: string }[] }
      }>('/abastecimentos/opcoes')
    ).message
  },
  async save(input: FuelInput, id?: string) {
    return (
      await api<{ message: FuelRecord }>(
        id ? `/abastecimentos/${encodeURIComponent(id)}` : '/abastecimentos',
        { method: id ? 'PUT' : 'POST', body: JSON.stringify(input) },
      )
    ).message
  },
  async remove(id: string) {
    await api(`/abastecimentos/${encodeURIComponent(id)}`, { method: 'DELETE' })
  },
}
export function monthRange(month: string) {
  const [year = 0, number = 1] = month.split('-').map(Number)
  return {
    data_inicio: `${month}-01`,
    data_fim: `${month}-${new Date(year, number, 0).getDate()}`,
  }
}
export const money = (value: number | string) =>
  Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function calculateFuelTotal(liters: number, price: number) {
  return Math.round((Math.round(liters * 100) * Math.round(price * 10000)) / 10000) / 100
}
