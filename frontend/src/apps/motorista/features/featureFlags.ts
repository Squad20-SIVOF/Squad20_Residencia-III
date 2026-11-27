export type FeatureFlags = Record<string, boolean>

export type FeatureApp = 'gestor' | 'motorista'

export interface FeatureFlagDefinition {
  key: string
  label: string
  description: string
  defaultValue: boolean
  status: 'disponivel' | 'em_desenvolvimento'
}

export const FEATURE_FLAG_REGISTRY: Record<FeatureApp, FeatureFlagDefinition[]> = {
  gestor: [
    {
      key: 'gestor_dashboard',
      label: 'Painel inicial',
      description: 'Resumo da operação e indicadores.',
      defaultValue: true,
      status: 'disponivel',
    },
    {
      key: 'gestor_veiculos',
      label: 'Veículos',
      description: 'Cadastro e consulta da frota.',
      defaultValue: true,
      status: 'disponivel',
    },
    {
      key: 'gestor_motoristas',
      label: 'Motoristas',
      description: 'Cadastro e consulta de motoristas.',
      defaultValue: true,
      status: 'disponivel',
    },
    {
      key: 'gestor_abastecimentos',
      label: 'Abastecimentos',
      description: 'Registros e despesas de combustível.',
      defaultValue: true,
      status: 'disponivel',
    },
    {
      key: 'gestor_manutencoes',
      label: 'Manutenções',
      description: 'Ordens e histórico de manutenção.',
      defaultValue: true,
      status: 'disponivel',
    },
    {
      key: 'gestor_viagens',
      label: 'Viagens',
      description: 'Solicitações e painel de viagens.',
      defaultValue: true,
      status: 'disponivel',
    },
    {
      key: 'gestor_route_monitoring',
      label: 'Monitoramento de rotas',
      description: 'Mapa e lista de deslocamentos demonstrativos.',
      defaultValue: true,
      status: 'disponivel',
    },
    {
      key: 'gestor_route_details',
      label: 'Detalhes da rota',
      description: 'Dados de solicitante, motorista e trajeto demonstrativos.',
      defaultValue: true,
      status: 'disponivel',
    },
    {
      key: 'gestor_relatorios',
      label: 'Relatórios',
      description: 'Consultas e exportação de relatórios.',
      defaultValue: true,
      status: 'em_desenvolvimento',
    },
    {
      key: 'gestor_usuarios',
      label: 'Usuários e permissões',
      description: 'Gerenciamento de contas e acessos.',
      defaultValue: true,
      status: 'disponivel',
    },
    {
      key: 'gestor_notificacoes',
      label: 'Notificações',
      description: 'Alertas ativos de CNH e manutenção.',
      defaultValue: true,
      status: 'disponivel',
    },
    {
      key: 'gestor_svo',
      label: 'Atendimento SVO',
      description: 'Fluxo completo de atendimento SVO.',
      defaultValue: false,
      status: 'em_desenvolvimento',
    },
  ],
  motorista: [
    {
      key: 'motorista_login',
      label: 'Login',
      description: 'Autenticação do motorista.',
      defaultValue: true,
      status: 'disponivel',
    },
    {
      key: 'motorista_vinculo_veiculo',
      label: 'Vínculo de veículo',
      description: 'Identificação do veículo por sessão/QR Code.',
      defaultValue: true,
      status: 'disponivel',
    },
    {
      key: 'motorista_viagens',
      label: 'Minhas viagens',
      description: 'Consulta e execução de viagens atribuídas.',
      defaultValue: true,
      status: 'disponivel',
    },
    {
      key: 'motorista_checklist',
      label: 'Checklist',
      description: 'Checklist operacional do veículo.',
      defaultValue: true,
      status: 'disponivel',
    },
    {
      key: 'motorista_abastecimento',
      label: 'Abastecimento',
      description: 'Registro de abastecimento pelo motorista.',
      defaultValue: true,
      status: 'disponivel',
    },
    {
      key: 'motorista_perfil',
      label: 'Perfil',
      description: 'Dados e preferências da conta.',
      defaultValue: true,
      status: 'disponivel',
    },
    {
      key: 'gps_event_simulator',
      label: 'Simulador GPS por eventos',
      description: 'Simulação de rota e eventos GPS para desenvolvimento.',
      defaultValue: false,
      status: 'disponivel',
    },
    {
      key: 'motorista_historico',
      label: 'Histórico de viagens',
      description: 'Consulta consolidada de viagens anteriores.',
      defaultValue: false,
      status: 'em_desenvolvimento',
    },
    {
      key: 'motorista_notificacoes',
      label: 'Notificações',
      description: 'Avisos em tempo real sobre viagens e ocorrências.',
      defaultValue: false,
      status: 'em_desenvolvimento',
    },
  ],
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = Object.fromEntries(
  Object.values(FEATURE_FLAG_REGISTRY)
    .flat()
    .map(({ key, defaultValue }) => [key, defaultValue]),
)

const STORAGE_KEY = 'frotamanager.dev.feature-flags'
const CHANGE_EVENT = 'frotamanager:feature-flags-change'
const FLAG_KEY_PATTERN = /^[a-z][a-z0-9_]{1,63}$/

export function isDevFeatureFlagsEnabled(): boolean {
  if (import.meta.env.DEV) return true
  if (typeof window === 'undefined') return false

  const hostname = window.location.hostname
  return hostname.startsWith('dev.') && hostname.endsWith('.pages.dev')
}

function isValidFlags(value: unknown): value is FeatureFlags {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.entries(value).every(
      ([key, enabled]) => FLAG_KEY_PATTERN.test(key) && typeof enabled === 'boolean',
    )
  )
}

export function getDevFeatureFlags(): FeatureFlags {
  if (!isDevFeatureFlagsEnabled() || typeof localStorage === 'undefined') {
    return { ...DEFAULT_FEATURE_FLAGS }
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return { ...DEFAULT_FEATURE_FLAGS }

    const parsed: unknown = JSON.parse(stored)
    return isValidFlags(parsed)
      ? { ...DEFAULT_FEATURE_FLAGS, ...parsed }
      : { ...DEFAULT_FEATURE_FLAGS }
  } catch {
    return { ...DEFAULT_FEATURE_FLAGS }
  }
}

export function getFeatureRegistry(app: FeatureApp): FeatureFlagDefinition[] {
  return FEATURE_FLAG_REGISTRY[app]
}

export function getAppFeatureFlags(app: FeatureApp): FeatureFlags {
  const flags = getDevFeatureFlags()
  return Object.fromEntries(
    FEATURE_FLAG_REGISTRY[app].map(({ key, defaultValue }) => [
      key,
      flags[key] ?? defaultValue,
    ]),
  )
}

export function saveDevFeatureFlags(flags: FeatureFlags): void {
  if (!isDevFeatureFlagsEnabled()) {
    throw new Error('A edição de feature flags está disponível apenas em ambientes dev.')
  }
  if (!isValidFlags(flags)) {
    throw new Error('Use nomes de flags válidos e valores booleanos true ou false.')
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(flags))
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function resetDevFeatureFlags(): void {
  if (!isDevFeatureFlagsEnabled()) return
  localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function subscribeFeatureFlags(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}
