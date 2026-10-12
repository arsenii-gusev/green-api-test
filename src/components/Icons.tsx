import type { SVGProps } from 'react'

const base = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true } as const

export const SendIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...props}>
    <path d="M4.4 19.4 20.6 12.6a.7.7 0 0 0 0-1.2L4.4 4.6a.7.7 0 0 0-1 .8L5.6 11 13 12l-7.4 1-2.2 5.6a.7.7 0 0 0 1 .8Z" fill="currentColor" />
  </svg>
)

export const BackIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...props}>
    <path d="M15 5 8 12l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const PlusIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...props}>
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

export const LogoutIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...props}>
    <path
      d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 16l-4-4 4-4M6 12h10"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const CheckIcon = ({ double, ...props }: SVGProps<SVGSVGElement> & { double?: boolean }) => (
  <svg width="16" height="11" viewBox="0 0 16 11" fill="none" aria-hidden="true" {...props}>
    <path d="m1 5.5 3.5 3.5L11 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    {double && <path d="m7.5 9 .5.5L14.5 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />}
  </svg>
)

export const Logo = (props: SVGProps<SVGSVGElement>) => (
  <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true" {...props}>
    <defs>
      <linearGradient id="logo-gradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#3d9bff" />
        <stop offset="1" stopColor="#8a4dff" />
      </linearGradient>
    </defs>
    <rect width="56" height="56" rx="16" fill="url(#logo-gradient)" />
    <path
      d="M17 37V20.5c0-.9 1.1-1.3 1.7-.7L28 29l9.3-9.2c.6-.6 1.7-.2 1.7.7V37"
      stroke="#fff"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
)
