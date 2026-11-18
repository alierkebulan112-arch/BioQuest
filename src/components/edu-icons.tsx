import type { ReactNode } from 'react'

export type IconName =
  | 'arrow'
  | 'book'
  | 'brain'
  | 'check'
  | 'chevron'
  | 'clock'
  | 'close'
  | 'document'
  | 'home'
  | 'lock'
  | 'mail'
  | 'menu'
  | 'pencil'
  | 'play'
  | 'question'
  | 'spark'
  | 'target'
  | 'test'
  | 'user'
  | 'users'
  | 'leaf'
  | 'fire'
  | 'google'
  | 'dna'
  | 'microscope'
  | 'phone'
  | 'trophy'
  | 'star'

export function Icon({
  name,
  size = 20,
  className,
}: {
  name: IconName
  size?: number
  className?: string
}) {
  const paths: Record<IconName, ReactNode> = {
    arrow: (
      <>
        <path d="M5 12h14M13 6l6 6-6 6" />
      </>
    ),
    book: (
      <>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v17H6.5A2.5 2.5 0 0 0 4 22V5.5Z" />
        <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v17h4.5A2.5 2.5 0 0 1 20 22V5.5Z" />
      </>
    ),
    brain: (
      <>
        <path d="M9.5 4.5A3 3 0 0 0 4 6.2 3.4 3.4 0 0 0 3 12a3.5 3.5 0 0 0 2 6.3A3 3 0 0 0 10 20V5.5a2 2 0 0 0-.5-1Z" />
        <path d="M14.5 4.5A3 3 0 0 1 20 6.2a3.4 3.4 0 0 1 1 5.8 3.5 3.5 0 0 1-2 6.3A3 3 0 0 1 14 20V5.5a2 2 0 0 1 .5-1ZM6 10h4M14 14h4" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    close: (
      <>
        <path d="m6 6 12 12M18 6 6 18" />
      </>
    ),
    document: (
      <>
        <path d="M6 3h8l4 4v14H6V3Z" />
        <path d="M14 3v5h5M9 13h6M9 17h6" />
      </>
    ),
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v10h14V10M9 20v-6h6v6" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="10" width="14" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m4 7 8 6 8-6" />
      </>
    ),
    menu: (
      <>
        <path d="M4 7h16M4 12h16M4 17h16" />
      </>
    ),
    pencil: (
      <>
        <path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z" />
        <path d="m14 7 3 3" />
      </>
    ),
    play: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m10 9 5 3-5 3V9Z" />
      </>
    ),
    question: (
      <>
        <path d="M8.8 9a3.3 3.3 0 1 1 4.75 2.97C12.5 12.5 12 13.1 12 14" />
        <path d="M12 18h.01" />
      </>
    ),
    spark: (
      <>
        <path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4L12 3Z" />
        <path d="m18 14 .8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8L18 14Z" />
      </>
    ),
    target: (
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1" />
      </>
    ),
    test: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="m8 9 1.5 1.5L12 8M14 9h3M8 15l1.5 1.5L12 14M14 15h3" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 19a6 6 0 0 1 12 0M16 6a3 3 0 0 1 0 6M17 14a5 5 0 0 1 4 5" />
      </>
    ),
    leaf: (
      <>
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
      </>
    ),
    fire: (
      <>
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 2 7a4.5 4.5 0 1 1-9 0 2.5 2.5 0 0 0 1.5 2.5Z" />
      </>
    ),
    google: (
      <>
        <path d="M12 11v2.4h4.8c-.2 1.1-.9 2.1-1.9 2.7v2.2h3.1c1.8-1.7 2.9-4.1 2.9-7 0-.7-.1-1.3-.2-1.9H12z" />
        <path d="M12 20.4c2.6 0 4.8-.9 6.4-2.4l-3.1-2.2c-.9.6-2 1-3.3 1-2.5 0-4.7-1.7-5.4-4H3.4v2.3C5 18.5 8.2 20.4 12 20.4z" />
        <path d="M6.6 12.8c-.2-.6-.3-1.2-.3-1.8s.1-1.2.3-1.8V7H3.4C2.8 8.2 2.5 9.5 2.5 11s.3 2.8.9 4l3.2-2.2z" />
        <path d="M12 5.6c1.4 0 2.7.5 3.7 1.4l2.8-2.8C16.8 2.7 14.6 1.8 12 1.8 8.2 1.8 5 3.7 3.4 6.9l3.2 2.3c.7-2.3 2.9-4 5.4-4z" />
      </>
    ),
    dna: (
      <>
        <path d="M2 15c6.667-6 13.333 0 20-6" />
        <path d="M2 9c6.667 6 13.333 0 20 6" />
        <path d="M7 6v2M17 16v2M12 4v2M12 18v2" />
      </>
    ),
    microscope: (
      <>
        <path d="M6 18h8M8 18v-6a4 4 0 0 1 8 0v6" />
        <circle cx="12" cy="8" r="3" />
        <path d="M12 5V3M9 22h6" />
      </>
    ),
    phone: (
      <>
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </>
    ),
    trophy: (
      <>
        <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z" />
        <path d="M5 4h2M17 4h2M5 9a3 3 0 0 0 3 3M19 9a3 3 0 0 1-3 3" />
      </>
    ),
    star: (
      <>
        <path d="m12 2 2.4 7.2H22l-6 4.8 2.3 7.2L12 16.8 5.7 21.2 8 14 2 9.2h7.6L12 2z" />
      </>
    ),
  }

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

/** Simple biology SVG illustrations for lessons */
export function BiologyIllustration({ type }: { type?: string }) {
  const common = {
    width: '100%',
    height: 'auto',
    viewBox: '0 0 200 120',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
  }

  switch (type) {
    case 'cell':
      return (
        <svg {...common}>
          <ellipse cx="100" cy="60" rx="70" ry="45" fill="#dcfce7" stroke="#16a34a" strokeWidth="2" />
          <circle cx="100" cy="55" r="18" fill="#bbf7d0" stroke="#15803d" strokeWidth="1.5" />
          <circle cx="100" cy="55" r="8" fill="#16a34a" />
          <ellipse cx="55" cy="45" rx="10" ry="7" fill="#86efac" stroke="#15803d" strokeWidth="1" />
          <ellipse cx="145" cy="70" rx="12" ry="8" fill="#86efac" stroke="#15803d" strokeWidth="1" />
          <circle cx="130" cy="40" r="6" fill="#4ade80" />
          <circle cx="70" cy="75" r="5" fill="#4ade80" />
        </svg>
      )
    case 'organelle':
      return (
        <svg {...common}>
          <rect x="20" y="30" width="160" height="60" rx="20" fill="#ecfccb" stroke="#65a30d" strokeWidth="2" />
          <ellipse cx="60" cy="60" rx="18" ry="12" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" />
          <path d="M50 60 Q60 50 70 60 Q60 70 50 60" fill="#fde047" />
          <circle cx="110" cy="55" r="14" fill="#bbf7d0" stroke="#16a34a" strokeWidth="1.5" />
          <circle cx="150" cy="65" r="10" fill="#a7f3d0" stroke="#0d9488" strokeWidth="1.5" />
        </svg>
      )
    case 'membrane':
      return (
        <svg {...common}>
          <path d="M10 40 Q50 20 100 40 Q150 60 190 40" stroke="#16a34a" strokeWidth="3" fill="none" />
          <path d="M10 55 Q50 35 100 55 Q150 75 190 55" stroke="#4ade80" strokeWidth="2" fill="none" />
          <path d="M10 70 Q50 50 100 70 Q150 90 190 70" stroke="#16a34a" strokeWidth="3" fill="none" />
          <circle cx="40" cy="48" r="6" fill="#86efac" />
          <circle cx="100" cy="52" r="7" fill="#4ade80" />
          <circle cx="160" cy="58" r="5" fill="#86efac" />
        </svg>
      )
    case 'photosynthesis':
      return (
        <svg {...common}>
          <circle cx="160" cy="30" r="18" fill="#fef08a" stroke="#eab308" strokeWidth="2" />
          <path d="M160 12v-6M160 54v-6M142 30h-6M184 30h-6M148 18l-4-4M176 42l-4-4M176 18l4-4M148 42l4-4" stroke="#eab308" strokeWidth="1.5" />
          <path d="M40 90 Q70 40 100 90" fill="#86efac" stroke="#16a34a" strokeWidth="2" />
          <path d="M100 90 Q130 35 160 90" fill="#4ade80" stroke="#15803d" strokeWidth="2" />
          <rect x="95" y="90" width="10" height="20" fill="#854d0e" />
        </svg>
      )
    case 'plant-organs':
      return (
        <svg {...common}>
          <rect x="95" y="50" width="10" height="50" fill="#854d0e" />
          <ellipse cx="100" cy="40" rx="35" ry="20" fill="#4ade80" stroke="#16a34a" strokeWidth="1.5" />
          <ellipse cx="70" cy="55" rx="20" ry="12" fill="#86efac" stroke="#15803d" strokeWidth="1" />
          <ellipse cx="130" cy="55" rx="20" ry="12" fill="#86efac" stroke="#15803d" strokeWidth="1" />
          <path d="M100 100 Q80 110 70 115M100 100 Q120 110 130 115M100 100 Q100 115 100 120" stroke="#a16207" strokeWidth="2" fill="none" />
        </svg>
      )
    case 'respiration':
      return (
        <svg {...common}>
          <ellipse cx="70" cy="60" rx="40" ry="30" fill="#dcfce7" stroke="#16a34a" strokeWidth="2" />
          <text x="55" y="65" fontSize="12" fill="#14532d" fontWeight="bold">O₂</text>
          <path d="M110 60 L130 60" stroke="#16a34a" strokeWidth="2" markerEnd="url(#arrow)" />
          <ellipse cx="160" cy="60" rx="25" ry="20" fill="#fecaca" stroke="#dc2626" strokeWidth="2" />
          <text x="148" y="65" fontSize="11" fill="#7f1d1d" fontWeight="bold">CO₂</text>
        </svg>
      )
    case 'systems':
      return (
        <svg {...common}>
          <circle cx="100" cy="35" r="15" fill="#fecaca" stroke="#dc2626" strokeWidth="1.5" />
          <path d="M100 50 v20" stroke="#dc2626" strokeWidth="3" />
          <path d="M85 70 Q100 90 115 70" fill="none" stroke="#f87171" strokeWidth="2" />
          <ellipse cx="60" cy="85" rx="20" ry="12" fill="#bfdbfe" stroke="#2563eb" strokeWidth="1.5" />
          <ellipse cx="140" cy="85" rx="20" ry="12" fill="#bfdbfe" stroke="#2563eb" strokeWidth="1.5" />
          <path d="M80 85 H120" stroke="#3b82f6" strokeWidth="2" />
        </svg>
      )
    case 'health':
      return (
        <svg {...common}>
          <circle cx="100" cy="55" r="35" fill="#dcfce7" stroke="#16a34a" strokeWidth="2" />
          <path d="M100 35 v40M80 55 h40" stroke="#16a34a" strokeWidth="4" strokeLinecap="round" />
          <circle cx="70" cy="30" r="8" fill="#fef08a" />
          <circle cx="140" cy="80" r="6" fill="#86efac" />
        </svg>
      )
    case 'ecology':
      return (
        <svg {...common}>
          <path d="M20 90 Q50 40 80 90" fill="#86efac" stroke="#16a34a" strokeWidth="1.5" />
          <path d="M70 90 Q100 30 130 90" fill="#4ade80" stroke="#15803d" strokeWidth="1.5" />
          <path d="M120 90 Q150 50 180 90" fill="#86efac" stroke="#16a34a" strokeWidth="1.5" />
          <circle cx="50" cy="25" r="12" fill="#fef08a" stroke="#eab308" strokeWidth="1" />
          <path d="M30 100 h140" stroke="#854d0e" strokeWidth="3" />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <circle cx="100" cy="60" r="40" fill="#dcfce7" stroke="#16a34a" strokeWidth="2" />
          <path d="M80 60 Q100 40 120 60 Q100 80 80 60" fill="#4ade80" />
        </svg>
      )
  }
}
