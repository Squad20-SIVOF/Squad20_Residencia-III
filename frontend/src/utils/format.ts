const MONTHS_SHORT = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
]

const numberFormatter = new Intl.NumberFormat('pt-BR')
const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/** 45320 → "45.320 km" */
export function formatKm(km: number): string {
  return `${numberFormatter.format(km)} km`
}

/** 450 → "R$ 450,00" */
export function formatCurrency(value: number): string {
  return currencyFormatter.format(value)
}

/** "2026-09-10" → "10/09/2026" */
export function formatDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`)
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`
}

/** "Hoje · 10:30" ou "27/09 · 14:20" */
export function formatShortDateTime(isoDateTime: string, now: Date = new Date()): string {
  const date = new Date(isoDateTime)
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`
  const isToday = date.toDateString() === now.toDateString()
  const day = isToday ? 'Hoje' : `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`
  return `${day} · ${time}`
}

/** "2027-01" → "Jan/2027" */
export function formatMonthYear(yearMonth: string): string {
  const [year = '', month = ''] = yearMonth.split('-')
  const monthLabel = MONTHS_SHORT[Number(month) - 1] ?? month
  return `${monthLabel}/${year}`
}

/** Remove acentos e caixa para comparar o texto digitado pelo usuário. */
export function normalizeText(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

/** "2026-10-26T09:47:00" → "09:47" (horário local) */
export function formatTime(isoDateTime: string): string {
  const date = new Date(isoDateTime)
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}
