import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './NotificacoesPage.module.scss'

type Tipo = 'danger' | 'warning' | 'success'

interface Notificacao {
  id: number
  tipo: Tipo
  titulo: string
  descricao: string
  horario: string
  destino: string
  botao: string
  lida: boolean
}

const notificacoesIniciais: Notificacao[] = [
  {
    id: 1,
    tipo: 'danger',
    titulo: 'CNH vencida',
    descricao: 'A CNH do motorista João Silva está vencida. Regularize a situação antes de liberar novas viagens.',
    horario: 'Hoje, 09:15',
    destino: '/motoristas',
    botao: 'Ver motorista',
    lida: false,
  },
  {
    id: 2,
    tipo: 'warning',
    titulo: 'Manutenção atrasada',
    descricao: 'O veículo SVO-02 possui uma manutenção pendente fora do prazo previsto.',
    horario: 'Hoje, 08:40',
    destino: '/manutencoes',
    botao: 'Ver manutenção',
    lida: false,
  },
  {
    id: 3,
    tipo: 'success',
    titulo: 'Abastecimento registrado',
    descricao: 'Um novo abastecimento foi registrado com sucesso no sistema.',
    horario: 'Ontem, 16:30',
    destino: '/abastecimentos',
    botao: 'Ver abastecimento',
    lida: true,
  },
]

export function NotificacoesPage() {
  const navigate = useNavigate()
  const [notificacoes, setNotificacoes] = useState(notificacoesIniciais)
  const [filtro, setFiltro] = useState<'todas' | 'naoLidas'>('todas')

  const naoLidas = notificacoes.filter((item) => !item.lida).length

  const visiveis = notificacoes.filter(
    (item) => filtro === 'todas' || !item.lida
  )

  function marcarComoLida(id: number) {
    setNotificacoes((atual) =>
      atual.map((item) =>
        item.id === id ? { ...item, lida: true } : item
      )
    )
  }

  function marcarTodasComoLidas() {
    setNotificacoes((atual) =>
      atual.map((item) => ({ ...item, lida: true }))
    )
  }

  return (
    <div className={styles.page}>
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
              Você tem {naoLidas} {naoLidas === 1 ? 'notificação não lida' : 'notificações não lidas'}
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
            <div className={styles.empty}>
              Nenhuma notificação encontrada.
            </div>
          ) : (
            visiveis.map((item) => (
              <article
                key={item.id}
                className={`${styles.notification} ${styles[item.tipo]} ${item.lida ? styles.read : ''}`}
              >
                <div className={styles.notificationIcon}>
                  {item.tipo === 'danger' ? '!' : item.tipo === 'warning' ? '⚠' : '✓'}
                </div>

                <div className={styles.notificationContent}>
                  <div className={styles.notificationTop}>
                    <h2>{item.titulo}</h2>
                    <span className={styles.time}>{item.horario}</span>
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

                    {!item.lida && (
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

                {!item.lida && <span className={styles.unreadDot} />}
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
