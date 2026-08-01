import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'framer-motion'
import { useLang } from '@/context/LangContext'
import { useHomeCubeMobile } from './useHomeCubeMobile'
import { cn } from '@/lib/utils'

/**
 * Magnetic wrapper: springs toward the pointer on hover.
 * Motion values only, no React state; inert under prefers-reduced-motion.
 */
function Magnetic({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 220, damping: 16, mass: 0.45 })
  const springY = useSpring(y, { stiffness: 220, damping: 16, mass: 0.45 })

  return (
    <motion.span
      className={cn('inline-block', className)}
      style={{ x: springX, y: springY }}
      onPointerMove={(event) => {
        if (reduce) return
        const rect = event.currentTarget.getBoundingClientRect()
        x.set((event.clientX - (rect.left + rect.width / 2)) * 0.28)
        y.set((event.clientY - (rect.top + rect.height / 2)) * 0.28)
      }}
      onPointerLeave={() => {
        x.set(0)
        y.set(0)
      }}
    >
      {children}
    </motion.span>
  )
}

function HeroCopy({ compact }: { compact?: boolean }) {
  const { t } = useLang()
  const reduce = useReducedMotion()

  const scrollToWorks = () => {
    document
      .getElementById('works')
      ?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <div className={cn(compact && 'flex flex-col items-start')}>
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-museum-muted">
        {t.hero.kicker}
      </p>
      <h1
        className={cn(
          'mt-4 font-display font-semibold leading-[0.98] tracking-[0.01em] text-museum-ink',
          compact ? 'text-[clamp(40px,11vw,56px)]' : 'text-[clamp(52px,7.5vw,110px)]',
        )}
      >
        <span className="block">
          {t.hero.nameA}
          {t.hero.nameB}
        </span>
        <span className="block text-cobalt">{t.hero.handle}</span>
      </h1>
      <p className="mt-5 max-w-[38ch] text-[15px] leading-relaxed text-museum-muted md:text-base">
        {t.hero.signature}
      </p>
      <div className="pointer-events-auto mt-8 flex flex-wrap items-center gap-3">
        <Magnetic>
          <button
            type="button"
            onClick={scrollToWorks}
            className="whitespace-nowrap rounded-none bg-cobalt px-7 py-3.5 font-mono text-sm uppercase tracking-[0.1em] text-paper transition-colors duration-300 hover:bg-cobalt-deep"
          >
            {t.hero.ctaWorks}
          </button>
        </Magnetic>
        <Link
          to="/about"
          className="whitespace-nowrap rounded-none border border-ink/25 px-7 py-3.5 font-mono text-sm uppercase tracking-[0.1em] text-museum-ink transition-colors duration-300 hover:border-cobalt hover:text-cobalt"
        >
          {t.hero.ctaAbout}
        </Link>
      </div>
    </div>
  )
}

/**
 * Hero copy layered over the cube showcase.
 * Desktop (fine pointer): absolute, left-bottom, pointer-events-none except the
 * CTAs so cube drag/keyboard interaction is untouched.
 * Mobile / coarse pointer: static compact block below the swipe scroller —
 * never the absolute overlay (same predicate as CubeShowcase).
 */
export default function HeroOverlay() {
  const isCubeMobile = useHomeCubeMobile()

  if (isCubeMobile) {
    return (
      <div className="px-6 pb-16 pt-4">
        <HeroCopy compact />
      </div>
    )
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-end px-12 pb-[11vh] lg:px-16">
      <HeroCopy />
    </div>
  )
}
