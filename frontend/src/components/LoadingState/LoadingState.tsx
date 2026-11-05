import styles from './LoadingState.module.scss'

export function LoadingState({
  label = 'Carregando conteúdo',
  fullPage = false,
}: {
  label?: string
  fullPage?: boolean
}) {
  return (
    <output
      className={fullPage ? styles.fullPage : styles.region}
      aria-label={label}
      aria-busy="true"
    >
      <span className={styles.placeholder} aria-hidden="true">
        <span className={styles.heading} />
        <span className={styles.subtitle} />
        <span className={styles.cards}>
          <span />
          <span />
          <span />
        </span>
        <span className={styles.rows}>
          <span />
          <span />
          <span />
          <span />
        </span>
      </span>
      <span className={styles.srOnly}>{label}</span>
    </output>
  )
}
