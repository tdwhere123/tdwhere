import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { useLang } from '@/context/LangContext'
import { alayaContent } from '@/content/alaya'
import InkReveal from '@/components/InkReveal'
import Kicker from '@/components/Kicker'
import { cn } from '@/lib/utils'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/**
 * S5 · Recall, In Order — four-stage pipeline. Scroll-scrubbed ink dot passes
 * coarse → FTS → rerank (each lights 0.3s), then fades & shrinks into the
 * dashed embedding stage: weight only, never overrides.
 */
export default function Recall() {
  const { lang } = useLang()
  const a = alayaContent[lang].recall
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const dotHRef = useRef<HTMLSpanElement>(null)
  const dotVRef = useRef<HTMLSpanElement>(null)

  useGSAP(
    () => {
      const section = sectionRef.current
      const track = trackRef.current
      if (!section || !track) return
      const boxes = gsap.utils.toArray<HTMLElement>('[data-stage]', track)
      if (boxes.length === 0) return

      /* cool sage lit — moss×dai so stages read museum, not muddy */
      const sage = 'color-mix(in srgb, var(--moss) 70%, var(--dai))'
      const lit = {
        borderColor: sage,
        backgroundColor: `color-mix(in srgb, ${sage} 7%, var(--paper))`,
      }

      /* reduced motion → static final state */
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set(boxes, lit)
        gsap.set([dotHRef.current, dotVRef.current], { opacity: 0 })
        return
      }

      const centerOf = (el: HTMLElement, axis: 'x' | 'y') => {
        const b = el.getBoundingClientRect()
        const t = track.getBoundingClientRect()
        return axis === 'x' ? b.left - t.left + b.width / 2 : b.top - t.top + b.height / 2
      }

      const mm = gsap.matchMedia()

      mm.add('(min-width: 768px)', () => {
        const dot = dotHRef.current
        if (!dot) return undefined
        gsap.set(dot, { xPercent: -50, yPercent: -50, scale: 1, opacity: 1 })
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: section,
            start: 'top 70%',
            end: 'bottom 40%',
            scrub: 0.5,
            invalidateOnRefresh: true,
          },
        })
        boxes.forEach((box, i) => {
          tl.to(dot, { x: () => centerOf(box, 'x'), duration: 1 }, i)
          tl.to(box, { ...lit, duration: 0.3 }, i + 0.7)
        })
        /* stage 4: the dot thins out — weight only */
        tl.to(dot, { scale: 0.5, opacity: 0.35, duration: 0.5 }, boxes.length - 0.3)
        return () => tl.kill()
      })

      mm.add('(max-width: 767px)', () => {
        const dot = dotVRef.current
        if (!dot) return undefined
        gsap.set(dot, { xPercent: -50, yPercent: -50, scale: 1, opacity: 1 })
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: section,
            start: 'top 65%',
            end: 'bottom 55%',
            scrub: 0.5,
            invalidateOnRefresh: true,
          },
        })
        boxes.forEach((box, i) => {
          tl.to(dot, { y: () => centerOf(box, 'y'), duration: 1 }, i)
          tl.to(box, { ...lit, duration: 0.3 }, i + 0.7)
        })
        tl.to(dot, { scale: 0.5, opacity: 0.35, duration: 0.5 }, boxes.length - 0.3)
        return () => tl.kill()
      })

      return () => mm.revert()
    },
    { scope: sectionRef },
  )

  return (
    <section
      ref={sectionRef}
      className="mx-auto max-w-demo px-5 py-24 md:px-10 md:py-32"
      aria-label={a.title}
    >
      <InkReveal amount={0.5}>
        <Kicker>{a.kicker}</Kicker>
      </InkReveal>
      <InkReveal amount={0.4} delay={0.08}>
        <h2 className="mt-6 font-serif text-h2 font-semibold text-ink">{a.title}</h2>
      </InkReveal>

      <InkReveal amount={0.2} className="mt-14">
        <div ref={trackRef} className="relative">
          {/* connecting lines */}
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-1/2 hidden h-px bg-hairline md:block"
          />
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-1/2 w-px bg-hairline md:hidden"
          />
          {/* traveling dots (one per orientation) */}
          <span
            ref={dotHRef}
            aria-hidden="true"
            className="absolute left-0 top-1/2 z-20 hidden h-3 w-3 rounded-full bg-ink md:block"
          />
          <span
            ref={dotVRef}
            aria-hidden="true"
            className="absolute left-1/2 top-0 z-20 h-3 w-3 rounded-full bg-ink md:hidden"
          />

          <div className="relative z-10 grid gap-6 md:grid-cols-4 md:gap-4">
            {a.stages.map((s, i) => {
              const last = i === a.stages.length - 1
              return (
                <div
                  key={s}
                  data-stage
                  className={cn(
                    'rounded-[10px] border bg-paper p-5 text-center transition-none',
                    last ? 'border-dashed border-faint' : 'border-hairline',
                  )}
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                    0{i + 1}
                  </p>
                  <p
                    className={cn(
                      'mt-1.5 text-sm font-medium',
                      last ? 'text-ink-3' : 'text-ink-2',
                    )}
                  >
                    {s}
                  </p>
                  {last && (
                    <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
                      {a.never}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </InkReveal>

      <InkReveal amount={0.5} className="mt-8">
        <p className="font-mono text-xs text-faint">{a.note}</p>
      </InkReveal>
    </section>
  )
}
