import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_FEATURE_FLAGS,
  getDevFeatureFlags,
  resetDevFeatureFlags,
  saveDevFeatureFlags,
} from './featureFlags'


describe('feature flags de desenvolvimento', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())


  it('usa o simulador desativado por padrão', () => {
    expect(getDevFeatureFlags()).toEqual(DEFAULT_FEATURE_FLAGS)
  })


  it('salva e lê flags booleanas do navegador', () => {
    saveDevFeatureFlags({ gps_event_simulator: true, nova_tela: false })


    expect(getDevFeatureFlags()).toEqual({
      ...DEFAULT_FEATURE_FLAGS,
      gps_event_simulator: true,
      nova_tela: false,
    })
  })


  it('ignora JSON inválido armazenado', () => {
    localStorage.setItem('frotamanager.dev.feature-flags', '{inválido')


    expect(getDevFeatureFlags()).toEqual(DEFAULT_FEATURE_FLAGS)
  })


  it('rejeita valores não booleanos e nomes inválidos', () => {
    expect(() => saveDevFeatureFlags({ simulator: 'on' } as never)).toThrow(/booleanos/i)
    expect(() => saveDevFeatureFlags({ 'flag inválida': true })).toThrow(/booleanos/i)
  })

