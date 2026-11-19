import { useEffect, useState } from 'react'
import { getDevFeatureFlags, subscribeFeatureFlags } from './featureFlags'

export function useFeatureFlags() {
  const [flags, setFlags] = useState(getDevFeatureFlags)
  useEffect(() => subscribeFeatureFlags(() => setFlags(getDevFeatureFlags())), [])
  return flags
}

export function useFeatureFlag(name: string): boolean {
  return useFeatureFlags()[name] === true
}
