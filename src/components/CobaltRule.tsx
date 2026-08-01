import { cn } from '@/lib/utils'

type Variant = 'default' | 'doit' | 'about'

const VARIANT: Record<
  Variant,
  { stroke: string; strokeOpacity: string; fill: string; fillOpacity: string; className?: string }
> = {
  default: {
    stroke: 'var(--cobalt)',
    strokeOpacity: '0.45',
    fill: 'var(--cobalt)',
    fillOpacity: '0.55',
  },
  doit: {
    stroke: 'var(--cobalt)',
    strokeOpacity: '0.55',
    fill: 'var(--clay)',
    fillOpacity: '0.65',
  },
  about: {
    stroke: 'currentColor',
    strokeOpacity: '0.5',
    fill: 'currentColor',
    fillOpacity: '0.6',
    className: 'text-cobalt',
  },
}

/** Thin museum cobalt rule — section break, not a card. */
export default function CobaltRule({
  className,
  variant = 'default',
}: {
  className?: string
  variant?: Variant
}) {
  const v = VARIANT[variant]
  return (
    <svg
      className={cn(v.className, className)}
      viewBox="0 0 240 8"
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <line
        x1="0"
        y1="4"
        x2="240"
        y2="4"
        stroke={v.stroke}
        strokeWidth="0.75"
        opacity={v.strokeOpacity}
      />
      <circle cx="120" cy="4" r="2" fill={v.fill} opacity={v.fillOpacity} />
    </svg>
  )
}
