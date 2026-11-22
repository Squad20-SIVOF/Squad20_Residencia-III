import { ArrowLeft, CarFront, MapPin, UserRound } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { StateMessage } from '@/components/StateMessage';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useTrips } from '@/pages/trips/hooks/useTrips';
import { InfoCard } from './components/InfoCard';
import { RouteMap } from '@/pages/trips/components/RouteMap';
import { RouteSummaryBar } from './components/RouteMap';
import styles from './RouteDetailsPage.module.scss';

export function RouteDetailsPage() {
  const { tripId } = useParams();
  const { data: trips, isLoading, error, reload } = useTrips();
  const trip = trips?.find((item) => item.id === Number(tripId));

  useDocumentTitle(`Detalhes da Rota #${tripId ?? ''}`);

  if (isLoading) {
    return <StateMessage title="Carregando detalhes da viagem…" />;
  }

  if (error) {
    return (
      <StateMessage
        title="Não foi possível carregar os detalhes"
        description={error.message}
        action={{ label: 'Tentar novamente', onClick: () => void reload() }}
      />
    );
  }

  if (!trip) {
    return (
      <div className={styles.page}>
        <PageHeader
          eyebrow={<Link className={styles.backLink} to="/viagens"><ArrowLeft size={14} /> Voltar para o monitoramento</Link>}
          title="Viagem não encontrada"
          description={`Não encontramos a rota ${tripId ?? ''}.`}
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <PageHeader
          eyebrow={<Link className={styles.backLink} to="/viagens"><ArrowLeft size={14} /> Voltar para o Monitoramento de Viagens</Link>}
          title={`Detalhes da Rota #${trip.id}`}
          description={`Última atualização ${trip.updated} · ${trip.status}`}
        />
        <div className={styles.statusLine}>
          <span className={`${styles.status} ${styles[trip.tone]}`}>{trip.status}</span>
        </div>

        <RouteMap trip={trip} />
        <RouteSummaryBar trip={trip} />

        <div className={styles.cards}>
          <InfoCard title="Rota" rows={[
            { label: 'Origem', value: <><MapPin size={13} /> {trip.from}</> },
            { label: 'Destino', value: <><MapPin size={13} /> {trip.to}</> },
            { label: 'Distância restante', value: trip.distance },
            { label: 'Última atualização', value: trip.updated },
          ]} />
          <InfoCard title="Solicitante"rows={[
            { label: 'Nome', value:  trip.SolNome},
            { label: 'Setor', value: trip.SolSetor },
            { label: 'Contato', value: trip.SolContato },
          ]} />
          <InfoCard title="Motorista" rows={[
            { label: 'Nome', value: trip.driver },
            { label: 'Veículo', value: trip.plate },
          ]} />
          <InfoCard title="Veículo atribuído">
            <div className={styles.vehicle}>
              <UserRound size={14} aria-hidden="true" />
              <strong>{trip.driver}</strong>
              <CarFront size={14} aria-hidden="true" />
              <strong>{trip.plate}</strong>
            </div>
          </InfoCard>
          
        </div>
      </div>
    </div>
  );
}
