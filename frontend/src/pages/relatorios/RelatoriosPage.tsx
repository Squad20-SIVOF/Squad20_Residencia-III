
import { useState } from 'react'
import styles from './RelatoriosPage.module.scss'

type ReportType =
  | 'viagens'
  | 'manutencao'
  | 'combustivel'
  | 'motoristas'
  | 'vistorias'

type Report = {
  id: ReportType
  title: string
  description: string
  icon: string
}

const reports: Report[] = [
  {
    id: 'viagens',
    title: 'Relatório de Viagens',
    description: 'Histórico completo de viagens realizadas.',
    icon: '↗',
  },
  {
    id: 'manutencao',
    title: 'Relatório de Manutenção',
    description: 'Registro de manutenções e custos.',
    icon: '⚙',
  },
  {
    id: 'combustivel',
    title: 'Relatório de Combustível',
    description: 'Consumo e abastecimentos da frota.',
    icon: '◈',
  },
  {
    id: 'motoristas',
    title: 'Relatório de Motoristas',
    description: 'Desempenho e documentação.',
    icon: '♙',
  },
  {
    id: 'vistorias',
    title: 'Relatório de Vistorias',
    description: 'Checklists e ocorrências.',
    icon: '☑',
  },
]

const chartData = [
  { label: 'Sem 1', value: 40 },
  { label: 'Sem 2', value: 65 },
  { label: 'Sem 3', value: 52 },
  { label: 'Sem 4', value: 85 },
  { label: 'Sem 5', value: 70 },
  { label: 'Sem 6', value: 95 },
  { label: 'Sem 7', value: 78 },
]

const previewRows = [
  { id: '#001', vehicle: 'ABC-1234', date: '02/09/2026', km: '120 km' },
  { id: '#002', vehicle: 'DEF-5678', date: '05/09/2026', km: '85 km' },
  { id: '#003', vehicle: 'GHI-9012', date: '09/09/2026', km: '210 km' },
]

export function RelatoriosPage() {
  const [periodo, setPeriodo] = useState('mes')
  const [tipo, setTipo] = useState<ReportType | ''>('')
  const [veiculo, setVeiculo] = useState('todos')
  const [selectedReport, setSelectedReport] =
    useState<ReportType>('viagens')
  const [message, setMessage] = useState('')

  const activeReport = reports.find(
  (report) => report.id === selectedReport
) ?? {
  id: 'viagens',
  title: 'Relatório de Viagens',
  description: 'Histórico completo de viagens realizadas.',
  icon: '↗',
}

  const handleGenerate = () => {
    if (!tipo) {
      setMessage('Selecione um tipo de relatório para continuar.')
      return
    }

    setSelectedReport(tipo)
    setMessage(
      'Relatório selecionado. A geração com dados reais ainda depende da integração com o backend.'
    )
  }

  const handleExport = (
    report: ReportType,
    format: 'PDF' | 'Excel'
  ) => {
    setTipo(report)
    setSelectedReport(report)
    setMessage(
      `A exportação ${format} ainda precisa ser integrada aos dados reais do sistema.`
    )
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>Exportação de Relatórios</h1>
        <p>
          Gere arquivos gerenciais por período, veículo ou motorista.
        </p>
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
            onChange={(event) =>
              setTipo(event.target.value as ReportType | '')
            }
          >
            <option value="">Selecione</option>
            {reports.map((report) => (
              <option key={report.id} value={report.id}>
                {report.title.replace('Relatório de ', '')}
              </option>
            ))}
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

        <button
          type="button"
          className={styles.generateButton}
          onClick={handleGenerate}
        >
          Gerar Relatório
        </button>
      </section>

      {message && (
        <p className={styles.feedback} role="status">
          {message}
        </p>
      )}

      <div className={styles.content}>
        <section className={styles.reportList}>
          <h2>Tipos de Relatório</h2>

          <div className={styles.reportCards}>
            {reports.map((report) => (
              <article
                key={report.id}
                className={`${styles.reportCard} ${
                  selectedReport === report.id
                    ? styles.selectedCard
                    : ''
                }`}
              >
                <div className={styles.reportIcon}>
                  {report.icon}
                </div>

                <div className={styles.reportInfo}>
                  <h3>{report.title}</h3>
                  <p>{report.description}</p>
                </div>

                <div className={styles.exportButtons}>
                  <button
                    type="button"
                    onClick={() =>
                      handleExport(report.id, 'PDF')
                    }
                  >
                    ↓ PDF
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleExport(report.id, 'Excel')
                    }
                  >
                    ↓ Excel
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.preview}>
          <h2>Pré-visualização do Relatório</h2>

          <div className={styles.previewBox}>
            <div className={styles.previewHeader}>
              <h3>{activeReport.title} — Setembro/2026</h3>
              <p>Prévia ilustrativa dos resultados</p>
            </div>

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

            <h4 className={styles.chartTitle}>
              Viagens por período
            </h4>

            <div className={styles.chart}>
              {chartData.map((item) => (
                <div
                  className={styles.chartColumn}
                  key={item.label}
                >
                  <div className={styles.barTrack}>
                    <div
                      className={styles.bar}
                      style={{ height: `${item.value}%` }}
                    />
                  </div>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>

            <div className={styles.tableHeader}>
              <h4>Resumo de viagens</h4>
              <span>Dados demonstrativos</span>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.summaryTable}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Veículo</th>
                    <th>Data</th>
                    <th>Distância</th>
                  </tr>
                </thead>

                <tbody>
                  {previewRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.id}</td>
                      <td>{row.vehicle}</td>
                      <td>{row.date}</td>
                      <td>{row.km}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className={styles.previewNote}>
              Os dados apresentados são apenas exemplos.
              A integração com o backend ainda é necessária.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
