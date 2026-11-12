import styles from './PainelViagensPage.module.scss'

export function PainelViagensPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Painel de Viagens</h1>

        <p className={styles.subtitle}>
          Gerencie solicitações, acompanhe rotas e inicie novos atendimentos de viagens.
        </p>
      </header>

      <section className={styles.section}>
        <h2>Ações Rápidas</h2>

        <div className={styles.actions}>
          <article className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardIcon}>🚙</span>
              <h3>Solicitar Veículo</h3>
            </div>

            <p>Solicite um veículo para sua equipe.</p>

            <button type="button">
              Nova solicitação <span>→</span>
            </button>
          </article>

          <article className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardIcon}>🗺️</span>
              <h3>Mapa de Rotas</h3>
            </div>

            <p>Acompanhe as rotas e trajetos da frota.</p>

            <button type="button">
              Acessar mapa <span>→</span>
            </button>
          </article>

          <article className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardIcon}>📄</span>
              <h3>Novo Atendimento SVO</h3>
            </div>

            <p>Registre um novo atendimento de serviço.</p>

            <button type="button">
              Iniciar atendimento <span>→</span>
            </button>
          </article>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Solicitações de Viagens Pendentes</h2>
          <span className={styles.pendingBadge}>2 pendentes</span>
        </div>
        <div className={styles.filters}>
          <input
            type="search"
            placeholder="Buscar por ID ou setor..."
            aria-label="Buscar solicitações"
          />

          <select aria-label="Filtrar solicitações">
            <option value="pendentes">Importantes primeiro</option>
            <option value="recentes">Mais recentes</option>
            <option value="antigas">Mais antigas</option>
          </select>
        </div>

        <div className={styles.tableContainer}>
          <table>
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Tipo / Setor</th>
                <th>Trajeto</th>
                <th>Data / Horário</th>
                <th>Status</th>
                <th>Ação</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>#2401</td>
                <td>Equipamento</td>
                <td>Central SVO → Posto Sul</td>
                <td>Hoje - 10:30</td>
                <td>
                  <span className={styles.statusPending}>Pendente</span>
                </td>
                <td>
                  <button type="button" className={styles.detailsButton}>
                    Ver solicitações →
                  </button>
                </td>
              </tr>

              <tr>
                <td>#2402</td>
                <td>Documentos</td>
                <td>Terminal Norte → Base SVO</td>
                <td>Hoje - 11:00</td>
                <td>
                  <span className={styles.statusPending}>Pendente</span>
                </td>
                <td>
                  <button type="button" className={styles.detailsButton}>
                    Ver solicitações →
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Viagens em Acompanhamento</h2>

        <div className={styles.trips}>
          <article className={styles.card}>
            <h3>Rota #101</h3>
            <p>Central SVO → Posto Sul</p>
            <span>Em andamento</span>
          </article>

          <article className={styles.card}>
            <h3>Rota #102</h3>
            <p>Terminal Norte → Base SVO</p>
            <span>A caminho</span>
          </article>

          <article className={styles.card}>
            <h3>Rota #103</h3>
            <p>Almoxarifado → Unidade 4</p>
            <span>Retorno</span>
          </article>

          <article className={styles.card}>
            <h3>Rota #104</h3>
            <p>Base SVO → Posto Médico</p>
            <span>Programada</span>
          </article>
        </div>
      </section>
    </div>
  )
}
