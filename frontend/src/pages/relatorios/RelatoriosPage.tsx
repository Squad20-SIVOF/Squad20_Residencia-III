import { useState } from 'react'
import { flushSync } from 'react-dom'
import { ClipboardCheck, FileDown, Fuel, Route, Users, Wrench } from 'lucide-react'
import { Button } from '@/components/Button'
import { PageHeader } from '@/components/PageHeader'
import { Pagination, TABLE_PAGE_SIZE } from '@/components/Pagination'
import { SelectField } from '@/components/SelectField'
import { Toolbar } from '@/components/Toolbar'
import { DataTable, type DataTableColumn } from '@/components/DataTable'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import styles from './RelatoriosPage.module.scss'

type Kind = 'Viagens' | 'Manutenção' | 'Combustível' | 'Motoristas' | 'Vistorias'

interface ReportFilters {
  period: string
  kind: Kind
  vehicle: string
}

const initialFilters: ReportFilters = {
  period: 'Este mês',
  kind: 'Viagens',
  vehicle: 'Todos',
}

const kinds: { name: Kind; subtitle: string; icon: typeof Route }[] = [
  {
    name: 'Viagens',
    subtitle: 'Histórico completo de viagens realizadas',
    icon: Route,
  },
  {
    name: 'Manutenção',
    subtitle: 'Registro de manutenções e custos',
    icon: Wrench,
  },
  {
    name: 'Combustível',
    subtitle: 'Consumo e abastecimentos',
    icon: Fuel,
  },
  {
    name: 'Motoristas',
    subtitle: 'Desempenho e documentação',
    icon: Users,
  },
  {
    name: 'Vistorias',
    subtitle: 'Checklists e inspeções',
    icon: ClipboardCheck,
  },
]

const bars = [38, 60, 49, 78, 65, 94, 70]
const peak = Math.max(...bars)

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
  useDocumentTitle('Relatórios')
  const [draft, setDraft] = useState(initialFilters)
  const [filters, setFilters] = useState(initialFilters)
  const [page, setPage] = useState(1)
  const [generated, setGenerated] = useState(false)
  const [message, setMessage] = useState('')
  const rows =
    filters.vehicle === 'Todos'
      ? samples
      : samples.filter((row) => row.vehicle === filters.vehicle)
  const totalPages = Math.max(1, Math.ceil(rows.length / TABLE_PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageRows = rows.slice(
    (currentPage - 1) * TABLE_PAGE_SIZE,
    currentPage * TABLE_PAGE_SIZE,
  )

  const exportCsv = (name: Kind) => {
    const csv = [
      ['Veículo', 'Viagens', 'Km', 'Custo'],
      ...rows.map((row) => [row.vehicle, String(row.trips), row.km, row.cost]),
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

  const exportPdf = (kind: Kind) => {
    flushSync(() => {
      setDraft((current) => ({ ...current, kind }))
      setFilters((current) => ({ ...current, kind }))
      setMessage('Pré-visualização pronta para impressão.')
    })
    window.print()
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Exportação de Relatórios"
        subtitle="Gere arquivos gerenciais por período, veículo ou motorista"
      />

      <Toolbar
        className={styles.filters}
        label="Filtros do relatório"
        onSubmit={(event) => {
          event.preventDefault()
          setFilters(draft)
          setPage(1)
          setGenerated(true)
          setMessage('Pré-visualização de demonstração atualizada.')
        }}
      >
        <SelectField
          label="Período"
          value={draft.period}
          options={['Este mês', 'Mês anterior', 'Últimos 3 meses', 'Este ano'].map(
            (value) => ({ value, label: value }),
          )}
          onChange={(period) => setDraft((current) => ({ ...current, period }))}
        />
        <SelectField<Kind>
          label="Tipo de Relatório"
          value={draft.kind}
          options={kinds.map(({ name }) => ({ value: name, label: name }))}
          onChange={(kind) => setDraft((current) => ({ ...current, kind }))}
        />
        <SelectField
          label="Veículo/Motorista"
          value={draft.vehicle}
          options={['Todos', ...samples.map((row) => row.vehicle)].map((value) => ({
            value,
            label: value,
          }))}
          onChange={(vehicle) => setDraft((current) => ({ ...current, vehicle }))}
        />
        <Button type="submit" iconStart={<FileDown size={16} />}>
          Gerar Relatório
        </Button>
      </Toolbar>

      <div className={styles.columns}>
        <section className={styles.catalog} aria-labelledby="report-types-title">
          <h2 id="report-types-title">Tipos de Relatório</h2>

          <div className={styles.list}>
            {kinds.map(({ name, subtitle, icon: Icon }) => (
              <article className={styles.report} key={name}>
                <span className={styles.reportIcon} aria-hidden="true">
                  <Icon size={19} />
                </span>

                <div className={styles.reportText}>
                  <h3>Relatório de {name}</h3>
                  <p>{subtitle}</p>
                </div>

                <div className={styles.export}>
                  <Button
                    variant="secondary"
                    className={styles.pdf}
                    onClick={() => exportPdf(name)}
                    aria-label={`Exportar relatório de ${name} em PDF`}
                  >
                    PDF
                  </Button>

                  <Button
                    className={styles.excel}
                    onClick={() => exportCsv(name)}
                    aria-label={`Exportar relatório de ${name} para Excel (CSV)`}
                  >
                    Excel
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.previewOuter} aria-labelledby="report-preview-title">
          <h2 id="report-preview-title">Pré-visualização do Relatório</h2>

          <div className={styles.preview}>
            <h3>
              Relatório de {filters.kind} — {filters.period}
            </h3>

            <p>Veículo/Motorista: {filters.vehicle} · Dados demonstrativos</p>

            <dl className={styles.indicators} aria-label="Indicadores do relatório">
              <div>
                <dt>Viagens</dt>
                <dd>142</dd>
              </div>
              <div>
                <dt>Km rodados</dt>
                <dd>12.480</dd>
              </div>
              <div>
                <dt>Custo total</dt>
                <dd>R$ 18.730</dd>
              </div>
            </dl>

            <figure className={styles.chart}>
              {bars.map((value, i) => (
                <div
                  className={styles.bar}
                  key={i}
                  aria-hidden="true"
                  data-peak={value === peak ? true : undefined}
                  style={{ height: `${value}%` }}
                  title={`Período ${i + 1}: ${value}`}
                />
              ))}
              <figcaption className={styles.chartCaption}>
                Gráfico demonstrativo com sete valores: {bars.join(', ')}.
              </figcaption>
            </figure>

            <div className={totalPages > 1 ? styles.previewOnScreen : undefined}>
              <DataTable
                className={styles.previewTable}
                caption="Dados da pré-visualização do relatório"
                rows={pageRows}
                columns={COLUMNS}
                getRowKey={(row) => row.vehicle}
              />
            </div>
            {totalPages > 1 && (
              <div className={styles.previewOnPrint}>
                <DataTable
                  className={styles.previewTable}
                  caption="Dados do relatório para impressão"
                  rows={rows}
                  columns={COLUMNS}
                  getRowKey={(row) => row.vehicle}
                />
              </div>
            )}
            <div className={styles.previewPagination}>
              <Pagination
                itemLabel="registros"
                shownCount={pageRows.length}
                totalCount={rows.length}
                currentPage={currentPage}
                totalPages={totalPages}
                hasPrevious={currentPage > 1}
                hasNext={currentPage < totalPages}
                onPrevious={() => setPage(currentPage - 1)}
                onNext={() => setPage(currentPage + 1)}
              />
            </div>

            {generated && (
              <p className={styles.demo}>Prévia gerada com dados ilustrativos</p>
            )}
          </div>
        </section>
      </div>

      <output className={styles.notice}>{message}</output>
    </div>
  )
}
