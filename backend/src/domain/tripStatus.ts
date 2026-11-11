import { DomainError } from "../utils/serviceUtils";

export const TRIP_STATUSES = [
  "Agendada",
  "Em deslocamento",
  "Em andamento",
  "Finalizada",
  "Cancelada",
] as const;
export type TripStatus = (typeof TRIP_STATUSES)[number];

const transitions: Record<TripStatus, readonly TripStatus[]> = {
  Agendada: ["Em deslocamento", "Cancelada"],
  "Em deslocamento": ["Em andamento"],
  "Em andamento": ["Finalizada"],
  Finalizada: [],
  Cancelada: [],
};
export const TRIP_EVENTS = {
  "Em deslocamento": "ViagemIniciada",
  "Em andamento": "ViagemEmAndamento",
  Finalizada: "ViagemFinalizada",
  Cancelada: "ViagemCancelada",
} as const;

export const validateTransition = (current: string, next: TripStatus) => {
  if (!TRIP_STATUSES.includes(current as TripStatus))
    throw new DomainError(409, "A viagem possui um status não reconhecido");
  if (current === next) return false; // Reenvio não gera novo histórico/evento.
  if (!transitions[current as TripStatus].includes(next))
    throw new DomainError(
      409,
      `Não é possível alterar uma viagem de ${current} para ${next}`,
    );
  return true;
};
