// Acesso aos dados dos veículos. Substitua o mock pela API quando ela estiver disponível.
export const initialVehicles = [
 {id:'SVO-01', brand:'Fiat', model:'Fiat Fiorino 1.4', plate:'ABC-1D23', km:'45.320 km', status:'Ativo', fleet:'Administrativa', fuel:'Flex (gasolina e etanol)', capacity:'58 L', budget:'R$ 1.000,00'},
 {id:'SVO-02', brand:'Renault', model:'Renault Master', plate:'EFG-4H56', km:'30.150 km', status:'Manutenção', fleet:'Operacional', fuel:'Diesel', capacity:'80 L', budget:'R$ 1.500,00'},
 {id:'SVO-03', brand:'Chevrolet', model:'Chevrolet Spin', plate:'IJK-7L89', km:'88.905 km', status:'Em viagem', fleet:'Administrativa', fuel:'Flex (gasolina e etanol)', capacity:'53 L', budget:'R$ 900,00'},
 {id:'SVO-04', brand:'Volkswagen', model:'Volkswagen Saveiro', plate:'MNO-0P12', km:'15.402 km', status:'Inativo', fleet:'Operacional', fuel:'Flex (gasolina e etanol)', capacity:'55 L', budget:'R$ 800,00'},
 {id:'SVO-05', brand:'Fiat', model:'Fiat Ducato', plate:'QRS-3T45', km:'59.700 km', status:'Ativo', fleet:'Operacional', fuel:'Diesel', capacity:'90 L', budget:'R$ 1.800,00'},
 {id:'SVO-06', brand:'Toyota', model:'Toyota Corolla', plate:'KLM-8N21', km:'42.110 km', status:'Manutenção', fleet:'Administrativa', fuel:'Flex (gasolina e etanol)', capacity:'50 L', budget:'R$ 1.000,00'},
 ...Array.from({length:18},(_,i)=>({id:`SVO-${String(i+7).padStart(2,'0')}`,brand:['Fiat','Renault','Chevrolet'][i%3],model:['Fiat Strada','Renault Kangoo','Chevrolet Onix'][i%3],plate:`XYZ-${i}A${i+1}2`,km:`${26+i*2}.400 km`,status:['Ativo','Em viagem','Ativo','Manutenção'][i%4],fleet:i%2?'Operacional':'Administrativa',fuel:'Flex (gasolina e etanol)',capacity:'58 L',budget:'R$ 1.000,00'}))
];

const STORAGE_KEY = 'fm_vehicles_list';

export function getVehicles() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : initialVehicles;
  } catch {
    return initialVehicles;
  }
}

export function saveVehicles(vehicles) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
}
