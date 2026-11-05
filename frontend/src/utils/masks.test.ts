import { expect, test } from 'vitest'
import {
  maskCpf,
  maskDate,
  maskPhone,
  maskTime,
  onlyDigits,
  parseBrDate,
  parseTime,
} from './masks'

test('onlyDigits remove tudo que não é número', () => {
  expect(onlyDigits('529.982-A47/25')).toBe('5299824725')
})

test('maskCpf formata progressivamente e limita a 11 dígitos', () => {
  expect(maskCpf('529')).toBe('529')
  expect(maskCpf('5299822')).toBe('529.982.2')
  expect(maskCpf('52998224725999')).toBe('529.982.247-25')
})

test('maskPhone aceita fixo e celular', () => {
  expect(maskPhone('')).toBe('')
  expect(maskPhone('79')).toBe('(79')
  expect(maskPhone('7933221100')).toBe('(79) 3322-1100')
  expect(maskPhone('79998765432')).toBe('(79) 99876-5432')
})

test('maskDate insere as barras', () => {
  expect(maskDate('31122027')).toBe('31/12/2027')
  expect(maskDate('3112')).toBe('31/12')
})

test('parseBrDate converte para ISO e rejeita datas inexistentes', () => {
  expect(parseBrDate('31/12/2027')).toBe('2027-12-31')
  expect(parseBrDate('31/02/2027')).toBeNull()
  expect(parseBrDate('2027-12-31')).toBeNull()
})

test('maskTime insere os dois-pontos e limita a 4 dígitos', () => {
  expect(maskTime('9')).toBe('9')
  expect(maskTime('093')).toBe('09:3')
  expect(maskTime('093045')).toBe('09:30')
})

test('parseTime converte em minutos e recusa horários inexistentes', () => {
  expect(parseTime('09:30')).toBe(570)
  expect(parseTime('00:00')).toBe(0)
  expect(parseTime('24:00')).toBeNull()
  expect(parseTime('12:60')).toBeNull()
  expect(parseTime('9:30')).toBeNull()
})
