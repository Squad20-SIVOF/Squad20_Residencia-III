export type TripTone = 'blue' | 'green' | 'red' | 'yellow';
export type Coordinates = [latitude: number, longitude: number];

export interface Trip {
  id: number;
  plate: string;
  driver: string;
  SolNome:string;
  SolSetor:string;
  SolContato:string;
  from: string;
  to: string;
  status: string;
  tone: TripTone;
  distance: string;
  updated: string;
  start: Coordinates;
  end: Coordinates;
  path: Coordinates[];
}
