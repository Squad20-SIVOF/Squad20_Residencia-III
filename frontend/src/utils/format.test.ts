import { expect, test } from 'vitest'
import { formatDecimal, formatLongDate } from './format'

test('data por extenso em português', () => {
  expect(formatLongDate(new Date(2026, 8, 28))).toBe('28 de setembro de 2026')
})

test('decimal com vírgula e no máximo uma casa', () => {
  expect(formatDecimal(14.714)).toBe('14,7')
  expect(formatDecimal(13)).toBe('13')
})
