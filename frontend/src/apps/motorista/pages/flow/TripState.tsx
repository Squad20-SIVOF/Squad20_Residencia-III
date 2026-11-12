import { Button } from '@/components/Button'
import { StateMessage } from '@/components/StateMessage'
export function TripState({ error, reload }: { error?: unknown; reload: () => void }) {
  return error ? (
    <StateMessage
      variant="error"
      title="Não foi possível carregar a viagem"
      description={error instanceof Error ? error.message : 'Tente novamente.'}
      action={<Button onClick={reload}>Tentar novamente</Button>}
    />
  ) : (
    <StateMessage variant="loading" title="Carregando viagem" />
  )
}
