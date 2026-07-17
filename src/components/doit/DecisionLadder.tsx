import { useRef, useState } from 'react'
import { motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion'
import { useLang } from '@/context/LangContext'
import { doItContent } from '@/content/doIt'
import Kicker from '@/components/Kicker'
import InkReveal from '@/components/InkReveal'
import { cn } from '@/lib/utils'

/**
 * S5 · 决策阶梯 — six descending steps; scroll scrubs a clay dot down the
 * stairs, lighting each step (mobile collapses to a vertical list).
 */
export default function DecisionLadder() {
  const { lang } = useLang()
  const c = doItContent[lang].ladder
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(-1)

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.82', 'end 0.42'],
  })
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    setActive(Math.max(-1, Math.min(c.steps.length - 1, Math.floor(v * 6.4 - 0.4))))
  })

  const dotX = useTransform(scrollYProgress, [0, 1], ['3%', '97%'])
  const dotY = useTransform(scrollYProgress, [0, 1], ['6%', '88%'])

  return (
    <section className="bg-museum-stone/50">
      <div className="mx-auto max-w-shell px-5 py-[clamp(72px,12vh,128px)] md:px-10">
        <InkReveal>
          <Kicker>{c.kicker}</Kicker>
          <h2 className="mt-4 font-serif text-h2 font-semibold text-ink">{c.title}</h2>
        </InkReveal>

        <div ref={ref} className="relative mt-14">
          {/* scroll-scrubbed clay dot (desktop stairs only) */}
          <motion.span
            aria-hidden="true"
            className="absolute z-10 hidden h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-clay md:block"
            style={{ left: dotX, top: dotY }}
          />

          {/* desktop: descending stairs */}
          <ol className="hidden gap-3 md:grid md:grid-cols-6">
            {c.steps.map((step, i) => {
              const lit = i <= active
              return (
                <li
                  key={step}
                  className={cn(
                    'rounded-lg border p-4 transition-colors duration-500',
                    lit ? 'border-clay bg-clay/5' : 'border-hairline bg-paper/80',
                  )}
                  style={{ marginTop: `${i * 12}px` }}
                >
                  <motion.p
                    aria-hidden="true"
                    animate={lit ? { y: 0, opacity: 1 } : { y: 6, opacity: 0.6 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      'font-mono text-[11px] tracking-[0.1em]',
                      lit ? 'text-clay' : 'text-faint',
                    )}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </motion.p>
                  <motion.p
                    animate={lit ? { y: 0, opacity: 1 } : { y: 12, opacity: 0.55 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      'mt-2 text-sm leading-relaxed',
                      lit ? 'text-ink' : 'text-ink-3',
                    )}
                  >
                    {step}
                  </motion.p>
                </li>
              )
            })}
          </ol>

          {/* mobile: vertical list */}
          <ol className="space-y-2 md:hidden">
            {c.steps.map((step, i) => {
              const lit = i <= active
              return (
                <li
                  key={step}
                  className={cn(
                    'flex items-baseline gap-4 rounded-lg border px-4 py-3 transition-colors duration-500',
                    lit ? 'border-clay bg-clay/5' : 'border-hairline bg-paper/80',
                  )}
                >
                  <span
                    className={cn(
                      'font-mono text-[11px]',
                      lit ? 'text-clay' : 'text-faint',
                    )}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className={cn('text-sm', lit ? 'text-ink' : 'text-ink-3')}>{step}</span>
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </section>
  )
}
