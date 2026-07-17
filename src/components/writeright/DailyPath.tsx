import { memo, useEffect, useRef, useState } from 'react'
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { useLang } from '@/context/LangContext'
import { writeRightContent } from '@/content/writeRight'
import Kicker from '@/components/Kicker'
import InkReveal from '@/components/InkReveal'
import { cn } from '@/lib/utils'

/** typewriter line — isolated + memoized (perpetual cursor blink lives here only) */
const TypeLine = memo(function TypeLine({ text, active }: { text: string; active: boolean }) {
  const reduced = useReducedMotion()
  const [typed, setTyped] = useState('')

  useEffect(() => {
    if (!active || reduced) return
    const id = window.setInterval(() => {
      setTyped((t) => {
        if (t.length >= text.length) {
          window.clearInterval(id)
          return t
        }
        return text.slice(0, t.length + 1)
      })
    }, 22)
    return () => window.clearInterval(id)
  }, [active, reduced, text])

  /* reduced motion: the full line appears at once, no typing */
  const shown = reduced && active ? text : typed
  const done = shown.length >= text.length

  return (
    <span className="font-mono text-[11px] text-museum-brass">
      {shown}
      {active && !done && (
        <span aria-hidden="true" className="animate-caret-blink">
          ▌
        </span>
      )}
    </span>
  )
})

/**
 * S5 · 日常路径 — five verbs in a loop. Scroll scrubs an ink dot along the
 * path lighting each step; hovering a card types its example command.
 */
export default function DailyPath() {
  const { lang } = useLang()
  const c = writeRightContent[lang].daily
  const ref = useRef<HTMLDivElement>(null)
  const [lit, setLit] = useState(0)
  const [hovered, setHovered] = useState<string | null>(null)

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.85', 'end 0.5'],
  })
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    setLit(Math.max(0, Math.min(c.steps.length, Math.floor(v * 5.6 - 0.2))))
  })
  const dotX = useTransform(scrollYProgress, [0, 1], ['2%', '98%'])

  return (
    <section className="mx-auto max-w-shell px-5 py-[clamp(72px,12vh,128px)] md:px-10">
      <InkReveal>
        <Kicker>{c.kicker}</Kicker>
        <h2 className="mt-4 font-serif text-h2 font-semibold text-ink">{c.title}</h2>
      </InkReveal>

      <div ref={ref} className="mt-14">
        {/* ——— desktop: horizontal path ——— */}
        <div className="relative hidden md:block">
          {/* track + flowing ink dot */}
          <div aria-hidden="true" className="absolute -top-5 left-0 h-px w-full bg-museum-line" />
          <motion.span
            aria-hidden="true"
            className="absolute -top-[23px] left-0 h-2 w-2 -translate-x-1/2 rounded-full bg-dai"
            style={{ left: dotX }}
          />

          <div className="flex items-stretch gap-0">
            {c.steps.map((step, i) => {
              const isLit = i < lit
              return (
                <div key={step.cmd} className="flex min-w-0 flex-1 items-stretch">
                  {i > 0 && (
                    <span aria-hidden="true" className="relative mx-1 self-center">
                      <span className="block h-px w-6 bg-museum-line" />
                      <span className="absolute -right-px top-1/2 h-1.5 w-1.5 -translate-y-1/2 rotate-45 border-r border-t border-museum-line" />
                    </span>
                  )}
                  <button
                    type="button"
                    onMouseEnter={() => setHovered(step.cmd)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(step.cmd)}
                    onBlur={() => setHovered(null)}
                    className={cn(
                      'min-w-0 flex-1 border p-4 text-left transition-colors duration-500',
                      isLit
                        ? 'border-dai bg-[color-mix(in_srgb,var(--dai)_8%,var(--paper))]'
                        : 'border-museum-line bg-paper',
                    )}
                  >
                    <span
                      className={cn(
                        'block truncate font-mono text-sm font-medium transition-colors duration-500',
                        isLit ? 'text-dai' : 'text-ink-2',
                      )}
                    >
                      {step.cmd}
                    </span>
                    <span className="mt-1 block text-xs text-faint">{step.note}</span>
                    <span className="mt-3 block h-5">
                      <TypeLine key={step.example} text={step.example} active={hovered === step.cmd} />
                    </span>
                  </button>
                </div>
              )
            })}
          </div>

          {/* loop-back dashed line */}
          <div aria-hidden="true" className="relative mx-8 mt-0 h-10">
            <span className="absolute left-0 top-0 h-4 border-l border-dashed border-museum-line" />
            <span className="absolute right-0 top-0 h-4 border-l border-dashed border-museum-line" />
            <span className="absolute inset-x-0 top-4 border-t border-dashed border-museum-line" />
            <span className="absolute left-1/2 top-4 -translate-x-1/2 bg-paper px-3 font-mono text-[10px] text-faint">
              {c.loopLabel}
            </span>
          </div>
        </div>

        {/* ——— mobile: vertical steps ——— */}
        <ol className="space-y-0 md:hidden">
          {c.steps.map((step, i) => {
            const isLit = i < lit
            return (
              <li key={step.cmd}>
                {i > 0 && (
                  <span aria-hidden="true" className="mx-6 block h-6 w-px bg-museum-line" />
                )}
                <button
                  type="button"
                  onClick={() => setHovered(hovered === step.cmd ? null : step.cmd)}
                  className={cn(
                    'w-full border p-4 text-left transition-colors duration-500',
                    isLit
                      ? 'border-dai bg-[color-mix(in_srgb,var(--dai)_8%,var(--paper))]'
                      : 'border-museum-line bg-paper',
                  )}
                >
                  <span
                    className={cn(
                      'font-mono text-sm font-medium',
                      isLit ? 'text-dai' : 'text-ink-2',
                    )}
                  >
                    {step.cmd}
                  </span>
                  <span className="ml-3 text-xs text-faint">{step.note}</span>
                  <span className="mt-2 block h-5">
                    <TypeLine key={step.example} text={step.example} active={hovered === step.cmd} />
                  </span>
                </button>
              </li>
            )
          })}
          <li className="pt-4 text-center font-mono text-[10px] text-faint">{c.loopLabel}</li>
        </ol>
      </div>
    </section>
  )
}
