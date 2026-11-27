import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { ButtonLink } from '@/components/ButtonLink'
import { LoadingState } from '@/components/LoadingState/LoadingState'
import { PageHeader } from '@/components/PageHeader'
import { StateMessage } from '@/components/StateMessage'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatShortDateTime, formatTime } from '@/utils/format'
import {
  severity,
  type Notification,
  type NotificationData,
  type NotificationFeedResult,
} from './notificationFeed'
import styles from './NotificationsPage.module.scss'

function readNotifications(storageKey: string): string[] {
  try {
    const stored: unknown = JSON.parse(sessionStorage.getItem(storageKey) ?? '[]')
    return Array.isArray(stored)
      ? stored.filter((value): value is string => typeof value === 'string')
      : []
  } catch {
    return []
  }
}

function NotificationsContent({
  data,
  onRetry,
}: {
  data: NotificationData
  onRetry: () => void
}) {
  const { notifications, storageKey, updatedAt, hasPartialError } = data
  const [read, setRead] = useState(() => readNotifications(storageKey))
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const unread = notifications.filter((item) => !read.includes(item.id))
  const pendingAlerts = unread.filter((item) => item.tone !== 'success').length
  const visible = filter === 'all' ? notifications : unread

  function markAsRead(items: Notification[]) {
    const next = [...new Set([...read, ...items.map((item) => item.id)])]
    setRead(next)
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(next))
    } catch {
      // A leitura continua disponível durante a visita.
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <PageHeader
          title="Notificações"
          subtitle="Acompanhe os alertas e as atividades importantes da sua frota."
        />
        <Button
          variant="secondary"
          onClick={() => markAsRead(unread)}
          disabled={!unread.length}
        >
          Marcar todas como lidas
        </Button>
      </div>

      {pendingAlerts > 0 && (
        <div className={styles.alert}>
          <AlertTriangle size={20} aria-hidden="true" />
          <div>
            <strong>
              {pendingAlerts === 1
                ? '1 alerta precisa da sua atenção'
                : `${pendingAlerts} alertas precisam da sua atenção`}
            </strong>
            <p>Priorize a regularização das pendências de CNH e revisão da frota.</p>
          </div>
        </div>
      )}

      {hasPartialError && (
        <StateMessage
          variant="error"
          title="Não foi possível carregar todas as notificações."
          action={
            <Button variant="secondary" onClick={onRetry}>
              Tentar novamente
            </Button>
          }
        />
      )}

      <section className={styles.feed} aria-label="Lista de notificações">
        <div className={styles.toolbar}>
          <fieldset className={styles.filters} aria-label="Filtrar notificações">
            <Button
              variant="secondary"
              aria-pressed={filter === 'all'}
              onClick={() => setFilter('all')}
            >
              Todas ({notifications.length})
            </Button>
            <Button
              variant="secondary"
              aria-pressed={filter === 'unread'}
              onClick={() => setFilter('unread')}
            >
              Não lidas ({unread.length})
            </Button>
          </fieldset>
          <span>Prioridade primeiro</span>
        </div>

        <div className={styles.list}>
          {visible.length === 0 ? (
            <StateMessage
              title={
                filter === 'unread'
                  ? 'Nenhuma notificação não lida.'
                  : 'Nenhuma notificação encontrada.'
              }
            />
          ) : (
            visible.map((item) => {
              const isRead = read.includes(item.id)
              const Icon = item.icon

              return (
                <article className={styles.notification} key={item.id}>
                  <span className={styles.icon} data-tone={item.tone} aria-hidden="true">
                    <Icon size={21} />
                  </span>
                  <div className={styles.content}>
                    <h2>{item.title}</h2>
                    <p>{item.description}</p>
                    {item.context && <p className={styles.context}>{item.context}</p>}
                  </div>
                  <div className={styles.status}>
                    <Badge variant={item.tone}>{severity[item.tone].label}</Badge>
                    {isRead ? (
                      <span>Lida</span>
                    ) : (
                      <button
                        type="button"
                        className={styles.unread}
                        aria-label={`Marcar como lida: ${item.title} — ${item.context}`}
                        onClick={() => markAsRead([item])}
                      >
                        Não lida
                      </button>
                    )}
                    {item.timestamp && (
                      <time dateTime={item.timestamp}>
                        {formatShortDateTime(item.timestamp)}
                      </time>
                    )}
                  </div>
                  {item.to && (
                    <ButtonLink
                      className={styles.action}
                      variant="secondary"
                      to={item.to}
                      onClick={() => markAsRead([item])}
                    >
                      {item.action}
                    </ButtonLink>
                  )}
                </article>
              )
            })
          )}
        </div>
      </section>

      <footer className={styles.footer}>
        <span aria-live="polite">
          {notifications.length}{' '}
          {notifications.length === 1 ? 'notificação' : 'notificações'} · {unread.length}{' '}
          {unread.length === 1 ? 'não lida' : 'não lidas'}
        </span>
        <span>
          Atualizado às <time dateTime={updatedAt}>{formatTime(updatedAt)}</time>
        </span>
      </footer>
    </div>
  )
}

export function NotificationsPage() {
  useDocumentTitle('Notificações')
  const result = useOutletContext<NotificationFeedResult>()

  if (result.status === 'loading') return <LoadingState label="Carregando notificações" />
  if (result.status === 'error') {
    return (
      <StateMessage
        variant="error"
        title="Não foi possível carregar as notificações"
        action={
          <Button variant="secondary" onClick={result.reload}>
            Tentar novamente
          </Button>
        }
      />
    )
  }
  if (!result.data) {
    return (
      <div className={styles.page}>
        <PageHeader title="Notificações" />
        <StateMessage title="Nenhuma notificação encontrada." />
      </div>
    )
  }
  return (
    <NotificationsContent
      key={result.data.storageKey}
      data={result.data}
      onRetry={result.reload}
    />
  )
}
