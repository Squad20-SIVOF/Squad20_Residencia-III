import { ArrowLeft } from 'lucide-react'
import { Link, type LinkProps } from 'react-router-dom'
import styles from './BackLink.module.scss'

type BackLinkProps = Pick<LinkProps, 'to' | 'children' | 'onClick'>

export function BackLink({ to, children, onClick }: BackLinkProps) {
  return (
    <Link to={to} onClick={onClick} className={styles.link}>
      <ArrowLeft size={16} aria-hidden="true" />
      {children}
    </Link>
  )
}
