import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useFeatureFlag } from '@/apps/motorista/features/useFeatureFlags'

export function FeatureFlagRoute({
  flag,
  children,
}: {
  flag: string
  children: ReactNode
}) {
  const enabled = useFeatureFlag(flag)
  return enabled ? children : <Navigate to="/dev/feature-flags" replace />
}
