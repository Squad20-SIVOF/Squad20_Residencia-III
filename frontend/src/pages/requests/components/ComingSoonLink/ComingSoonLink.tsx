import { classNames } from '@/utils/classNames'
import styles from './ComingSoonLink.module.scss'

export interface ComingSoonLinkProps {
  label: string
  className?: string
}

/**
 * Link para uma tela que ainda não existe (ex.: Mapa de Rotas): aparece no lugar
 * certo, mas desabilitado e com "Em breve", sem destino para não levar a uma página
 * quebrada. Continua focável para o leitor de tela anunciar que está indisponível.
 */
export function ComingSoonLink({ label, className }: ComingSoonLinkProps) {
  return (
    <span
      // Link desabilitado (padrão WAI-ARIA): um <a> sem href não é aceito pelo lint.
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
      role="link"
      aria-disabled="true"
      tabIndex={0}
      className={classNames(styles.link, className)}
    >
      {label} <span className={styles.soon}>Em breve</span>
    </span>
  )
}
