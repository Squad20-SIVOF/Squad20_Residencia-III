import { useState } from 'react'
import { Badge } from '@/components/Badge'
import { SelectField } from '@/components/SelectField'
import type { SelectOption } from '@/components/SelectField'
import styles from './DriverVehiclesField.module.scss'

export interface DriverVehiclesFieldProps {
  value: string[]
  options: string[]
  onChange: (plates: string[]) => void
}

export function DriverVehiclesField({
  value,
  options,
  onChange,
}: DriverVehiclesFieldProps) {
  const [selected, setSelected] = useState('')

  const selectOptions: SelectOption<string>[] = [
    { value: '', label: 'Selecione...' },
    ...options
      .filter((plate) => !value.includes(plate))
      .map((plate) => ({ value: plate, label: plate })),
  ]

  function handleAdd() {
    if (!selected || value.includes(selected)) return
    onChange([...value, selected])
    setSelected('')
  }

  return (
    <div className={styles.field}>
      <p className={styles.label}>Veículo(s) vinculado(s)</p>

      <div className={styles.picker}>
        <div className={styles.chipsContainer}>
          {value.map((plate) => (
            <Badge key={plate} variant="info" className={styles.chip}>
              {plate}
              <button
                type="button"
                className={styles.remove}
                aria-label={`Remover ${plate}`}
                onClick={() => onChange(value.filter((item) => item !== plate))}
              >
                x
              </button>
            </Badge>
          ))}

          <div className={styles.addSelect}>
            <SelectField
              label="Escolher veículo"
              isLabelHidden
              value={selected}
              options={selectOptions}
              onChange={setSelected}
              className={styles.select}
            />
            <button type="button" className={styles.addBtn} onClick={handleAdd} disabled={!selected} aria-label="Adicionar">
  + adicionar
</button>
          </div>
        </div>
      </div>
    </div>
  )
}
