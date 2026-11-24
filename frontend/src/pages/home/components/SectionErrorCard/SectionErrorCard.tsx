import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { StateMessage } from '@/components/StateMessage'

export interface SectionErrorCardProps {
  title: string
  message: string
  onRetry: () => void
  className?: string
}

/** Bloco do dashboard cuja fonte de dados falhou; os demais continuam visíveis. */
export function SectionErrorCard({
  title,
  message,
  onRetry,
  className,
}: SectionErrorCardProps) {
  return (
    <Card title={title} className={className}>
      <StateMessage
        variant="error"
        title={message}
        action={
          <Button variant="secondary" onClick={onRetry}>
            Tentar novamente
          </Button>
        }
      />
    </Card>
  )
}
