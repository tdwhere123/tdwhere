import { asset } from '@/lib/asset'
import InkReveal from '@/components/InkReveal'
import Kicker from '@/components/Kicker'
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
          {/* quiet brass corner ornaments */}
          <img
            src={asset('svg/brass-corner.svg')}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-3 z-[1] h-7 w-7 select-none opacity-70 md:left-4 md:top-4 md:h-8 md:w-8"
          />
          <img
            src={asset('svg/brass-corner.svg')}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute bottom-3 right-3 z-[1] h-7 w-7 rotate-180 select-none opacity-70 md:bottom-4 md:right-4 md:h-8 md:w-8"
          />

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
            <img
              src={asset('svg/brass-lozenge.svg')}
              alt=""
              aria-hidden="true"
              className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-80"
            />
            <span>{caption}</span>
          </figcaption>
        </InkReveal>
      ) : null}
    </figure>
  )
}
