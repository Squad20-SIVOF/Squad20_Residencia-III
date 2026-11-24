import { AlertTriangle, Fuel, Wrench } from 'lucide-react'
import type { AsyncResult } from '@/hooks/useAsync'
import {
  fuelService,
  money,
  monthRange,
} from '@/pages/abastecimentos/services/fuelService'
import { getAlertSummary } from '@/service/alertService'
import type { SessionUser } from '@/service/authService'
import { formatDate, formatDecimal } from '@/utils/format'

export const severity = {
  danger: { label: 'Crítica', order: 0 },
  warning: { label: 'Atenção', order: 1 },
  success: { label: 'Registrado', order: 2 },
} as const

export interface Notification {
  id: string
  tone: keyof typeof severity
  title: string
  description: string
  context: string
  icon: typeof Fuel
  to?: string | undefined
  action: string
  timestamp?: string
}

export async function loadNotifications(
  user: SessionUser,
  fuelEnabled: boolean,
  driversEnabled: boolean,
  maintenanceEnabled: boolean,
) {
  const now = new Date()
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [alerts, fuel] = await Promise.allSettled([
    user.permissoes.includes('manutencoes:ler') ? getAlertSummary() : null,
    fuelEnabled && user.permissoes.includes('abastecimentos:ler')
      ? fuelService.list(monthRange(month))
      : [],
  ])
  if (alerts.status === 'rejected' && fuel.status === 'rejected') throw alerts.reason
  const summary = alerts.status === 'fulfilled' ? alerts.value : null
  const notifications: Notification[] = []

  for (const item of summary?.cnh.itens ?? []) {
    notifications.push({
      id: `cnh-${item.id}-${item.validade_cnh}-${item.severity}`,
      tone: item.severity === 'critica' ? 'danger' : 'warning',
      title: item.dias_restantes < 0 ? 'CNH vencida' : 'CNH próxima do vencimento',
      description: `A CNH de ${item.nome} tem validade até ${formatDate(item.validade_cnh.slice(0, 10))}.`,
      context: `Motorista · ${item.nome}`,
      icon: AlertTriangle,
      to:
        driversEnabled && user.permissoes.includes('motoristas:ler')
          ? `/motoristas/${encodeURIComponent(item.id)}`
          : undefined,
      action: 'Ver motorista',
    })
  }

  for (const item of summary?.manutencao.itens ?? []) {
    notifications.push({
      id: `manutencao-${item.id}-${item.quilometragem + item.km_restantes}-${item.severity}`,
      tone: item.severity === 'critica' ? 'danger' : 'warning',
      title: item.km_restantes <= 0 ? 'Revisão pendente' : 'Revisão próxima',
      description:
        item.km_restantes <= 0
          ? `O veículo atingiu o prazo de revisão por quilometragem (${formatDecimal(Math.abs(item.km_restantes))} km além do limite).`
          : `Restam ${formatDecimal(item.km_restantes)} km até a próxima revisão.`,
      context: `Veículo · ${item.placa} · ${formatDecimal(item.quilometragem)} km`,
      icon: Wrench,
      to: maintenanceEnabled
        ? `/manutencoes?placa=${encodeURIComponent(item.placa)}`
        : undefined,
      action: 'Ver manutenção',
    })
  }

  if (fuel.status === 'fulfilled') {
    for (const item of fuel.value.slice(0, 5)) {
      const query = new URLSearchParams({ periodo: month, registro: item.id })
      const vehicle =
        item.identificacao || item.modelo || item.placa || 'Veículo removido'
      notifications.push({
        id: `abastecimento-${item.id}`,
        tone: 'success',
        title: 'Abastecimento registrado',
        description: `${formatDecimal(Number(item.litros))} L de ${item.combustivel || 'combustível'} em ${vehicle}. Total de ${money(item.valor_total)}.`,
        context: [item.motorista_nome, item.posto].filter(Boolean).join(' · '),
        icon: Fuel,
        to: `/abastecimentos?${query}`,
        action: 'Ver abastecimento',
        timestamp: item.data_abastecimento,
      })
    }
  }

  return {
    notifications: notifications.sort(
      (a, b) => severity[a.tone].order - severity[b.tone].order,
    ),
    storageKey: `sivof:notificacoes:lidas:${user.id}`,
    updatedAt: new Date().toISOString(),
    hasPartialError: alerts.status === 'rejected' || fuel.status === 'rejected',
  }
}

export type NotificationData = Awaited<ReturnType<typeof loadNotifications>>

export type NotificationFeedResult = AsyncResult<NotificationData | null>
