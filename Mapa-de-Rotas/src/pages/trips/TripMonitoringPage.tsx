import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Navigation, Search, ShieldCheck } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { StateMessage } from '@/components/StateMessage';
import { useTrips } from './hooks/useTrips';
import { useTripFilters } from './hooks/useTripFilters';
import { TripCard } from './components/TripCard';
import { RouteMap } from './components/RouteMap';
import styles from './TripMonitoringPage.module.scss';

export function TripMonitoringPage() {
  useDocumentTitle('Monitoramento de viagens');
  const { data: trips, isLoading, error, reload } = useTrips();
  const [selectedId, setSelectedId] = useState(101);
  const { query, setQuery, filteredTrips } = useTripFilters(trips ?? []);
  const selectedTrip = trips?.find((trip) => trip.id === selectedId) ?? trips?.[0];
  const activeTrips = trips?.filter((trip) => trip.tone !== 'yellow').length ?? 0;

  return (
    <>
      <header className={styles.pageHeader}>
        <a className={styles.backLink} href="/viagens"><ArrowLeft size={14} aria-hidden="true" /> Voltar para o Painel de Viagens</a>
        <h1>Monitoramento de Viagens</h1>
        <p>Acompanhe deslocamentos e ocorrências da frota em tempo real</p>
      </header>
      {isLoading && <StateMessage title="Carregando viagens…" />}
      {error && <StateMessage title="Não foi possível carregar as viagens" description={error.message} action={{ label: 'Tentar novamente', onClick: () => void reload() }} />}
      {trips && (
        <>
          <section className={styles.toolbar} aria-label="Filtros de viagens">
            <label className={styles.searchBox}><Search size={16} aria-hidden="true" /><span className={styles.visuallyHidden}>Buscar veículo, motorista ou rota</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar veículo, motorista ou rota…" /></label>
            <span className={styles.activeCount}>{activeTrips} viagens ativas</span>
          </section>
          <section className={styles.monitorLayout}>
            <div className={styles.tripList} aria-label="Lista de viagens">
              {filteredTrips.length ? filteredTrips.map((trip) => <TripCard key={trip.id} trip={trip} isSelected={selectedTrip?.id === trip.id} onSelect={setSelectedId} />) : <StateMessage title="Nenhuma viagem encontrada" description="Tente buscar por outra placa, motorista ou rota." />}
            </div>
            {selectedTrip && <div className={styles.mapColumn}>
              <RouteMap trip={selectedTrip} />
              <div className={styles.tripDetails}>
                <div><strong>Origem-<MapPin size={13} aria-hidden="true" />{selectedTrip.from}</strong></div>
                <div><strong>Destino-<MapPin size={13} aria-hidden="true" />{selectedTrip.to}</strong></div>
                <div className={styles.remaining}><Navigation size={14} aria-hidden="true" />{selectedTrip.distance}</div>
              </div>
              <p className={styles.mapFootnote}><ShieldCheck size={14} aria-hidden="true" /> Visualização demonstrativa · Dados simulados</p>
            </div>}
          </section>
        </>
      )}
    </>
  );
}
