export interface User {
  id: string
  nome: string
  email: string
  motorista_id?: string | null
  perfis?: { id: string; nome: string }[]
  permissoes?: string[]
}

export interface Delegation {
  usuarios: User[]
  permissoesDisponiveis: string[]
}
