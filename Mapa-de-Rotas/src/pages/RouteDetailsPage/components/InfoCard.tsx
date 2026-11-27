import type { ReactNode } from 'react'
import styles from './InfoCard.module.scss'

interface InfoRow { label: string; value: ReactNode }
interface InfoCardProps { title: string; rows?: InfoRow[]; children?: ReactNode }

export function InfoCard({ title, rows, children }: InfoCardProps) {
  return (
    <section className={styles.card}>
      <h2 className={styles.title}>{title}</h2>
      {rows && <dl className={styles.rows}>{rows.map((row) => <div className={styles.row} key={row.label}><dt>{row.label}:</dt><dd>{row.value}</dd></div>)}</dl>}
      {children}
    </section>
  )
}
