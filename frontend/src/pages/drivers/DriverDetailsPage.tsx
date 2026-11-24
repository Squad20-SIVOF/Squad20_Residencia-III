import { useParams } from 'react-router-dom'
import { Shuffle } from 'lucide-react'
import { LoadingState } from '@/components/LoadingState/LoadingState'
import { Avatar } from '@/components/Avatar'
import { BackLink } from '@/components/BackLink/BackLink'
import { Badge, type BadgeVariant } from '@/components/Badge'
import { ButtonLink } from '@/components/ButtonLink'
import { Card } from '@/components/Card'
import { PageHeader } from '@/components/PageHeader'
import { StateMessage } from '@/components/StateMessage'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useVehicles } from '@/pages/vehicles/hooks/useVehicles'
import { VehicleStatusBadge } from '@/pages/vehicles/components/VehicleStatusBadge'
import { vehicleFullModel } from '@/pages/vehicles/utils/vehicleRules'
import { classNames } from '@/utils/classNames'
import { formatDate } from '@/utils/format'
import { onlyDigits } from '@/utils/masks'
import { CnhExpiry } from './components/CnhExpiry'
import { DriverStatusBadge } from './components/DriverStatusBadge'
import { useDriver } from './hooks/useDriver'
import type { CnhSituation, Driver } from './types'
import { canTakeNewTrips, getCnhSituation, getEffectiveStatus } from './utils/driverRules'
import styles from './DriverDetailsPage.module.scss'

const CNH_STATUS: Record<CnhSituation, { label: string; variant: BadgeVariant }> = {
  valid: { label: 'Válida', variant: 'success' },
  expiring: { label: 'Próxima do vencimento', variant: 'warning' },
  expired: { label: 'Vencida', variant: 'danger' },
}

function maskedCpf(cpf: string) {
  const digits = onlyDigits(cpf)
  return digits.length === 11 ? `***.${digits.slice(3, 6)}.***-${digits.slice(-2)}` : '—'
}

const plateKey = (plate: string) => plate.replace(/[^a-z0-9]/gi, '').toUpperCase()

function LinkedVehicles({ plates }: { plates: string[] }) {
  const vehicles = useVehicles()
  const byPlate = new Map(
    vehicles.status === 'success'
      ? vehicles.data.map((vehicle) => [plateKey(vehicle.plate), vehicle])
      : [],
  )

  return (
    <ul className={styles.vehicles} aria-label="Veículos vinculados">
      {plates.map((plate) => {
        const vehicle = byPlate.get(plateKey(plate))
        return (
          <li className={styles.vehicleRow} key={plate}>
            <strong className={styles.vehiclePlate}>{plateKey(plate)}</strong>
            {vehicle ? (
              <>
                <span className={styles.vehicleModel}>{vehicleFullModel(vehicle)}</span>
                <span className={styles.vehicleFleet}>{vehicle.fleet}</span>
                <VehicleStatusBadge
                  status={vehicle.status}
                  labelSet="availability"
                  className={styles.vehicleStatus}
                />
              </>
            ) : (
              <span className={styles.vehicleFallback}>
                {vehicles.status === 'loading'
                  ? 'Carregando dados…'
                  : 'Dados do veículo indisponíveis'}
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}

function DriverDetails({ driver }: { driver: Driver }) {
  const license = CNH_STATUS[getCnhSituation(driver.cnhExpiry)]
  const vehicleCount = driver.vehicles.length

  return (
    <div className={styles.content}>
      <div className={styles.summaryGrid}>
        <Card className={styles.card}>
          <div className={styles.identity}>
            <Avatar name={driver.name} src={driver.photo} />
            <div>
              <h2 className={styles.name}>{driver.name}</h2>
              <p className={styles.muted}>CPF {maskedCpf(driver.cpf)}</p>
            </div>
          </div>
          <p className={styles.muted}>
            CNH {driver.cnh} · Categoria {driver.cnhCategory}
          </p>
          <div className={styles.cardHeading}>
            <Badge variant={license.variant}>{license.label}</Badge>
            <time className={styles.muted} dateTime={driver.cnhExpiry}>
              {formatDate(driver.cnhExpiry)}
            </time>
          </div>
          {driver.isWildcard && (
            <Badge variant="info" className={styles.wildcardBadge}>
              <Shuffle size={14} aria-hidden="true" />
              Motorista coringa
            </Badge>
          )}
        </Card>
        <Card className={styles.card}>
          <div className={styles.cardHeading}>
            <h2 className={styles.name}>Situação do cadastro</h2>
            <DriverStatusBadge status={getEffectiveStatus(driver)} />
          </div>
          <dl className={styles.list}>
            <div>
              <dt>Cadastrado em</dt>
              <dd>
                {driver.createdAt ? formatDate(driver.createdAt.slice(0, 10)) : '—'}
              </dd>
            </div>
            <div>
              <dt>Novas viagens</dt>
              <dd>{canTakeNewTrips(driver) ? 'Liberado' : 'Indisponível'}</dd>
            </div>
          </dl>
        </Card>
      </div>

      <Card className={styles.card}>
        <section className={styles.section}>
          <div className={styles.cardHeading}>
            <h2>Dados pessoais</h2>
            <span className={styles.muted}>Informações cadastrais</span>
          </div>
          <dl className={classNames(styles.list, styles.twoColumns)}>
            {[
              ['Nome completo', driver.name],
              ['CPF', driver.cpf],
              ['Telefone', driver.phone],
              ['E-mail', driver.email],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value || '—'}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className={styles.section}>
          <div className={styles.cardHeading}>
            <h2>Habilitação (CNH)</h2>
            <Badge variant={license.variant}>
              {license.label === 'Válida' ? 'Documento válido' : license.label}
            </Badge>
          </div>
          <dl className={classNames(styles.list, styles.threeColumns)}>
            <div>
              <dt>Número de registro</dt>
              <dd>{driver.cnh}</dd>
            </div>
            <div>
              <dt>Categoria</dt>
              <dd>{driver.cnhCategory}</dd>
            </div>
            <div>
              <dt>Validade</dt>
              <dd>
                <CnhExpiry expiry={driver.cnhExpiry} format="date" />
              </dd>
            </div>
          </dl>
        </section>
      </Card>

      <Card className={styles.card}>
        <div className={styles.cardHeading}>
          <h2>Vínculo com a frota</h2>
          <span className={styles.muted}>
            {vehicleCount}{' '}
            {vehicleCount === 1 ? 'veículo vinculado' : 'veículos vinculados'}
          </span>
        </div>
        <dl className={classNames(styles.list, styles.twoColumns)}>
          <div>
            <dt>Frota principal</dt>
            <dd>{driver.fleet || '—'}</dd>
          </div>
          {driver.isWildcard && (
            <div>
              <dt className={styles.wildcardLabel}>Motorista coringa</dt>
              <dd className={styles.muted}>
                Pode atuar em todas as frotas, inclusive SVO.
              </dd>
            </div>
          )}
        </dl>
        {vehicleCount > 0 ? (
          <LinkedVehicles plates={driver.vehicles} />
        ) : (
          <p className={styles.muted}>Nenhum veículo vinculado.</p>
        )}
      </Card>
    </div>
  )
}

export function DriverDetailsPage() {
  const { id } = useParams()
  const driverRequest = useDriver(id)
  const driver = driverRequest.status === 'success' ? driverRequest.data : undefined
  useDocumentTitle(driver ? `${driver.name} — Motorista` : 'Detalhes do Motorista')

  if (driverRequest.status === 'loading')
    return <LoadingState label="Carregando motorista..." />

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <PageHeader
          title="Detalhes do motorista"
          subtitle="Consulte os dados e os vínculos do motorista cadastrado."
          breadcrumb={<BackLink to="/motoristas">Voltar para Motoristas</BackLink>}
        />
        {driver && (
          <ButtonLink to={`/motoristas/editar/${driver.id}`} className={styles.edit}>
            Editar motorista
          </ButtonLink>
        )}
      </div>
      {driver ? (
        <DriverDetails driver={driver} />
      ) : (
        <StateMessage variant="error" title="Motorista não encontrado." />
      )}
    </div>
  )
}
