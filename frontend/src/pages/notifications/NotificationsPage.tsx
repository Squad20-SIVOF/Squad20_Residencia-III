import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button'
import { StateMessage } from '@/components/StateMessage'
import { useAsync } from '@/hooks/useAsync'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { getAlertSummary } from '@/service/alertService'
import type { AlertSummary } from '@/service/alertService'
import styles from './NotificacoesPage.module.scss'

type Tipo = 'danger' | 'warning' | 'success'

interface Notificacao {
  id: string
  tipo: Tipo
  titulo: string
  descricao: string
  destino: string
  botao: string
}

function criarNotificacoes(resumo: AlertSummary): Notificacao[] {
  const cnh = resumo.cnh.itens.map((alert) => ({
    id: `cnh-${alert.id}`,
    tipo: (alert.severity === 'critica' ? 'danger' : 'warning') as Tipo,
    titulo: `CNH de ${alert.nome}`,
    descricao:
      alert.dias_restantes < 0
        ? `CNH vencida há ${Math.abs(alert.dias_restantes)} dias. Validade: ${alert.validade_cnh}.`
        : `CNH vence em ${alert.dias_restantes} dias. Validade: ${alert.validade_cnh}.`,
    destino: `/motoristas/${encodeURIComponent(alert.id)}`,
    botao: 'Ver motorista',
  }))

  const manutencoes = resumo.manutencao.itens.map((alert) => ({
    id: `manutencao-${alert.id}`,
    tipo: (alert.severity === 'critica' ? 'danger' : 'warning') as Tipo,
    titulo: `Manutenção do veículo ${alert.placa}`,
    descricao:
      alert.km_restantes <= 0
        ? `Revisão ultrapassada em ${Math.abs(alert.km_restantes)} km. Odômetro: ${alert.quilometragem} km.`
        : `Revisão próxima em ${alert.km_restantes} km. Odômetro: ${alert.quilometragem} km.`,
    destino: '/manutencoes',
    botao: 'Ver manutenção',
  }))

  return [...cnh, ...manutencoes]
}

export function NotificationsPage() {
  useDocumentTitle('Notificações')
  const navigate = useNavigate()
  const result = useAsync(getAlertSummary)
  const [lidas, setLidas] = useState<string[]>([])
  const [filtro, setFiltro] = useState<'todas' | 'naoLidas'>('todas')

  if (result.status === 'loading') {
    return <StateMessage variant="loading" title="Carregando notificações..." />
  }

  if (result.status === 'error') {
    return (
      <StateMessage
        variant="error"
        title="Não foi possível carregar as notificações"
        description={
          result.error instanceof Error
            ? result.error.message
            : 'Tente novamente em instantes.'
        }
        action={
          <Button variant="secondary" onClick={result.reload}>
            Tentar novamente
          </Button>
        }
      />
    )
  }

  const notificacoes = criarNotificacoes(result.data)
  const naoLidas = notificacoes.filter((item) => !lidas.includes(item.id)).length
  const visiveis = notificacoes.filter(
    (item) => filtro === 'todas' || !lidas.includes(item.id),
  )

  function marcarComoLida(id: string) {
    setLidas((atual) => (atual.includes(id) ? atual : [...atual, id]))
  }

  function marcarTodasComoLidas() {
    setLidas((atual) => [...new Set([...atual, ...notificacoes.map((item) => item.id)])])
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Notificações</h1>
          <p>Acompanhe os alertas e atualizações da sua frota.</p>
        </div>

        <button
          type="button"
          className={styles.markAll}
          onClick={marcarTodasComoLidas}
          disabled={naoLidas === 0}
        >
          ✓ Marcar todas como lidas
        </button>
      </header>

      {naoLidas > 0 && (
        <div className={styles.alert}>
          <span className={styles.alertIcon}>!</span>
          <div>
            <strong>
              Você tem {naoLidas}{' '}
              {naoLidas === 1 ? 'notificação não lida' : 'notificações não lidas'}
            </strong>
            <p>Verifique os alertas que precisam de sua atenção.</p>
          </div>
        </div>
      )}

      <section className={styles.panel}>
        <div className={styles.tabs}>
          <button
            type="button"
            className={filtro === 'todas' ? styles.activeTab : ''}
            onClick={() => setFiltro('todas')}
          >
            Todas <span>{notificacoes.length}</span>
          </button>
          <button
            type="button"
            className={filtro === 'naoLidas' ? styles.activeTab : ''}
            onClick={() => setFiltro('naoLidas')}
          >
            Não lidas <span>{naoLidas}</span>
          </button>
        </div>

        <div className={styles.list}>
          {visiveis.length === 0 ? (
            <div className={styles.empty}>Nenhuma notificação encontrada.</div>
          ) : (
            visiveis.map((item) => {
              const lida = lidas.includes(item.id)

              return (
                <article
                  key={item.id}
                  className={`${styles.notification} ${styles[item.tipo]} ${lida ? styles.read : ''}`}
                >
                  <div className={styles.notificationIcon}>
                    {item.tipo === 'danger' ? '!' : '⚠'}
                  </div>

                  <div className={styles.notificationContent}>
                    <div className={styles.notificationTop}>
                      <h2>{item.titulo}</h2>
                    </div>
                    <p>{item.descricao}</p>

                    <div className={styles.notificationActions}>
                      <button
                        type="button"
                        className={styles.actionButton}
                        onClick={() => {
                          marcarComoLida(item.id)
                          navigate(item.destino)
                        }}
                      >
                        {item.botao}
                      </button>

                      {!lida && (
                        <button
                          type="button"
                          className={styles.readButton}
                          onClick={() => marcarComoLida(item.id)}
                        >
                          Marcar como lida
                        </button>
                      )}
                    </div>
                  </div>

                  {!lida && <span className={styles.unreadDot} />}
                </article>
              )
            })
          )}
        </div>
      </section>
    </main>
  )
}
