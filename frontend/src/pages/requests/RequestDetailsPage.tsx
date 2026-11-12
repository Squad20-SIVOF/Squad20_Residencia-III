import { Link, useParams } from 'react-router-dom'
import { RouteMap } from './components/RouteMap'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import styles from './RequestDetailsPage.module.scss'

const exemplo = {
  codigo: '2401',
  horario: '08:42',
  prioridade: 'normal',
  status: 'Aguardando atribuição',
  origem: 'Central SVO',
  destino: 'Posto Sul',
  paradas: ['Terminal Norte', 'Base SVO'],
  solicitante: {
    nome: 'João Silva',
    setor: 'Logística',
    telefone: '(79) 99999-9999',
    email: 'joao.silva@exemplo.com',
  },
  carga: {
    tipo: 'Equipamentos',
    peso: '120 kg',
    volumes: '4 caixas',
  },
}

export function RequestDetailsPage() {
  useDocumentTitle('Detalhes da solicitação')
  const { id } = useParams()
  const codigo = id || exemplo.codigo

  return (
    <main className={styles.page}>
      <Link to="/viagens" className={styles.back}>
        ← Voltar para o Painel de Viagens
      </Link>

      <header className={styles.header}>
        <div>
          <h1>Detalhes da Solicitação #{codigo}</h1>
          <p>
            Solicitada hoje às {exemplo.horario} · Prioridade {exemplo.prioridade}
          </p>
        </div>
        <span className={styles.status}>{exemplo.status}</span>
      </header>

      <section className={styles.mapSection} aria-label="Mapa da rota">
        <RouteMap className={styles.map} label="Mapa ilustrativo da rota planejada">
          <span className={styles.routeBadge}>
            {exemplo.origem} → {exemplo.destino}
          </span>
        </RouteMap>
      </section>

      <div className={styles.grid}>
        <section className={styles.card}>
          <h2>Rota</h2>
          <dl>
            <dt>Origem</dt>
            <dd>{exemplo.origem}</dd>
            <dt>Destino</dt>
            <dd>{exemplo.destino}</dd>
            <dt>Paradas</dt>
            <dd>{exemplo.paradas.join(', ')}</dd>
          </dl>
        </section>

        <section className={styles.card}>
          <h2>Solicitante</h2>
          <dl>
            <dt>Nome</dt>
            <dd>{exemplo.solicitante.nome}</dd>
            <dt>Setor</dt>
            <dd>{exemplo.solicitante.setor}</dd>
            <dt>Contato</dt>
            <dd>
              <a href="tel:+5579999999999">{exemplo.solicitante.telefone}</a>
              <a href={`mailto:${exemplo.solicitante.email}`}>
                {exemplo.solicitante.email}
              </a>
            </dd>
          </dl>
        </section>

        <section className={styles.card}>
          <h2>Detalhes da Carga</h2>
          <dl>
            <dt>Tipo</dt>
            <dd>{exemplo.carga.tipo}</dd>
            <dt>Peso Total</dt>
            <dd>{exemplo.carga.peso}</dd>
            <dt>Volumes</dt>
            <dd>{exemplo.carga.volumes}</dd>
          </dl>
        </section>

        <section className={styles.card}>
          <h2>Veículo Atribuído</h2>
          <span className={styles.unassigned}>Não atribuído</span>
          <button className={styles.assignButton} type="button" disabled>
            Atribuir veículo e motorista
          </button>
          <p className={styles.note}>
            A atribuição ficará disponível após a integração com o serviço.
          </p>
        </section>
      </div>
    </main>
  )
}
