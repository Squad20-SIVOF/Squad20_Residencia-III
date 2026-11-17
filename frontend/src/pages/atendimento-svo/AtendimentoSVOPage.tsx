import { useRef, useState, type FormEvent } from 'react'
import styles from './AtendimentoSVOPage.module.scss'

type FormDataSVO = {
  nome: string
  cpf: string
  nascimento: string
  obito: string
  endereco: string
  bairro: string
  cidade: string
  uf: string
  solicitante: string
  telefone: string
  parentesco: string
}

const initialData: FormDataSVO = {
  nome: '',
  cpf: '',
  nascimento: '',
  obito: '',
  endereco: '',
  bairro: '',
  cidade: '',
  uf: '',
  solicitante: '',
  telefone: '',
  parentesco: '',
}

type FieldName = keyof FormDataSVO

export function AtendimentoSVOPage() {
  const [form, setForm] = useState<FormDataSVO>(initialData)
  const [expanded, setExpanded] = useState([true, true, true, true])
  const [documents, setDocuments] = useState<File[]>([])
  const [message, setMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const updateField = (field: FieldName, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }))
  }

  const toggleSection = (index: number) => {
    setExpanded((previous) =>
      previous.map((value, position) =>
        position === index ? !value : value
      )
    )
  }

  const resetForm = () => {
    setForm({ ...initialData })
    setDocuments([])
    setExpanded([true, true, true, true])
    setMessage('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage(
      'Formulário validado. O registro definitivo ainda precisa ser conectado ao backend.'
    )
  }

  const renderField = (
    field: FieldName,
    label: string,
    placeholder: string,
    type: string = 'text'
  ) => (
    <div className={styles.field} key={field}>
      <label htmlFor={field}>{label}</label>
      <input
        id={field}
        name={field}
        type={type}
        placeholder={placeholder}
        value={form[field]}
        maxLength={field === 'uf' ? 2 : undefined}
        onChange={(event) =>
          updateField(
            field,
            field === 'uf'
              ? event.target.value.toUpperCase()
              : event.target.value
          )
        }
        required
      />
    </div>
  )

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a href="/painel-viagens" className={styles.backLink}>
  ← Voltar para o Painel de Viagens
</a>

        <h1>Atendimento SVO</h1>
        <p>Registro de solicitação de óbito e encaminhamento de remoção.</p>

        <div className={styles.headerBottom}>
          <span className={styles.newBadge}>NOVO ATENDIMENTO</span>
          <span className={styles.stepCount}>
            4 etapas · preenchimento obrigatório
          </span>
        </div>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <section className={styles.section}>
          <button
            type="button"
            className={styles.sectionHeading}
            onClick={() => toggleSection(0)}
            aria-expanded={expanded[0]}
          >
            <span>1. Dados do falecido</span>
            <span>{expanded[0] ? 'Expandido ⌃' : 'Expandir ⌄'}</span>
          </button>

          {expanded[0] && (
            <div className={styles.fieldGrid}>
              {renderField('nome', 'Nome completo', 'Ex.: João da Silva')}
              {renderField('cpf', 'CPF', '000.000.000-00')}
              {renderField('nascimento', 'Data de nascimento', '', 'date')}
              {renderField('obito', 'Data do óbito', '', 'date')}
            </div>
          )}
        </section>

        <section className={styles.section}>
          <button
            type="button"
            className={styles.sectionHeading}
            onClick={() => toggleSection(1)}
            aria-expanded={expanded[1]}
          >
            <span>2. Endereço da remoção</span>
            <span>{expanded[1] ? 'Expandido ⌃' : 'Expandir ⌄'}</span>
          </button>

          {expanded[1] && (
            <div className={styles.fieldGrid}>
              {renderField(
                'endereco',
                'Endereço de origem',
                'Rua, Número, Complemento'
              )}
              {renderField('bairro', 'Bairro', 'Bairro')}
              {renderField('cidade', 'Cidade', 'Cidade')}
              {renderField('uf', 'UF', 'UF')}
            </div>
          )}
        </section>

        <section className={styles.section}>
          <button
            type="button"
            className={styles.sectionHeading}
            onClick={() => toggleSection(2)}
            aria-expanded={expanded[2]}
          >
            <span>3. Dados do solicitante</span>
            <span>{expanded[2] ? 'Expandido ⌃' : 'Expandir ⌄'}</span>
          </button>

          {expanded[2] && (
            <div className={`${styles.fieldGrid} ${styles.threeColumns}`}>
              {renderField(
                'solicitante',
                'Nome do solicitante',
                'Nome completo do familiar/responsável'
              )}
              {renderField(
                'telefone',
                'Telefone de contato',
                '(00) 00000-0000',
                'tel'
              )}
              {renderField(
                'parentesco',
                'Parentesco',
                'Ex.: Filho(a), Cônjuge'
              )}
            </div>
          )}
        </section>

        <section className={styles.section}>
          <button
            type="button"
            className={styles.sectionHeading}
            onClick={() => toggleSection(3)}
            aria-expanded={expanded[3]}
          >
            <span>4. Laudo e documentação</span>
            <span>{expanded[3] ? 'Expandido ⌃' : 'Expandir ⌄'}</span>
          </button>

          {expanded[3] && (
            <div className={styles.uploadArea}>
              <label htmlFor="documentos" className={styles.uploadLabel}>
                <span className={styles.uploadIcon}>↑</span>
                <strong>Upload de documentos</strong>
                <span>
                  Arraste os arquivos para esta área ou clique para selecionar
                </span>
                <small>PDF, JPG ou PNG</small>
              </label>

              <input
                ref={fileInputRef}
                id="documentos"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                multiple
                className={styles.fileInput}
                onChange={(event) =>
                  setDocuments(Array.from(event.target.files ?? []))
                }
              />

              {documents.length > 0 && (
                <ul className={styles.fileList}>
                  {documents.map((file, index) => (
                    <li key={`${file.name}-${index}`}>{file.name}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>

        {message && (
          <p className={styles.feedback} role="status">
            {message}
          </p>
        )}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={resetForm}
          >
            Cancelar
          </button>

          <button type="submit" className={styles.submitButton}>
            + Registrar Atendimento
          </button>
        </div>
      </form>
    </main>
  )
}
