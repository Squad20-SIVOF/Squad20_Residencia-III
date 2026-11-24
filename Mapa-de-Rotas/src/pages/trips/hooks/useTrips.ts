import { useCallback } from 'react';
import { useAsync } from '@/hooks/useAsync';
import { getTrips } from '../services/tripService';

export function useTrips() {
  const loadTrips = useCallback(() => getTrips(), []);
  return useAsync(loadTrips);
}
