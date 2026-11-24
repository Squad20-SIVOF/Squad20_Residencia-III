import { useId, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { Check, ChevronDown, FilePlus2 } from 'lucide-react'
import { Alert } from '@/components/Alert'
import { BackLink } from '@/components/BackLink/BackLink'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { ButtonLink } from '@/components/ButtonLink'
import { PageHeader } from '@/components/PageHeader'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { classNames } from '@/utils/classNames'
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
      {
        name: 'nomeFalecido',
        label: 'Nome completo',
        placeholder: 'Ex.: João da Silva',
        required: true,
      },
      { name: 'cpf', label: 'CPF', placeholder: '000.000.000-00' },
      { name: 'nascimento', label: 'Data de nascimento', type: 'date' },
      { name: 'obito', label: 'Data do óbito', type: 'date' },
    ],
  },
  {
    title: 'Endereço da remoção',
    fields: [
      {
        name: 'endereco',
        label: 'Endereço de origem',
        placeholder: 'Rua, Número, Complemento',
        required: true,
      },
      { name: 'bairro', label: 'Bairro', placeholder: 'Bairro' },
      { name: 'cidade', label: 'Cidade', placeholder: 'Cidade' },
      { name: 'uf', label: 'UF', placeholder: 'UF' },
    ],
  },
  {
    title: 'Dados do solicitante',
    fields: [
      {
        name: 'solicitante',
        label: 'Nome do solicitante',
        placeholder: 'Nome completo do familiar/responsável',
        required: true,
      },
      { name: 'telefone', label: 'Telefone de contato', placeholder: '(00) 00000-0000' },
      { name: 'parentesco', label: 'Parentesco', placeholder: 'Ex.: Filho(a), Cônjuge' },
    ],
  },
]

function AtendimentoSection({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string
  expanded: boolean
  onToggle: () => void
  children: ReactNode
}) {
  const panel = useId()
  return (
    <section className={styles.section}>
      <button
        type="button"
        className={styles.sectionHeading}
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={panel}
      >
        <strong>{title}</strong>
        <span aria-hidden="true">
          {expanded ? 'Expandido' : 'Expandir'}
          <ChevronDown size={14} />
        </span>
      </button>
      <div id={panel} className={styles.sectionPanel} inert={!expanded}>
        <fieldset className={styles.sectionBody} disabled={!expanded}>
          {children}
        </fieldset>
      </div>
    </section>
  )
}

export function AtendimentoSVOPage() {
  useDocumentTitle('Atendimento SVO')
  const [data, setData] = useState<Record<string, string>>({})
  const [collapsed, setCollapsed] = useState<number[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [notice, setNotice] = useState('')

  const toggle = (index: number) => {
    setCollapsed((old) =>
      old.includes(index) ? old.filter((i) => i !== index) : [...old, index],
    )
  }

  const upload = (event: ChangeEvent<HTMLInputElement>) => {
    setFiles(Array.from(event.target.files ?? []))
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setNotice(
      'Dados preenchidos e validados. A integração com a API de atendimentos SVO ainda precisa ser configurada; nenhum registro foi enviado.',
    )
  }

  return (
    <div className={styles.page}>
      <PageHeader
        className={styles.heading}
        title="Atendimento SVO"
        subtitle="Registro de verificação de óbito e encaminhamento de remoção"
        breadcrumb={<BackLink to="/viagens">Voltar para o Painel de Viagens</BackLink>}
      />

      <div className={styles.progress}>
        <Badge variant="info" className={styles.progressBadge}>
          <FilePlus2 size={14} aria-hidden="true" />
          Novo atendimento
        </Badge>
        <span>{groups.length + 1} etapas · campos obrigatórios marcados com *</span>
      </div>

      <form onSubmit={submit} autoComplete="off" className={styles.form}>
        {groups.map((group, index) => (
          <AtendimentoSection
            key={group.title}
            title={`${index + 1}. ${group.title}`}
            expanded={!collapsed.includes(index)}
            onToggle={() => toggle(index)}
          >
            <div className={classNames(styles.fields, index === 2 && styles.three)}>
              {group.fields.map((field) => (
                <label key={field.name}>
                  <span>
                    {field.label}
                    {field.required && <span aria-hidden="true"> *</span>}
                  </span>
                  <input
                    name={field.name}
                    type={field.type ?? 'text'}
                    placeholder={field.placeholder}
                    required={field.required}
                    value={data[field.name] ?? ''}
                    onChange={(e) =>
                      setData((old) => ({
                        ...old,
                        [field.name]: e.target.value,
                      }))
                    }
                  />
                </label>
              ))}
            </div>
          </AtendimentoSection>
        ))}

        <AtendimentoSection
          title="4. Laudo e documentação"
          expanded={!collapsed.includes(groups.length)}
          onToggle={() => toggle(groups.length)}
        >
          <label className={styles.dropzone}>
            <strong>Upload de documentos</strong>
            <small>Arraste os arquivos do laudo ou clique para selecionar</small>
            <input
              type="file"
              aria-label="Upload de documentos"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={upload}
            />
            {files.length > 0 && <span>{files.map((f) => f.name).join(', ')}</span>}
          </label>
        </AtendimentoSection>

        {notice && <Alert variant="info">{notice}</Alert>}

        <footer className={styles.actions}>
          <ButtonLink variant="secondary" to="/viagens">
            Cancelar
          </ButtonLink>
          <Button type="submit" iconStart={<Check size={16} />}>
            Registrar atendimento
          </Button>
        </footer>
      </form>
    </div>
  )
}
