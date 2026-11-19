import type { Coordinate } from './geoEventBus'

export interface RoutePreset {
  id: string
  originName: string
  coordinates: Coordinate[]
  deviationCoordinates: Coordinate[]
}

export const SHOPPING_JARDINS: Coordinate = [-10.9432674, -37.059823]

export const ROUTE_PRESETS: RoutePreset[] = [
  {
    id: 'atalaia',
    originName: 'Arcos da Orla de Atalaia',
    coordinates: [
      [-10.9886998, -37.0489025],
      [-10.9825, -37.0439],
      [-10.9742126, -37.0381916],
      [-10.9696957, -37.0361831],
      [-10.9585, -37.0432],
      [-10.9452778, -37.0477778],
      [-10.941914, -37.0494155],
      [-10.9443374, -37.0533389],
      [-10.9438, -37.0568],
      SHOPPING_JARDINS,
    ],
    deviationCoordinates: [
      [-10.96245, -37.05882],
      [-10.9558, -37.0522],
      [-10.9502, -37.0508],
      [-10.9462, -37.0585],
      SHOPPING_JARDINS,
    ],
  },
  {
    id: 'centro',
    originName: 'Praça Fausto Cardoso (Centro)',
    coordinates: [
      [-10.9132965, -37.0486965],
      [-10.9212, -37.0452],
      [-10.926581, -37.0430694],
      [-10.9321918, -37.0475641],
      [-10.9372, -37.049],
      [-10.9412, -37.0498],
      [-10.9443374, -37.0533389],
      [-10.9438, -37.0568],
      SHOPPING_JARDINS,
    ],
    deviationCoordinates: [
      [-10.93512, -37.05798],
      [-10.9368, -37.0578],
      [-10.9405, -37.059],
      SHOPPING_JARDINS,
    ],
  },
]
