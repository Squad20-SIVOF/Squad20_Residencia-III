
import { Link } from 'react-router-dom';
import { ArrowUpRight, Info } from 'lucide-react';

import type { Trip } from '../../types';
import styles from './TripCard.module.scss';

interface TripCardProps {
  trip: Trip;
  isSelected: boolean;
  onSelect: (tripId: number) => void;
}

export function TripCard({
  trip,
  isSelected,
  onSelect,
}: TripCardProps) {
  return (
    <article
      className={`${styles.card} ${
        isSelected ? styles.selected : ''
      }`}
    >
      <button
        type="button"
        className={styles.cardContent}
        aria-pressed={isSelected}
        onClick={() => onSelect(trip.id)}
      >
        <span className={styles.top}>
          <span className={styles.title}>
            Rota #{trip.id}
          </span>

          <span className={`${styles.status} ${styles[trip.tone]}`}>
            {trip.status}
          </span>
        </span>

        <span className={styles.meta}>
          {trip.plate} · {trip.driver}
        </span>

        <span className={styles.route}>
          {trip.from} <span aria-hidden="true">→</span> {trip.to}
        </span>
      </button>

      <Link
        to={`/viagens/${trip.id}`}
        className={styles.detailsButton}
        aria-label={`Ver detalhes da viagem ${trip.id}`}
      >
        Ver detalhes
        <Info size={14} aria-hidden="true" />
      </Link>
    </article>
  );
}
