export type FeatureFlags = Record<string, boolean>

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  gps_event_simulator: false,
}

const STORAGE_KEY = 'frotamanager.dev.feature-flags'
const CHANGE_EVENT = 'frotamanager:feature-flags-change'
const FLAG_KEY_PATTERN = /^[a-z][a-z0-9_]{1,63}$/

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
  if (!import.meta.env.DEV || typeof localStorage === 'undefined') {
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

export function saveDevFeatureFlags(flags: FeatureFlags): void {
  if (!import.meta.env.DEV) {
    throw new Error('A edição de feature flags está disponível apenas no ambiente local.')
  }
  if (!isValidFlags(flags)) {
    throw new Error('Use nomes de flags válidos e valores booleanos true ou false.')
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(flags))
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function resetDevFeatureFlags(): void {
  if (!import.meta.env.DEV) return
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
