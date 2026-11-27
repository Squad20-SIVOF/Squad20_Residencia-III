import type { ReactNode } from 'react'

export type SidebarIconName =
  | 'home'
  | 'vehicles'
  | 'drivers'
  | 'fuel'
  | 'maintenance'
  | 'trips'
  | 'reports'
  | 'profile'
  | 'users'
  | 'sun'
  | 'moon'
  | 'alert'
  | 'logout'
  | 'collapse'
  | 'expand'
  | 'menu'
  | 'close'

// Traços próprios em grade 24×24 (sem biblioteca de ícones).
const PATHS: Record<SidebarIconName, ReactNode> = {
  home: (
    <>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
    </>
  ),
  vehicles: (
    <>
      <path d="M5 17h14v-4.5l-1.8-4.6A1.5 1.5 0 0 0 15.8 7H8.2a1.5 1.5 0 0 0-1.4.9L5 12.5Z" />
      <path d="M5 12.5h14M7 17v2M17 17v2" />
      <circle cx="8.5" cy="14.75" r="0.75" />
      <circle cx="15.5" cy="14.75" r="0.75" />
    </>
  ),
  drivers: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0M15.5 5.3a3 3 0 0 1 0 5.4M17 14.2a5.5 5.5 0 0 1 3.5 4.8" />
    </>
  ),
  fuel: (
    <>
      <path d="M5 20V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v15M3.5 20h12M7.5 8h4" />
      <path d="M14 10h1.5a1.5 1.5 0 0 1 1.5 1.5V16a1.5 1.5 0 0 0 3 0V8.5L18 6" />
    </>
  ),
  maintenance: (
    <path d="M14.5 4.5a4.5 4.5 0 0 0-4.9 6l-5.3 5.3a1.6 1.6 0 0 0 2.3 2.3l5.3-5.3a4.5 4.5 0 0 0 6-4.9l-2.7 2.7-2.4-.5-.5-2.4Z" />
  ),
  trips: (
    <>
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="6" r="2" />
      <path d="M8 18h7.5a3 3 0 0 0 0-6h-7a3 3 0 0 1 0-6H16" />
    </>
  ),
  reports: <path d="M4 20h16M7 16v-4M11 16V8M15 16v-6M19 16V5" />,
  profile: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  users: (
    <>
      <circle cx="10" cy="8" r="3.5" />
      <path d="M3.5 20a6.5 6.5 0 0 1 9.5-5.8M15 18l2 2 4-4" />
    </>
  ),
  moon: <path d="M20.5 14.2A8.8 8.8 0 0 1 9.8 3.5 9 9 0 1 0 20.5 14.2Z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
    </>
  ),
  alert: (
    <>
      <path d="M10.3 4.3 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9.5v4M12 17h.01" />
    </>
  ),
  logout: <path d="M9 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3M16 16l4-4-4-4M20 12H10" />,
  collapse: <path d="M19 12H5M11 6l-6 6 6 6" />,
  expand: <path d="M5 12h14M13 6l6 6-6 6" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
}

export interface SidebarIconProps {
  name: SidebarIconName
  className?: string
}

/** Ícone decorativo do menu lateral: o texto ao lado (ou o aria-label) dá o nome. */
export function SidebarIcon({ name, className }: SidebarIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  )
}
