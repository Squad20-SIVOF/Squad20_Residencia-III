import styles from './BrandPanel.module.scss'

export function BrandPanel() {
  return (
    <aside className={styles.root} aria-label="SIVOF Manager">
      <div className={styles.top}>
        <div className={styles.gradient} aria-hidden="true" />
        <div className={styles.brand}>
          <span className={styles.logo} aria-hidden="true">
            SM
          </span>
          <div className={styles.brandText}>
            <p className={styles.product}>SIVOF Manager</p>
            <p className={styles.tagline}>Gestão de Frota · FSPH</p>
          </div>
        </div>
      </div>

      <div className={styles.hero}>
        <p className={styles.eyebrow}>
          <span className={styles.dot} aria-hidden="true" />
          Operação de frota · FSPH
        </p>
        <p className={styles.title}>
          Controle claro para cada veículo, motorista e viagem.
        </p>
        <p className={styles.lead}>
          Acompanhe solicitações, rotas, abastecimentos e manutenção em uma operação
          segura e integrada.
        </p>
      </div>

      <p className={styles.secure}>
        <svg
          className={styles.shield}
          viewBox="0 0 20 20"
          width="16"
          height="16"
          aria-hidden="true"
          focusable="false"
        >
          <path
            fill="currentColor"
            d="M10 1.5 3.5 4v5.2c0 4.1 2.7 7.8 6.5 9.3 3.8-1.5 6.5-5.2 6.5-9.3V4L10 1.5Zm-.2 11.2-2.8-2.8.9-.9 1.9 1.9 3.7-3.7.9.9-4.6 4.6Z"
          />
        </svg>
        Ambiente institucional protegido
      </p>
    </aside>
  )
}
