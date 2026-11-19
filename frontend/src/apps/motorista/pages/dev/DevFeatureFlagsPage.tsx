import { useState } from 'react'
import { Button } from '@/components/Button'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import {
  DEFAULT_FEATURE_FLAGS,
  getDevFeatureFlags,
  resetDevFeatureFlags,
  saveDevFeatureFlags,
  type FeatureFlags,
} from '../../features/featureFlags'
import { useFeatureFlags } from '../../features/useFeatureFlags'
import styles from './DevFeatureFlagsPage.module.scss'

export function DevFeatureFlagsPage() {
  useDocumentTitle('Feature flags de desenvolvimento')
  const currentFlags = useFeatureFlags()
  const [json, setJson] = useState(() => JSON.stringify(getDevFeatureFlags(), null, 2))
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  function applyJson() {
    setError('')
    setSaved(false)
    try {
      const parsed: unknown = JSON.parse(json)
      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        Array.isArray(parsed) ||
        Object.values(parsed).some((value) => typeof value !== 'boolean')
      ) {
        throw new Error('O JSON deve ser um objeto com valores true ou false.')
      }
      saveDevFeatureFlags(parsed as FeatureFlags)
      setJson(JSON.stringify(getDevFeatureFlags(), null, 2))
      setSaved(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'JSON inválido.')
    }
  }

  function restoreDefaults() {
    resetDevFeatureFlags()
    setJson(JSON.stringify(DEFAULT_FEATURE_FLAGS, null, 2))
    setError('')
    setSaved(true)
  }

  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-labelledby="flags-title">
        <p className={styles.eyebrow}>Somente neste navegador · ambiente local</p>
        <h1 id="flags-title">Feature flags</h1>
        <p className={styles.description}>
          Altere o JSON e salve para ativar ou desativar recursos durante o
          desenvolvimento. As flags não são enviadas ao backend.
        </p>

        <div className={styles.flagStatus}>
          <span
            className={
              currentFlags.gps_event_simulator ? styles.enabled : styles.disabled
            }
          />
          <strong>gps_event_simulator</strong>
          <span>{currentFlags.gps_event_simulator ? 'Ativada' : 'Desativada'}</span>
        </div>

        <label className={styles.label} htmlFor="feature-flags-json">
          Configuração JSON
        </label>
        <textarea
          id="feature-flags-json"
          className={styles.editor}
          spellCheck={false}
          value={json}
          onChange={(event) => setJson(event.target.value)}
        />
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        {saved && <output className={styles.success}>Configuração salva.</output>}

        <div className={styles.actions}>
          <Button onClick={applyJson}>Salvar configuração</Button>
          <Button variant="secondary" onClick={restoreDefaults}>
            Restaurar padrão
          </Button>
        </div>

        <p className={styles.hint}>
          Exemplo: <code>{'{ "gps_event_simulator": true }'}</code>
        </p>
      </section>
    </main>
  )
}
