
import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './AtendimentoSVOPage.module.scss'

type Field = {
  name: string
  label: string
  placeholder?: string
  type?: string
  required?: boolean
}

const groups: { title: string; fields: Field[] }[] = [
  {
    title: 'Dados do falecido',
    fields: [
      { name: 'nomeFalecido', label: 'Nome completo', placeholder: 'Ex.: João da Silva', required: true },
      { name: 'cpf', label: 'CPF', placeholder: '000.000.000-00' },
      { name: 'nascimento', label: 'Data de nascimento', type: 'date' },
      { name: 'obito', label: 'Data do óbito', type: 'date' },
    ],
  },
  {
    title: 'Endereço da remoção',
    fields: [
      { name: 'endereco', label: 'Endereço de origem', placeholder: 'Rua, Número, Complemento', required: true },
      { name: 'bairro', label: 'Bairro', placeholder: 'Bairro' },
      { name: 'cidade', label: 'Cidade', placeholder: 'Cidade' },
      { name: 'uf', label: 'UF', placeholder: 'UF' },
    ],
  },
  {
    title: 'Dados do solicitante',
    fields: [
      { name: 'solicitante', label: 'Nome do solicitante', placeholder: 'Nome completo do familiar/responsável', required: true },
      { name: 'telefone', label: 'Telefone de contato', placeholder: '(00) 00000-0000' },
      { name: 'parentesco', label: 'Parentesco', placeholder: 'Ex.: Filho(a), Cônjuge' },
    ],
  },
]

export function AtendimentoSVOPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<Record<string, string>>({})
  const [collapsed, setCollapsed] = useState<number[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [notice, setNotice] = useState('')

  const toggle = (index: number) => {
    setCollapsed(old =>
      old.includes(index)
        ? old.filter(i => i !== index)
        : [...old, index]
    )
  }

  const upload = (event: ChangeEvent<HTMLInputElement>) => {
    setFiles(Array.from(event.target.files ?? []))
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setNotice(
      'Dados preenchidos e validados. A integração com a API de atendimentos SVO ainda precisa ser configurada; nenhum registro foi enviado.'
    )
  }

  return (
    <main className={styles.page}>
      <button
        type="button"
        className={styles.back}
        onClick={() => navigate('/viagens')}
      >
        ← Voltar para o Painel de Viagens
      </button>

      <header className={styles.heading}>
        <h1>Atendimento SVO</h1>
        <p>Registro de solicitação de óbito e encaminhamento de remoção</p>
      </header>

      <div className={styles.progress}>
        <span>▣ &nbsp; NOVO ATENDIMENTO</span>
        <span>4 etapas · preenchimento obrigatório</span>
      </div>

      <form onSubmit={submit}>
        {groups.map((group, index) => (
          <section className={styles.section} key={group.title}>
            <button
              type="button"
              className={styles.sectionHeading}
              onClick={() => toggle(index)}
              aria-expanded={!collapsed.includes(index)}
            >
              <strong>{index + 1}. {group.title}</strong>
              <span>
                {collapsed.includes(index) ? 'Expandir +' : 'Expandido −'}
              </span>
            </button>

            {!collapsed.includes(index) && (
              <div
                className={`${styles.fields} ${
                  index === 2 ? styles.three : ''
                }`}
              >
                {group.fields.map(field => (
                  <label key={field.name}>
                    {field.label}
                    <input
                      name={field.name}
                      type={field.type ?? 'text'}
                      placeholder={field.placeholder}
                      required={field.required}
                      value={data[field.name] ?? ''}
                      onChange={e =>
                        setData(old => ({
                          ...old,
                          [field.name]: e.target.value,
                        }))
                      }
                    />
                  </label>
                ))}
              </div>
            )}
          </section>
        ))}

        <section className={styles.section}>
          <button
            type="button"
            className={styles.sectionHeading}
            onClick={() => toggle(3)}
            aria-expanded={!collapsed.includes(3)}
          >
            <strong>4. Laudo e documentação</strong>
            <span>
              {collapsed.includes(3) ? 'Expandir +' : 'Expandido −'}
            </span>
          </button>

          {!collapsed.includes(3) && (
            <label className={styles.dropzone}>
              ⬆ &nbsp;
              <strong>Upload de documentos</strong>
              <small>
                Arraste ou selecione os arquivos de laudo e outros documentos
              </small>
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={upload}
              />
              {files.length > 0 && (
                <span>{files.map(f => f.name).join(', ')}</span>
              )}
            </label>
          )}
        </section>

        {notice && (
          <p role="status" className={styles.notice}>
            {notice}
          </p>
        )}

        <footer className={styles.actions}>
          <button type="button" onClick={() => navigate('/viagens')}>
            Cancelar
          </button>
          <button type="submit" className={styles.primary}>
            ✚ &nbsp; Registrar Atendimento
          </button>
        </footer>
      </form>
    </main>
  )
}
