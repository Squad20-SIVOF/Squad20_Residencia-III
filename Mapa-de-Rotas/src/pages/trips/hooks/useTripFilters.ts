import { useMemo, useState } from 'react';
import type { Trip } from '../types';

export function useTripFilters(trips: Trip[]) {
  const [query, setQuery] = useState('');
  const filteredTrips = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
    if (!normalizedQuery) return trips;
    return trips.filter((trip) => [trip.id, trip.plate, trip.driver, trip.from, trip.to].join(' ').toLocaleLowerCase('pt-BR').includes(normalizedQuery));
  }, [query, trips]);
  return { query, setQuery, filteredTrips };
}
