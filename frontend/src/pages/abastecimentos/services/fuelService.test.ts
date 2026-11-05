import { beforeEach, expect, test, vi } from 'vitest'
import { api } from '@/service/api'
import { fuelService, monthRange, calculateFuelTotal } from './fuelService'
vi.mock('@/service/api', () => ({ api: vi.fn<typeof api>() }))
beforeEach(() => vi.resetAllMocks())
const input = {
  veiculo_id: 'vehicle',
  motorista_id: 'driver',
  data_abastecimento: '2026-11-05T12:00:00-03:00',
  combustivel: 'Diesel',
  posto: 'Posto',
  litros: 10,
  preco_litro: 6.1234,
  km_momento_abastecimento: 100,
}
test('cadastro mobile deixa a identificação do motorista para a sessão autenticada', async () => {
  vi.mocked(api).mockResolvedValue({ message: { id: 'fuel' } })
  await fuelService.saveOwn(input)
  const [path, options] = vi.mocked(api).mock.calls[0]!
  expect(path).toBe('/motorista/abastecimentos')
  const body = JSON.parse(options!.body as string)
  expect(body.motorista_id).toBeUndefined()
  expect(body.valor_total).toBeUndefined()
  expect(body.preco_litro).toBe(6.1234)
})
test('gestor envia o motorista escolhido e usa PUT na edição', async () => {
  vi.mocked(api).mockResolvedValue({ message: { id: 'fuel' } })
  await fuelService.save(input, 'fuel/id')
  expect(api).toHaveBeenCalledWith('/abastecimentos/fuel%2Fid', {
    method: 'PUT',
    body: JSON.stringify(input),
  })
})
test('filtros usam dias completos e respeitam fevereiro bissexto', () => {
  expect(monthRange('2028-02')).toEqual({
    data_inicio: '2028-02-01',
    data_fim: '2028-02-29',
  })
  expect(monthRange('2026-11')).toEqual({
    data_inicio: '2026-11-01',
    data_fim: '2026-11-30',
  })
})
test('erro de gravação é propagado para a tela sem simular sucesso', async () => {
  vi.mocked(api).mockRejectedValue(new Error('Sem permissão'))
  await expect(fuelService.saveOwn(input)).rejects.toThrow('Sem permissão')
})

test('prévia arredonda meio centavo como o servidor', () => {
  expect(calculateFuelTotal(1, 1.005)).toBe(1.01)
})
