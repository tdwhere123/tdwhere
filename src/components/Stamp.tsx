import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * 戳 / Stamp — seal-styled square or round stamp (VERIFIED · 遗址 · 已解锁 …).
 * seal border + faint seal fill + worn texture (feTurbulence); rests at -4°.
 * Entrance uses the 盖章 motion: scale 1.7→1, rotate -10°→-4°, 0.38s back-out.
 */
export default function Stamp({
  text,
  shape = 'square',
  className,
  animateOnView = true,
}: {
  text: string
  shape?: 'square' | 'round'
  className?: string
  animateOnView?: boolean
}) {
  const motionProps = animateOnView
    ? {
        initial: { scale: 1.7, rotate: -10, opacity: 0 },
        whileInView: { scale: 1, rotate: -4, opacity: 1 },
        viewport: { once: true, amount: 0.6 },
        transition: { duration: 0.38, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] },
      }
    : {
        initial: { scale: 1.7, rotate: -10, opacity: 0 },
        animate: { scale: 1, rotate: -4, opacity: 1 },
        transition: { duration: 0.38, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] },
      }

  return (
    <motion.span
      {...motionProps}
      className={cn(
        'inline-flex select-none items-center justify-center px-3 py-2',
        'border-2 border-seal bg-seal/10 font-mono text-xs font-medium uppercase tracking-[0.14em] text-seal',
        shape === 'round' ? 'rounded-full px-4' : 'rounded-[4px]',
        className,
      )}
      style={{ filter: 'url(#stamp-worn)' }}
    >
      {text}
      {/* shared worn-texture filter */}
      <svg aria-hidden="true" width="0" height="0" className="absolute">
        <filter id="stamp-worn" x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="2" seed="5" result="n" />
          <feColorMatrix
            in="n"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.6 1.6 1.6 0 -2.4"
            result="speck"
          />
          <feComposite in="SourceGraphic" in2="speck" operator="out" />
        </filter>
      </svg>
    </motion.span>
  )
}
