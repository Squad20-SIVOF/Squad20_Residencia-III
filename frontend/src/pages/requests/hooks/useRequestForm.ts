import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Vehicle } from '@/pages/vehicles/types'
import type { RequestFormErrors, RequestFormValues, RequestInput } from '../types'
import {
  REQUEST_FORM_FIELD_ORDER,
  toRequestInput,
  validateRequestForm,
} from '../utils/requestRules'

export const REQUEST_FIELD_ID_PREFIX = 'request-'
export const REQUEST_FORM_ID = 'request-form'

export const requestFieldId = (field: keyof RequestFormValues) =>
  `${REQUEST_FIELD_ID_PREFIX}${field}`

const INITIAL_VALUES: RequestFormValues = {
  origin: 'Central SVO',
  destination: '',
  sector: 'Administrativo',
  date: '',
  departureTime: '',
  returnTime: '',
  passengers: '',
  vehicleId: '',
  reason: '',
  isImportant: false,
}

export function useRequestForm(
  vehicles: Vehicle[],
  onSubmit: (input: RequestInput) => Promise<void>,
) {
  const [values, setValues] = useState<RequestFormValues>(INITIAL_VALUES)
  const [errors, setErrors] = useState<RequestFormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function setField<TKey extends keyof RequestFormValues>(
    field: TKey,
    value: RequestFormValues[TKey],
  ) {
    setValues((current) => ({ ...current, [field]: value }))
    // Trocar o veículo muda a lotação máxima, que é validada no campo de passageiros.
    setErrors((current) => ({
      ...current,
      [field]: undefined,
      ...(field === 'vehicleId' ? { passengers: undefined } : {}),
    }))
    setSubmitError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const vehicle = vehicles.find((item) => item.id === values.vehicleId)
    const nextErrors = validateRequestForm(values, {
      vehicleCapacity: vehicle?.maxCapacity,
    })
    const firstInvalid = REQUEST_FORM_FIELD_ORDER.find((field) => nextErrors[field])
    const input = toRequestInput(values)

    if (firstInvalid || !input) {
      setErrors(nextErrors)
      if (firstInvalid) document.getElementById(requestFieldId(firstInvalid))?.focus()
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(input)
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Não foi possível enviar a solicitação.',
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

export type RequestFormState = ReturnType<typeof useRequestForm>
