import { useState } from 'react'
import { Button } from '@/components/Button'
import { SelectField } from '@/components/SelectField'
import { StatGrid } from '@/components/StatCard'
import { Toolbar } from '@/components/Toolbar'
import { DataTable, TablePanel, type DataTableColumn } from '@/components/DataTable'
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

const COLUMNS: DataTableColumn<(typeof samples)[number]>[] = [
  {
    key: 'vehicle',
    header: 'Veículo',
    isPrimary: true,
    keepTogether: true,
    render: (row) => row.vehicle,
  },
  { key: 'trips', header: 'Viagens', keepTogether: true, render: (row) => row.trips },
  { key: 'km', header: 'Km', keepTogether: true, render: (row) => row.km },
  { key: 'cost', header: 'Custo', keepTogether: true, render: (row) => row.cost },
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

      <Toolbar
        className={styles.filters}
        label="Filtros do relatório"
        onSubmit={(event) => {
          event.preventDefault()
          setGenerated(true)
          setMessage('Pré-visualização de demonstração atualizada.')
        }}
      >
        <SelectField
          label="Período"
          value={period}
          options={['Este mês', 'Mês anterior', 'Últimos 3 meses', 'Este ano'].map(
            (value) => ({ value, label: value }),
          )}
          onChange={setPeriod}
        />
        <SelectField<Kind>
          label="Tipo de Relatório"
          value={kind}
          options={kinds.map(({ name }) => ({ value: name, label: name }))}
          onChange={setKind}
        />
        <SelectField
          label="Veículo/Motorista"
          value={vehicle}
          options={['Todos', ...samples.map((row) => row.vehicle)].map((value) => ({
            value,
            label: value,
          }))}
          onChange={setVehicle}
        />
        <Button type="submit">Gerar Relatório</Button>
      </Toolbar>

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

            <StatGrid
              label="Indicadores do relatório"
              className={styles.indicators}
              cards={[
                { label: 'Viagens', value: 142, variant: 'success' },
                { label: 'Km Rodados', value: '12.480' },
                { label: 'Custo Total', value: 'R$ 18.730' },
              ]}
            />

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

            <TablePanel
              title="Dados da pré-visualização"
              headingLevel={3}
              recordCount={samples.length}
            >
              <DataTable
                caption="Dados da pré-visualização do relatório"
                rows={samples}
                columns={COLUMNS}
                getRowKey={(row) => row.vehicle}
              />
            </TablePanel>

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
