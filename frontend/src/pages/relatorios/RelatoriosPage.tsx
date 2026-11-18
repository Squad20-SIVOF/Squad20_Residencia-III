import { useState } from 'react'
import styles from './RelatoriosPage.module.scss'

type Kind = 'Viagens' | 'Manutenção' | 'Combustível' | 'Motoristas' | 'Vistorias'

const kinds: { name: Kind; subtitle: string; icon: string }[] = [
  {
    name: 'Viagens',
    subtitle: 'Histórico completo de viagens realizadas',
    icon: '▤',
  },
  {
    name: 'Manutenção',
    subtitle: 'Registro de manutenções e custos',
    icon: '⚒',
  },
  {
    name: 'Combustível',
    subtitle: 'Consumo e abastecimentos',
    icon: '▣',
  },
  {
    name: 'Motoristas',
    subtitle: 'Desempenho e documentação',
    icon: '♙',
  },
  {
    name: 'Vistorias',
    subtitle: 'Checklists e inspeções',
    icon: '▧',
  },
]

const bars = [38, 60, 49, 78, 65, 94, 70]

const samples = [
  { vehicle: 'ABC-1234', trips: 32, km: '2.340', cost: 'R$ 8.720' },
  { vehicle: 'DEF-5678', trips: 28, km: '2.100', cost: 'R$ 6.740' },
  { vehicle: 'GHI-9012', trips: 35, km: '2.680', cost: 'R$ 9.120' },
]

export function RelatoriosPage() {
  const [period, setPeriod] = useState('Este mês')
  const [kind, setKind] = useState<Kind>('Viagens')
  const [vehicle, setVehicle] = useState('Todos')
  const [generated, setGenerated] = useState(false)
  const [message, setMessage] = useState('')

  const exportCsv = (name: Kind) => {
    const csv = [
      ['Veículo', 'Viagens', 'Km', 'Custo'],
      ...samples.map((s) => [s.vehicle, String(s.trips), s.km, s.cost]),
    ]
      .map((row) => row.join(';'))
      .join('\r\n')

    const blob = new Blob(['\uFEFF' + csv], {
      type: 'text/csv;charset=utf-8',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `relatorio-${name.toLowerCase()}.csv`
    link.click()

    URL.revokeObjectURL(url)
    setMessage('CSV de demonstração exportado.')
  }

  const exportPdf = () => {
    setMessage('Pré-visualização pronta para impressão.')
    window.print()
  }

  return (
    <main className={styles.page}>
      <div className={styles.eyebrow}>Exportação de relatórios</div>

      <header>
        <h1>Exportação de Relatórios</h1>
        <p>Gere arquivos gerenciais por período, veículo ou motorista</p>
      </header>

      <div className={styles.filters}>
        <label>
          Período
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option>Este mês</option>
            <option>Mês anterior</option>
            <option>Últimos 3 meses</option>
            <option>Este ano</option>
          </select>
        </label>

        <label>
          Tipo de Relatório
          <select value={kind} onChange={(e) => setKind(e.target.value as Kind)}>
            {kinds.map((k) => (
              <option key={k.name} value={k.name}>
                {k.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Veículo/Motorista
          <select value={vehicle} onChange={(e) => setVehicle(e.target.value)}>
            <option>Todos</option>
            <option>ABC-1234</option>
            <option>DEF-5678</option>
            <option>GHI-9012</option>
          </select>
        </label>

        <button
          type="button"
          className={styles.generate}
          onClick={() => {
            setGenerated(true)
            setMessage('Pré-visualização de demonstração atualizada.')
          }}
        >
          ⚙ Gerar Relatório
        </button>
      </div>

      <div className={styles.columns}>
        <section>
          <h2>Tipos de Relatório</h2>

          <div className={styles.list}>
            {kinds.map((k) => (
              <article className={styles.report} key={k.name}>
                <span className={styles.reportIcon}>{k.icon}</span>

                <div className={styles.reportText}>
                  <strong>Relatório de {k.name}</strong>
                  <small>{k.subtitle}</small>
                </div>

                <div className={styles.export}>
                  <button
                    type="button"
                    className={styles.pdf}
                    onClick={() => {
                      setKind(k.name)
                      exportPdf()
                    }}
                  >
                    PDF
                  </button>

                  <button
                    type="button"
                    className={styles.excel}
                    onClick={() => exportCsv(k.name)}
                  >
                    Excel
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.previewOuter}>
          <h2>Pré-visualização do Relatório</h2>

          <div className={styles.preview}>
            <h3>
              Relatório de {kind} — {period}
            </h3>

            <p>
              Período: {period} | {vehicle}
            </p>

            <div className={styles.stats}>
              <div>
                <small>Viagens</small>
                <strong>142</strong>
              </div>

              <div>
                <small>Km Rodados</small>
                <strong>12.480</strong>
              </div>

              <div>
                <small>Custo Total</small>
                <strong>R$ 18.730</strong>
              </div>
            </div>

            <p className={styles.srOnly}>
              Gráfico de barras com sete colunas ilustrativas.
            </p>

            <div className={styles.chart}>
              {bars.map((value, i) => (
                <div
                  className={styles.bar}
                  key={i}
                  style={{ height: `${value}%` }}
                  title={`Período ${i + 1}: ${value}`}
                />
              ))}
            </div>

            <table>
              <thead>
                <tr>
                  <th>Veículo</th>
                  <th>Viagens</th>
                  <th>Km</th>
                  <th>Custo</th>
                </tr>
              </thead>

              <tbody>
                {samples.map((s) => (
                  <tr key={s.vehicle}>
                    <td>{s.vehicle}</td>
                    <td>{s.trips}</td>
                    <td>{s.km}</td>
                    <td>{s.cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {generated && (
              <p className={styles.demo}>Prévia gerada com dados ilustrativos</p>
            )}
          </div>
        </section>
      </div>

      <output className={styles.notice}>{message}</output>
    </main>
  )
}
