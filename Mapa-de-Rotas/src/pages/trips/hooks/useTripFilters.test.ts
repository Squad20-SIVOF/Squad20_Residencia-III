import { describe, expect, it } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTripFilters } from './useTripFilters';
import type { Trip } from '../types';

const trips: Trip[] = [{ id: 101, plate: 'ABC-1D23', driver: 'João da Silva', from: 'Central SVO', to: 'Posto Sul', status: 'Em viagem', tone: 'blue', distance: '8,4 km restantes', updated: 'há 1 min', start: [-10.9,-37], end: [-10.91,-37.01], path: [[-10.9,-37],[-10.91,-37.01]] }];

describe('useTripFilters', () => {
  it('filtra por placa sem diferenciar maiúsculas', () => {
    const { result } = renderHook(() => useTripFilters(trips));
    act(() => result.current.setQuery('abc-1d23'));
    expect(result.current.filteredTrips).toHaveLength(1);
  });
  it('retorna lista vazia quando não encontra correspondência', () => {
    const { result } = renderHook(() => useTripFilters(trips));
    act(() => result.current.setQuery('ônibus inexistente'));
    expect(result.current.filteredTrips).toHaveLength(0);
  });
});
