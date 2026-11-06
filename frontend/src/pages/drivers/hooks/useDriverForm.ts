import { useState } from 'react'
import type { FormEvent } from 'react'
import { parseBrDate } from '@/utils/masks'
import { formatDate } from '@/utils/format'
import type { Driver, DriverFormErrors, DriverFormValues, DriverInput } from '../types'
import { FORM_FIELD_ORDER, validateDriverForm } from '../utils/driverRules'

export const DRIVER_FIELD_ID_PREFIX = 'driver-'

const EMPTY_VALUES: DriverFormValues = {
  name: '',
  cpf: '',
  phone: '',
  email: '',
  photo: undefined,
  cnh: '',
  cnhCategory: '',
  cnhExpiry: '',
  fleet: '',
  vehicles: [],
  isWildcard: false,
  status: 'ativo',
}

function toFormValues(driver?: Driver): DriverFormValues {
  if (!driver) return EMPTY_VALUES
  return {
    name: driver.name,
    cpf: driver.cpf,
    phone: driver.phone,
    email: driver.email,
    photo: driver.photo,
    cnh: driver.cnh,
    cnhCategory: driver.cnhCategory,
    cnhExpiry: formatDate(driver.cnhExpiry),
    fleet: driver.fleet,
    vehicles: driver.vehicles,
    isWildcard: driver.isWildcard,
    status: driver.status,
  }
}

function toInput(values: DriverFormValues): DriverInput | null {
  const cnhExpiry = parseBrDate(values.cnhExpiry)
  if (!cnhExpiry || !values.cnhCategory) return null

  const { photo, cnhCategory, ...rest } = values
  return {
    ...rest,
    name: values.name.trim(),
    email: values.email.trim(),
    cnhCategory,
    cnhExpiry,
    ...(photo ? { photo } : {}),
  }
}

export function useDriverForm(
  initial: Driver | undefined,
  onSubmit: (input: DriverInput) => Promise<void>,
) {
  const [values, setValues] = useState<DriverFormValues>(() => toFormValues(initial))
  const [errors, setErrors] = useState<DriverFormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function setField<TKey extends keyof DriverFormValues>(
    field: TKey,
    value: DriverFormValues[TKey],
  ) {
    setValues((current) => ({ ...current, [field]: value }))
    // Marcar "coringa" também desfaz o erro de frota obrigatória.
    setErrors((current) => ({
      ...current,
      [field]: undefined,
      ...(field === 'isWildcard' ? { fleet: undefined } : {}),
    }))
    setSubmitError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors = validateDriverForm(values)
    if (!values.vehicles.length) delete nextErrors.fleet
    const firstInvalid = FORM_FIELD_ORDER.find((field) => nextErrors[field])
    const input = toInput(values)

    if (firstInvalid || !input) {
      setErrors(nextErrors)
      if (firstInvalid) {
        document.getElementById(`${DRIVER_FIELD_ID_PREFIX}${firstInvalid}`)?.focus()
      }
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(input)
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Não foi possível salvar o motorista.',
      )
      setIsSubmitting(false)
    }
  }

  return {
    values,
    errors,
    submitError,
    isSubmitting,
    hasErrors: Object.values(errors).some(Boolean),
    setField,
    handleSubmit,
  }
}
