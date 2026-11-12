import { useState } from 'react'
import styles from './RelatoriosPage.module.scss'

export function RelatoriosPage() {
  const [periodo, setPeriodo] = useState('mes')
  const [tipo, setTipo] = useState('')
  const [veiculo, setVeiculo] = useState('todos')

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Exportação de Relatórios</h1>
        <p>Gere arquivos gerenciais por período, veículo ou motorista.</p>
      </header>

      <section className={styles.filters}>
        <div className={styles.field}>
          <label htmlFor="periodo">Período</label>
          <select
            id="periodo"
            value={periodo}
            onChange={(event) => setPeriodo(event.target.value)}
          >
            <option value="mes">Este mês</option>
            <option value="semana">Esta semana</option>
            <option value="ano">Este ano</option>
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="tipo">Tipo de Relatório</label>
          <select
            id="tipo"
            value={tipo}
            onChange={(event) => setTipo(event.target.value)}
          >
            <option value="">Selecione</option>
            <option value="viagens">Viagens</option>
            <option value="manutencao">Manutenção</option>
            <option value="combustivel">Combustível</option>
            <option value="motoristas">Motoristas</option>
            <option value="vistorias">Vistorias</option>
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="veiculo">Veículo/Motorista</label>
          <select
            id="veiculo"
            value={veiculo}
            onChange={(event) => setVeiculo(event.target.value)}
          >
            <option value="todos">Todos</option>
          </select>
        </div>

        <button type="button" className={styles.generateButton}>
          Gerar Relatório
        </button>
      </section>

      <div className={styles.content}>
        <section className={styles.reportList}>
          <h2>Tipos de Relatório</h2>

          <div className={styles.reportCard}>
            <h3>Relatório de Viagens</h3>
            <p>Histórico completo de viagens realizadas.</p>
            <button type="button">PDF</button>
            <button type="button">Excel</button>
          </div>

          <div className={styles.reportCard}>
            <h3>Relatório de Manutenção</h3>
            <p>Registro de manutenções e custos.</p>
            <button type="button">PDF</button>
            <button type="button">Excel</button>
          </div>

          <div className={styles.reportCard}>
            <h3>Relatório de Combustível</h3>
            <p>Consumo e abastecimentos da frota.</p>
            <button type="button">PDF</button>
            <button type="button">Excel</button>
          </div>

          <div className={styles.reportCard}>
            <h3>Relatório de Motoristas</h3>
            <p>Desempenho e documentação.</p>
            <button type="button">PDF</button>
            <button type="button">Excel</button>
          </div>

          <div className={styles.reportCard}>
            <h3>Relatório de Vistorias</h3>
            <p>Checklists e ocorrências.</p>
            <button type="button">PDF</button>
            <button type="button">Excel</button>
          </div>
        </section>

        <section className={styles.preview}>
          <h2>Pré-visualização do Relatório</h2>

          <div className={styles.previewBox}>
            <h3>Relatório de Viagens — Setembro/2026</h3>
            <p>Prévia ilustrativa dos resultados</p>

            <div className={styles.stats}>
              <article>
                <h4>Viagens</h4>
                <strong>142</strong>
              </article>

              <article>
                <h4>Km Rodados</h4>
                <strong>12.480</strong>
              </article>

              <article>
                <h4>Custo Total</h4>
                <strong>R$ 18.730</strong>
              </article>
            </div>

            <h4>Viagens por período</h4>

            <div className={styles.chart}>
              {[40, 65, 52, 85, 70, 95, 78].map((altura, index) => (
                <div
                  key={index}
                  style={{
                    height: `${altura}px`,
                    width: '30px',
                    backgroundColor: '#2563eb',
                  }}
                />
              ))}
            </div>

            <p>Resumo dos dados apresentados no relatório.</p>
          </div>
        </section>
      </div>
    </div>
  )
}

