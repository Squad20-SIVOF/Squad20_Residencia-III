import type { WeeklyTrips } from '../types'
import { toIsoDate } from '../utils/dashboardRules'

/*
 * DADOS DEMONSTRATIVOS. O backend ainda não guarda o histórico diário de viagens
 * nem a disponibilidade da frota de dias anteriores. Estas funções devolvem
 * valores de exemplo com a assinatura planejada, e a tela avisa que são exemplos.
 * Para integrar, troque o corpo de cada função pela chamada à API, mantendo o tipo.
 */

const MOCK_DELAY_MS = 300

/** Viagens realizadas por dia, do dia mais antigo (há 6 dias) até hoje. */
const DEMO_DAILY_TRIPS = [9, 14, 12, 17, 15, 20, 16]
const DEMO_PREVIOUS_WEEK_TOTAL = 95
const DEMO_DAILY_GOAL = 15
const DEMO_AVAILABLE_VS_YESTERDAY = 2

function delay<T>(data: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), MOCK_DELAY_MS))
}

/** GET /viagens/historico?dias=7 (demonstrativo) */
export function getWeeklyTrips(today: Date = new Date()): Promise<WeeklyTrips> {
  const days = DEMO_DAILY_TRIPS.map((trips, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    date.setDate(date.getDate() - (DEMO_DAILY_TRIPS.length - 1 - index))
    return { date: toIsoDate(date), trips }
  })
  return delay({
    days,
    previousWeekTotal: DEMO_PREVIOUS_WEEK_TOTAL,
    dailyGoal: DEMO_DAILY_GOAL,
  })
}

/** GET /veiculos/disponibilidade/variacao (demonstrativo) */
export function getAvailableVsYesterday(): Promise<number> {
  return delay(DEMO_AVAILABLE_VS_YESTERDAY)
}
