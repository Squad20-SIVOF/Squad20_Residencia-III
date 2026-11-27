import type { Driver } from '@/pages/drivers/types'
import type { Vehicle } from '@/pages/vehicles/types'
import type { AssignmentRequestSummary } from '../types'

interface AssignmentExample extends AssignmentRequestSummary {
  important: boolean
  schedule: string
  category: string
}

export const assignmentExamples: AssignmentExample[] = [
  {
    id: 'exemplo-2401',
    code: '2401',
    important: true,
    schedule: 'Hoje · 10:30',
    sector: 'Logística',
    origin: 'Central SVO',
    destination: 'Posto Sul',
    category: 'Equipamentos',
    cargo: 'Equipamentos · 120 kg · 4 caixas',
    stops: ['Terminal Norte', 'Base SVO'],
  },
  {
    id: 'exemplo-2402',
    code: '2402',
    important: false,
    schedule: 'Hoje · 14:00',
    sector: 'Administrativo',
    origin: 'Terminal Norte',
    destination: 'Base SVO',
    category: 'Documentos Oficiais',
    cargo: 'Documentos Oficiais',
    stops: null,
  },
]

const vehicles = [
  {
    id: 'exemplo-fiorino',
    model: 'Fiat Fiorino',
    plate: 'ABC1D23',
    kind: 'Furgão',
    cargoKg: 650,
  },
  {
    id: 'exemplo-kangoo',
    model: 'Renault Kangoo',
    plate: 'DEF4G56',
    kind: 'Furgão',
    cargoKg: 750,
  },
  {
    id: 'exemplo-strada',
    model: 'Fiat Strada',
    plate: 'GHI7J89',
    kind: 'Picape',
    cargoKg: 720,
  },
]

export const assignmentExampleVehicles: Vehicle[] = vehicles.map(
  ({ id, model, plate }) => ({
    id,
    identification: id,
    model,
    plate,
    fuelType: 'Flex',
    maxCapacity: 2,
    status: 'ativo',
    mileageKm: 0,
    fleet: 'Administrativa',
    nextInspection: '',
  }),
)

export const assignmentExampleSpecs = Object.fromEntries(
  vehicles.map(({ id, kind, cargoKg }) => [
    id,
    `${kind} · Capacidade: ${cargoKg} kg · CNH B`,
  ]),
)

const drivers = [
  {
    id: 'exemplo-ana',
    name: 'Ana Martins',
    cnh: '00123456789',
    cnhCategory: 'D',
    cnhExpiry: '2028-06-18',
  },
  {
    id: 'exemplo-carlos',
    name: 'Carlos Santos',
    cnh: '00567891234',
    cnhCategory: 'B',
    cnhExpiry: '2028-09-22',
  },
  {
    id: 'exemplo-renata',
    name: 'Renata Costa',
    cnh: '00891234567',
    cnhCategory: 'D',
    cnhExpiry: '2029-03-15',
  },
] satisfies Pick<Driver, 'id' | 'name' | 'cnh' | 'cnhCategory' | 'cnhExpiry'>[]

export const assignmentExampleDrivers: Driver[] = drivers.map((driver) => ({
  ...driver,
  cpf: '',
  phone: '',
  email: '',
  fleet: 'Administrativa',
  vehicles: [],
  isWildcard: false,
  status: 'ativo',
  createdAt: '',
}))
