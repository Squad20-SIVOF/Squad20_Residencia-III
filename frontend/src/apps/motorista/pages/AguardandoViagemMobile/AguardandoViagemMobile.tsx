import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { ButtonLink } from '@/components/ButtonLink'
import { Card } from '@/components/Card'
import { StateMessage } from '@/components/StateMessage'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useDriverHome } from '../../hooks'
import car from '../../assets/car-front.svg'
import styles from './AguardandoViagemMobile.module.scss'
export function AguardandoViagemMobile() {
  useDocumentTitle('Aguardando viagem')
  const result = useDriverHome()
  if (result.status === 'loading')
    return <StateMessage variant="loading" title="Carregando suas viagens" />
  if (result.status === 'error')
    return (
      <StateMessage
        variant="error"
        title="Não foi possível carregar seu dia"
        description={
          result.error instanceof Error ? result.error.message : 'Tente novamente.'
        }
        action={<Button onClick={result.reload}>Tentar novamente</Button>}
      />
    )
  const { motorista, viagem } = result.data
  return (
    <div className={styles.screen}>
      <div className={styles.main}>
        <section className={styles.summary}>
          <h1>Olá, {motorista.nome.split(' ')[0]}</h1>
          <Badge variant={viagem ? 'info' : 'success'}>
            {viagem?.status ?? 'Disponível'}
          </Badge>
        </section>
        {viagem ? (
          <Card title="Próxima viagem">
            <p>
              #{viagem.id.slice(0, 8)} · {viagem.categoria ?? 'Categoria não informada'}
            </p>
            <p>
              {viagem.modelo} · {viagem.placa}
            </p>
            {viagem.data_necessidade && (
              <p>{new Date(viagem.data_necessidade).toLocaleString('pt-BR')}</p>
            )}
          </Card>
        ) : (
          <section className={styles.waitingCard}>
            <div className={styles.waitingContent}>
              <span className={styles.waitingSymbol}>
                <img src={car} alt="" />
              </span>
              <h2>Aguardando solicitações...</h2>
              <p>Nenhuma viagem atribuída no momento. Fique atento às atualizações.</p>
            </div>
          </section>
        )}
        <Button variant="secondary" onClick={result.reload}>
          Atualizar viagens
        </Button>
      </div>
      <footer className={styles.vehicleIdentification}>
        <ButtonLink isFullWidth to="/veiculo-sessao">
          Identificar veículo
        </ButtonLink>
        {viagem && (
          <ButtonLink variant="secondary" isFullWidth to={`/viagens/${viagem.id}`}>
            Consultar viagem
          </ButtonLink>
        )}
      </footer>
    </div>
  )
}
