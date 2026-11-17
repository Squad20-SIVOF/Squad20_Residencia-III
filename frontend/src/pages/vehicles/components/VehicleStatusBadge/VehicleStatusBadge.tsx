import type { ReactNode } from 'react'
import { Badge } from '@/components/Badge'
import type { BadgeVariant } from '@/components/Badge'
import type { VehicleStatus } from '../../types'

export const VEHICLE_STATUS_LABEL: Record<VehicleStatus, string> = {
  ativo: 'Ativo',
  manutencao: 'Manutenção',
  em_viagem: 'Em viagem',
  inativo: 'Inativo',
}

/** Rótulos da tela de detalhes: situação do cadastro e disponibilidade para viagens. */
export const VEHICLE_SITUATION_LABEL: Record<VehicleStatus, string> = {
  ativo: 'Ativo · Disponível',
  manutencao: 'Ativo · Em manutenção',
  em_viagem: 'Ativo · Em viagem',
  inativo: 'Inativo · Fora de serviço',
}

export const VEHICLE_AVAILABILITY_LABEL: Record<VehicleStatus, string> = {
  ativo: 'Disponível',
  manutencao: 'Em manutenção',
  em_viagem: 'Em viagem',
  inativo: 'Indisponível',
}

export const VEHICLE_STATUS_VARIANT: Record<VehicleStatus, BadgeVariant> = {
  ativo: 'success',
  manutencao: 'warning',
  em_viagem: 'info',
  inativo: 'danger',
}

export interface VehicleStatusBadgeProps {
  status: VehicleStatus
  /** "status" (lista), "situation" (cartão escuro) ou "availability" (resumo). */
  labelSet?: 'status' | 'situation' | 'availability'
  iconStart?: ReactNode
  className?: string
}

const LABEL_SETS = {
  status: VEHICLE_STATUS_LABEL,
  situation: VEHICLE_SITUATION_LABEL,
  availability: VEHICLE_AVAILABILITY_LABEL,
}

export function VehicleStatusBadge({
  status,
  labelSet = 'status',
  iconStart,
  className,
}: VehicleStatusBadgeProps) {
  return (
    <Badge variant={VEHICLE_STATUS_VARIANT[status]} className={className}>
      {iconStart}
      {LABEL_SETS[labelSet][status]}
    </Badge>
  )
}
