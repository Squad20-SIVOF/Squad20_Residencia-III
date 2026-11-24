import { useNavigate, useParams } from 'react-router-dom'
import { Breadcrumb } from '@/components/Breadcrumb'
import { ButtonLink } from '@/components/ButtonLink'
import { PageHeader } from '@/components/PageHeader'
import { StateMessage } from '@/components/StateMessage'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { DriverForm } from './components/DriverForm'
import { useDriver } from './hooks/useDriver'
import { createDriver, updateDriver } from './services/driverService'
import type { DriverInput } from './types'
import styles from './DriverFormPage.module.scss'

/** Cadastro (`/motoristas/novo`) e edição (`/motoristas/editar/:id`) de motorista. */
export function DriverFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = id !== undefined
  const driverRequest = useDriver(id)
  const title = isEditing ? 'Editar Motorista' : 'Cadastro de Motorista'
  useDocumentTitle(title)

  async function handleSubmit(input: DriverInput) {
    if (id) await updateDriver(id, input)
    else await createDriver(input)

    navigate('/motoristas', {
      state: {
        flash: isEditing
          ? 'Motorista atualizado com sucesso.'
          : 'Motorista cadastrado com sucesso.',
      },
    })
  }

  function renderContent() {
    if (driverRequest.status === 'loading') {
      return <StateMessage variant="loading" title="Carregando motorista..." />
    }

    if (driverRequest.status === 'error') {
      return (
        <StateMessage
          variant="error"
          title="Motorista não encontrado."
          action={
            <ButtonLink variant="secondary" to="/motoristas">
              Voltar para a lista
            </ButtonLink>
          }
        />
      )
    }

    return (
      <DriverForm
        key={id ?? 'novo'}
        initial={driverRequest.data}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/motoristas')}
      />
    )
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title={title}
        subtitle={
          isEditing
            ? 'Atualize os dados do motorista'
            : 'Preencha os dados do novo motorista'
        }
        breadcrumb={
          <Breadcrumb
            items={[
              { label: 'Motoristas', to: '/motoristas' },
              { label: isEditing ? 'Editar cadastro' : 'Novo cadastro' },
            ]}
          />
        }
      />
      {renderContent()}
    </div>
  )
}
