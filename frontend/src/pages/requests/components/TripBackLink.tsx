import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import styles from './TripBackLink.module.scss'

interface TripBackLinkProps {
  to?: string
  children?: string
}

export function TripBackLink({
  to = '/viagens',
  children = 'Voltar para o Painel de Viagens',
}: TripBackLinkProps) {
  return (
    <Link to={to} className={styles.link}>
      <ArrowLeft size={16} aria-hidden="true" />
      {children}
    </Link>
  )
}
