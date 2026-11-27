import { useAsync } from '@/hooks/useAsync'
import { currentUser } from '@/service/authService'

// Atribuir veículo e motorista cria a viagem: exige a permissão de gerenciar viagens.
const ASSIGN_PERMISSION = 'viagens:gerenciar'

async function loadCanAssign(): Promise<boolean> {
  try {
    const user = await currentUser()
    return user.permissoes.includes(ASSIGN_PERMISSION)
  } catch {
    return false
  }
}

/** Disponibilidade da ação de atribuição para o usuário logado. */
export function useCanAssignTrip() {
  return useAsync(loadCanAssign)
}
