import { describe, expect, test } from 'vitest'
import type { Maintenance } from '@/pages/manutencoes/types/maintenance'
import type { TrackedTrip } from '@/pages/requests/types'
import type { Vehicle } from '@/pages/vehicles/types'
import type { AlertSummary } from '@/service/alertService'
import {
  buildFleetAlerts,
  buildNextActions,
  buildUtilization,
  countOpenAlerts,
  describeUtilization,
  formatFleetBreakdown,
  formatSignedNumber,
  formatVariation,
  shareOfFleet,
  summarizeFleet,
  summarizeScheduledMaintenances,
  summarizeTrips,
} from './dashboardRules'

// Quarta-feira, 18/11/2026.
const TODAY = new Date(2026, 10, 18, 10, 0)

function vehicle(id: string, status: Vehicle['status']): Vehicle {
  return {
    id,
    identification: id,
    plate: `${id}-0000`,
    model: 'Modelo',
    fuelType: 'Flex',
    maxCapacity: 5,
    status,
    mileageKm: 0,
    fleet: 'SVO',
    nextInspection: '2027-01',
  }
}

function maintenance(
  id: string,
  dataServico: string,
  status: Maintenance['status'] = 'Agendada',
): Maintenance {
  return {
    id,
    vehicleId: 'v1',
    tipo: 'Preventiva',
    descricao: '',
    dataServico,
    quilometragem: 0,
    oficina: '',
    valorEstimado: 0,
    status,
    tipoProximaRevisao: 'Não definida',
    notificarRevisao: false,
    criadoEm: '',
    atualizadoEm: '',
  }
}

function trip(id: string, status: TrackedTrip['status'], delayMinutes = 0): TrackedTrip {
  return {
    id,
    routeCode: id,
    plate: `PL-${id}`,
    driverName: 'Motorista',
    origin: 'A',
    destination: 'B',
    status,
    delayMinutes,
  }
}

const ALERTS: AlertSummary = {
  cnh: {
    total: 2,
    criticas: 1,
    itens: [
      {
        id: 'c1',
        nome: 'Bruno Lima',
        validade_cnh: '2026-11-25',
        dias_restantes: 7,
        severity: 'alta',
      },
      {
        id: 'c2',
        nome: 'Ana Pereira',
        validade_cnh: '2026-09-30T00:00:00.000Z',
        dias_restantes: -49,
        severity: 'critica',
      },
    ],
  },
  manutencao: {
    total: 2,
    criticas: 1,
    itens: [
      {
        id: 'm1',
        placa: 'EFG-4H56',
        quilometragem: 30150,
        km_restantes: 800,
        severity: 'aviso',
      },
      {
        id: 'm2',
        placa: 'IJK-7L89',
        quilometragem: 88905,
        km_restantes: -150,
        severity: 'critica',
      },
    ],
  },
}

describe('frota', () => {
  const vehicles = [
    vehicle('a', 'ativo'),
    vehicle('b', 'ativo'),
    vehicle('c', 'ativo'),
    vehicle('d', 'manutencao'),
    vehicle('e', 'em_viagem'),
    vehicle('f', 'inativo'),
  ]

  test('frota ativa ignora inativos e a disponibilidade é a parte da frota ativa', () => {
    expect(summarizeFleet(vehicles)).toEqual({
      active: 5,
      available: 3,
      maintenance: 1,
      traveling: 1,
      refueling: null,
      availablePercent: 60,
    })
  })

  test('frota vazia não divide por zero', () => {
    expect(summarizeFleet([]).availablePercent).toBe(0)
    expect(shareOfFleet(3, 0)).toBe(0)
  })

  test('resumo em texto mostra "—" para abastecimento e inclui veículos em viagem', () => {
    expect(formatFleetBreakdown(summarizeFleet(vehicles))).toBe(
      '3 disponíveis · 1 em manutenção · — em abastecimento · 1 em viagem',
    )
    expect(formatFleetBreakdown(summarizeFleet([vehicle('a', 'ativo')]))).toBe(
      '1 disponível · 0 em manutenção · — em abastecimento',
    )
  })

  test('parte da frota fica entre 0 e 100', () => {
    expect(shareOfFleet(1, 4)).toBe(25)
    expect(shareOfFleet(null, 4)).toBe(0)
    expect(shareOfFleet(9, 4)).toBe(100)
  })

  test('variação com sinal', () => {
    expect(formatSignedNumber(2)).toBe('+2')
    expect(formatSignedNumber(-1)).toBe('-1')
    expect(formatSignedNumber(0)).toBe('0')
  })
})

describe('viagens', () => {
  test('em andamento exclui programadas e separa as atrasadas', () => {
    const trips = [
      trip('1', 'em_viagem'),
      trip('2', 'a_caminho'),
      trip('3', 'atrasada', 12),
      trip('4', 'programada'),
    ]
    expect(summarizeTrips(trips)).toEqual({ inProgress: 3, delayed: 1, onTime: 2 })
  })

  test('utilização calcula média, variação, escala e o dia de hoje', () => {
    const utilization = buildUtilization(
      {
        days: [
          { date: '2026-11-12', trips: 9 },
          { date: '2026-11-13', trips: 14 },
          { date: '2026-11-14', trips: 12 },
          { date: '2026-11-15', trips: 17 },
          { date: '2026-11-16', trips: 15 },
          { date: '2026-11-17', trips: 20 },
          { date: '2026-11-18', trips: 16 },
        ],
        previousWeekTotal: 95,
        dailyGoal: 15,
      },
      TODAY,
    )
    expect(utilization.weeklyTotal).toBe(103)
    expect(utilization.dailyAverage).toBeCloseTo(14.71, 2)
    expect(utilization.variationPercent).toBeCloseTo(8.42, 2)
    expect(utilization.scaleMax).toBe(20)
    expect(utilization.ticks).toEqual([0, 5, 10, 15, 20])
    expect(utilization.bars.map((bar) => bar.dayLabel)).toEqual([
      'Qui',
      'Sex',
      'Sáb',
      'Dom',
      'Seg',
      'Ter',
      'Qua',
    ])
    expect(utilization.bars.filter((bar) => bar.isToday).map((bar) => bar.date)).toEqual([
      '2026-11-18',
    ])
    expect(describeUtilization(utilization)).toContain('quarta-feira (hoje): 16 viagens')
  })

  test('escala acomoda a meta mesmo quando nenhum dia a alcança', () => {
    const utilization = buildUtilization(
      { days: [{ date: '2026-11-18', trips: 1 }], previousWeekTotal: 0, dailyGoal: 23 },
      TODAY,
    )
    expect(utilization.scaleMax).toBe(24)
    expect(utilization.variationPercent).toBe(0)
  })

  test('variação em porcentagem com uma casa', () => {
    expect(formatVariation(8.42)).toBe('+8,4%')
    expect(formatVariation(-3)).toBe('-3%')
    expect(formatVariation(0)).toBe('0%')
  })
})

describe('manutenções agendadas', () => {
  test('conta só as agendadas a partir de hoje, as de hoje e as até sexta', () => {
    const items = [
      maintenance('1', '2026-11-18'),
      maintenance('2', '2026-11-20'),
      maintenance('3', '2026-11-23'),
      maintenance('4', '2026-11-10'),
      maintenance('5', '2026-11-19', 'Concluída'),
    ]
    expect(summarizeScheduledMaintenances(items, TODAY)).toEqual({
      scheduled: 3,
      today: 1,
      untilFriday: 1,
    })
  })

  test('na sexta, "até sexta" passa a ser a sexta seguinte', () => {
    const friday = new Date(2026, 10, 20)
    const items = [maintenance('1', '2026-11-20'), maintenance('2', '2026-11-27')]
    expect(summarizeScheduledMaintenances(items, friday)).toEqual({
      scheduled: 2,
      today: 1,
      untilFriday: 1,
    })
  })
})

describe('alertas', () => {
  test('total e críticos somam CNH e manutenção', () => {
    expect(countOpenAlerts(ALERTS)).toEqual({ total: 4, critical: 2 })
  })

  test('lista começa pelos críticos e traduz a severidade em selo e destino', () => {
    const alerts = buildFleetAlerts(ALERTS)
    expect(alerts.map((alert) => [alert.title, alert.badgeLabel, alert.to])).toEqual([
      ['CNH vencida', 'Crítico', '/motoristas'],
      ['Manutenção atrasada', 'Crítico', '/manutencoes'],
      ['CNH vence em 7 dias', 'Hoje', '/motoristas'],
      ['Manutenção próxima', 'Revisar', '/manutencoes'],
    ])
    expect(alerts[0]?.detail).toBe('Ana Pereira · venceu em 30/09/2026')
    expect(alerts[1]?.detail).toBe('IJK-7L89 · 150 km além da revisão prevista')
    expect(alerts[3]?.detail).toBe('EFG-4H56 · faltam 800 km para a revisão')
  })

  test('sem alertas, a lista fica vazia', () => {
    const empty: AlertSummary = {
      cnh: { total: 0, criticas: 0, itens: [] },
      manutencao: { total: 0, criticas: 0, itens: [] },
    }
    expect(buildFleetAlerts(empty)).toEqual([])
    expect(countOpenAlerts(empty)).toEqual({ total: 0, critical: 0 })
  })
})

describe('próximas ações', () => {
  test('críticos primeiro, depois viagens atrasadas, limitado a 3', () => {
    const actions = buildNextActions(ALERTS, [trip('103', 'atrasada', 12)])
    expect(actions.map((action) => [action.text, action.to])).toEqual([
      ['Revisar CNH de Ana Pereira antes da próxima viagem', '/motoristas'],
      ['Agendar a revisão do IJK-7L89', '/manutencoes'],
      ['Acompanhar a rota 103 (PL-103), atrasada 12 min', '/viagens'],
    ])
  })

  test('sem alertas nem atrasos, não há ações', () => {
    expect(buildNextActions(null, [trip('1', 'em_viagem')])).toEqual([])
  })
})
