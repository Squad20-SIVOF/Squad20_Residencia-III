import { useEffect, useState } from 'react'
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

/** Se o usuário logado pode atribuir veículo e motorista (falso enquanto carrega ou em erro). */
export function useCanAssignTrip(): boolean {
  const [canAssign, setCanAssign] = useState(false)

  useEffect(() => {
    let isActive = true
    void loadCanAssign().then((allowed) => {
      if (isActive) setCanAssign(allowed)
    })
    return () => {
      isActive = false
    }
  }, [])

  return canAssign
}
