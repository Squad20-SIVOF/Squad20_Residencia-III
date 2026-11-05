import RegistrarAbastecimento from '@/pages/abastecimentos/registrar/RegistrarAbastecimento'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
export function DriverFuelPage() {
  useDocumentTitle('Registrar abastecimento')
  return <RegistrarAbastecimento mode="driver" />
}
