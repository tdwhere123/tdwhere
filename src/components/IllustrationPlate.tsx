import InkReveal from '@/components/InkReveal'
import Kicker from '@/components/Kicker'
import { asset } from '@/lib/asset'
import { cn } from '@/lib/utils'

type IllustrationPlateProps = {
  /** Path under `public/`, e.g. `illustrations/do-it-gate-router.png` */
  src: string
  alt: string
  /** Optional mono section label */
  kicker?: string
  /** Short bilingual-ready caption under the plate */
  caption?: string
  /** `wide` = max-w-shell inset; `bleed` = edge-to-edge below hero */
  variant?: 'wide' | 'bleed'
  className?: string
  /** Prefer lazy for below-fold plates */
  priority?: boolean
}

/** Inline brass corner — avoids external SVG MIME/parse failures on Pages. */
function BrassCorner({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 40 V12 H36"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="square"
        opacity="0.85"
      />
      <path
        d="M8 28 V18 H22"
        stroke="currentColor"
        strokeWidth="0.6"
        strokeLinecap="square"
        opacity="0.45"
      />
      <circle cx="8" cy="12" r="1.6" fill="currentColor" opacity="0.7" />
    </svg>
  )
}

function BrassLozenge({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M24 6 L42 24 L24 42 L6 24 Z"
        stroke="currentColor"
        strokeWidth="1.1"
        opacity="0.8"
      />
      <path
        d="M24 14 L34 24 L24 34 L14 24 Z"
        stroke="currentColor"
        strokeWidth="0.55"
        opacity="0.4"
      />
      <circle cx="24" cy="24" r="1.4" fill="currentColor" opacity="0.55" />
    </svg>
  )
}

/**
 * Museum illustration plate — one dominant image per section.
 * Stone matte + thin brass edge; not a card, not a hero overlay.
 */
export default function IllustrationPlate({
  src,
  alt,
  kicker,
  caption,
  variant = 'wide',
  className,
  priority = false,
}: IllustrationPlateProps) {
  const bleed = variant === 'bleed'

  return (
    <figure
      className={cn(
        'relative',
        bleed
          ? 'w-full py-[clamp(48px,8vh,96px)]'
          : 'mx-auto max-w-shell px-5 py-[clamp(56px,9vh,112px)] md:px-10',
        className,
      )}
    >
      {kicker ? (
        <InkReveal className={cn(bleed && 'mx-auto max-w-shell px-5 md:px-10')}>
          <Kicker>{kicker}</Kicker>
        </InkReveal>
      ) : null}

      <InkReveal delay={kicker ? 0.08 : 0} className={cn(kicker && 'mt-8')}>
        <div
          className={cn(
            'relative overflow-hidden border border-museum-brass/25 bg-museum-stone',
            bleed ? 'border-x-0' : '',
          )}
        >
          <BrassCorner className="pointer-events-none absolute left-3 top-3 z-[1] h-7 w-7 text-museum-brass opacity-70 md:left-4 md:top-4 md:h-8 md:w-8" />
          <BrassCorner className="pointer-events-none absolute bottom-3 right-3 z-[1] h-7 w-7 rotate-180 text-museum-brass opacity-70 md:bottom-4 md:right-4 md:h-8 md:w-8" />

          <img
            src={asset(src)}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className={cn(
              'block w-full select-none object-cover',
              bleed
                ? 'aspect-[21/9] max-h-[min(52vh,560px)]'
                : 'aspect-[16/9] max-h-[min(48vh,520px)]',
            )}
          />
        </div>
      </InkReveal>

      {caption ? (
        <InkReveal delay={0.16} className={cn(bleed && 'mx-auto max-w-shell px-5 md:px-10')}>
          <figcaption className="mt-5 flex items-start gap-3 font-mono text-xs leading-relaxed text-museum-muted md:text-[13px]">
            <BrassLozenge className="mt-0.5 h-3.5 w-3.5 shrink-0 text-museum-brass opacity-80" />
            <span className="min-w-0 flex-1 break-words">{caption}</span>
          </figcaption>
        </InkReveal>
      ) : null}
    </figure>
  )
}
