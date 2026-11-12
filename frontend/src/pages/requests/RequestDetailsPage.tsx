import { useCallback, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Badge } from '@/components/Badge'
import { Card } from '@/components/Card'
import { CheckboxField } from '@/components/CheckboxField'
import { TextField } from '@/components/TextField'
import { TextAreaField } from '@/components/TextAreaField'
import { StateMessage } from '@/components/StateMessage'
import { useAsync } from '@/hooks/useAsync'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import {
  cancelRequest,
  getRequestDetails,
  updateRequest,
  type RequestDetails,
} from './services/requestApi'
import styles from './RequestDetailsPage.module.scss'

const dateTime = (value: string) => new Date(value).toLocaleString('pt-BR')
function localDateTime(value: string) {
  const date = new Date(value)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16)
}

function RequestActions({
  request,
  reload,
}: {
  request: RequestDetails
  reload: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [reason, setReason] = useState('')
  const [category, setCategory] = useState(request.categoria)
  const [neededAt, setNeededAt] = useState(localDateTime(request.data_necessidade))
  const [urgent, setUrgent] = useState(request.flag_urgencia)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    setError('')
    try {
      if (cancelling) await cancelRequest(request.id, reason)
      else
        await updateRequest(request.id, {
          categoria: category.trim(),
          flag_urgencia: urgent,
          data_necessidade: new Date(neededAt).toISOString(),
        })
      reload()
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Não foi possível salvar a solicitação.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className={styles.card} title="Ações da solicitação">
      {error && <p role="alert">{error}</p>}
      <div className={styles.actions}>
        {request.pode_editar && (
          <Button
            variant="secondary"
            disabled={saving}
            onClick={() => {
              setEditing(true)
              setCancelling(false)
              setError('')
            }}
          >
            Editar solicitação
          </Button>
        )}
        {request.pode_cancelar && (
          <Button
            variant="danger"
            disabled={saving}
            onClick={() => {
              setCancelling(true)
              setEditing(false)
              setError('')
            }}
          >
            Cancelar solicitação
          </Button>
        )}
      </div>
      {(editing || cancelling) && (
        <form className={styles.editForm} onSubmit={submit}>
          {cancelling ? (
            <>
              <p>
                Confirme o cancelamento informando o motivo. Viagens agendadas ou em
                deslocamento também serão canceladas.
              </p>
              <TextAreaField
                label="Motivo do cancelamento"
                value={reason}
                onChange={setReason}
                required
                maxLength={500}
                disabled={saving}
              />
            </>
          ) : (
            <>
              <TextField
                label="Categoria"
                value={category}
                onChange={setCategory}
                required
                maxLength={50}
                disabled={saving}
              />
              <TextField
                label="Data e horário de necessidade"
                type="datetime-local"
                value={neededAt}
                onChange={setNeededAt}
                required
                disabled={saving}
              />
              <CheckboxField
                label="Solicitação urgente"
                variant="plain"
                checked={urgent}
                onChange={setUrgent}
                disabled={saving}
              />
            </>
          )}
          <div className={styles.actions}>
            <Button
              type="submit"
              variant={cancelling ? 'danger' : 'primary'}
              isLoading={saving}
              disabled={cancelling ? !reason.trim() : !category.trim() || !neededAt}
            >
              {cancelling ? 'Confirmar cancelamento' : 'Salvar alterações'}
            </Button>
            <Button
              variant="secondary"
              disabled={saving}
              onClick={() => {
                setEditing(false)
                setCancelling(false)
              }}
            >
              Voltar sem salvar
            </Button>
          </div>
        </form>
      )}
      <StateMessage
        title="Aprovação, recusa e atribuição indisponíveis"
        description="Essas ações ainda não estão disponíveis. Nenhuma alteração é simulada."
      />
    </Card>
  )
}

export function RequestDetailsPage() {
  useDocumentTitle('Detalhes da solicitação')
  const { id = '' } = useParams()
  const load = useCallback(() => getRequestDetails(id), [id])
  const result = useAsync(load)
  return (
    <section className={styles.page}>
      <Link to="/viagens/solicitacoes" className={styles.back}>
        ← Voltar para solicitações pendentes
      </Link>
      {result.status === 'loading' && (
        <StateMessage variant="loading" title="Carregando solicitação" />
      )}
      {result.status === 'error' && (
        <StateMessage
          variant="error"
          title="Não foi possível carregar a solicitação"
          description={
            result.error instanceof Error ? result.error.message : 'Tente novamente.'
          }
          action={<Button onClick={result.reload}>Tentar novamente</Button>}
        />
      )}
      {result.status === 'success' && (
        <>
          <header className={styles.header}>
            <div>
              <h1>Detalhes da Solicitação #{result.data.id.slice(0, 8)}</h1>
              <p>Solicitada em {dateTime(result.data.criado_em)}</p>
            </div>
            <Badge variant="info">{result.data.status}</Badge>
          </header>
          <div className={styles.grid}>
            <Card title="Solicitação" className={styles.card}>
              <dl>
                <dt>Identificador</dt>
                <dd>{result.data.id}</dd>
                <dt>Categoria</dt>
                <dd>{result.data.categoria}</dd>
                <dt>Necessidade</dt>
                <dd>{dateTime(result.data.data_necessidade)}</dd>
                <dt>Urgência</dt>
                <dd>{result.data.flag_urgencia ? 'Urgente' : 'Normal'}</dd>
                {result.data.motivo_cancelamento && (
                  <>
                    <dt>Cancelamento</dt>
                    <dd>{result.data.motivo_cancelamento}</dd>
                  </>
                )}
              </dl>
            </Card>
            <Card title="Solicitante" className={styles.card}>
              <dl>
                <dt>Nome</dt>
                <dd>{result.data.solicitante_nome || 'Não informado'}</dd>
                <dt>Setor</dt>
                <dd>{result.data.setor_nome || 'Não informado'}</dd>
              </dl>
              <p>Rota, carga e contato não foram informados nesta solicitação.</p>
            </Card>
            <Card title="Histórico de status" className={styles.card}>
              {result.data.historico.length ? (
                <ol className={styles.history}>
                  {result.data.historico.map((entry) => (
                    <li key={entry.id}>
                      <strong>
                        {entry.status_anterior ? `${entry.status_anterior} → ` : ''}
                        {entry.status_novo}
                      </strong>
                      <time dateTime={entry.data_hora}>{dateTime(entry.data_hora)}</time>
                      {entry.motivo && <p>{entry.motivo}</p>}
                    </li>
                  ))}
                </ol>
              ) : (
                <p>Nenhuma mudança de status registrada.</p>
              )}
            </Card>
            <RequestActions
              key={result.data.id}
              request={result.data}
              reload={result.reload}
            />
          </div>
        </>
      )}
    </section>
  )
}
