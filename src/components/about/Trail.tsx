import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { useLang } from '@/context/LangContext'
import { aboutContent } from '@/content/about'
import InkReveal from '@/components/InkReveal'
import Kicker from '@/components/Kicker'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/* dot ignition points along the scrubbed line (fractions of the timeline) */
const DOT_AT = [0.04, 0.27, 0.5, 0.73, 0.95]

/**
 * S3 · 时间线 The Trail — horizontal on desktop, vertical on mobile.
 * Scroll scrub grows the hairline; ink dots light up in turn (back.out),
 * labels ink-reveal; the hollow end dot breathes at 1.6s.
 */
export default function Trail() {
  const { lang } = useLang()
  const c = aboutContent[lang].trail
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const lineHRef = useRef<HTMLSpanElement>(null)
  const lineVRef = useRef<HTMLSpanElement>(null)

  useGSAP(
    () => {
      const section = sectionRef.current
      const track = trackRef.current
      if (!section || !track) return
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      const dots = gsap.utils.toArray<HTMLElement>('[data-dot]', track)
      const labels = gsap.utils.toArray<HTMLElement>('[data-label]', track)
      const hollow = section.querySelector<HTMLElement>('[data-hollow]')
      const allDots = hollow ? [...dots, hollow] : dots

      gsap.set(allDots, { scale: 0 })
      gsap.set(labels, { y: 14, opacity: 0, filter: 'blur(4px)' })

      const mm = gsap.matchMedia()
      mm.add(
        { isDesktop: '(min-width: 768px)', isMobile: '(max-width: 767px)' },
        (ctx) => {
          const { isDesktop } = ctx.conditions as { isDesktop: boolean }
          const line = isDesktop ? lineHRef.current : lineVRef.current
          if (!line) return undefined

          gsap.set(line, isDesktop ? { scaleX: 0 } : { scaleY: 0 })

          const tl = gsap.timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
              trigger: track,
              start: 'top 78%',
              end: 'bottom 55%',
              scrub: 0.6,
            },
          })
          /* hairline grows from the left (or top on mobile) */
          tl.to(line, isDesktop ? { scaleX: 1, duration: 1 } : { scaleY: 1, duration: 1 }, 0)
          allDots.forEach((d, i) => {
            tl.to(d, { scale: 1, duration: 0.07, ease: 'back.out(2)' }, DOT_AT[i] ?? 0.95)
          })
          labels.forEach((l, i) => {
            tl.to(
              l,
              { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.12, ease: 'power2.out' },
              (DOT_AT[i] ?? 0.95) + 0.02,
            )
          })
          return undefined
        },
      )
    },
    { scope: sectionRef, dependencies: [lang] },
  )

  return (
    <section
      ref={sectionRef}
      aria-labelledby="trail-title"
      className="mx-auto max-w-shell px-5 py-[clamp(72px,12vh,140px)] md:px-10"
    >
      <InkReveal>
        <Kicker>{c.kicker}</Kicker>
        <h2 id="trail-title" className="mt-6 font-serif text-h2 font-semibold text-museum-ink">
          {c.title}
        </h2>
      </InkReveal>

      <div ref={trackRef} className="relative mt-16">
        {/* hairlines — horizontal (desktop) / vertical (mobile) */}
        <span
          ref={lineHRef}
          aria-hidden="true"
          className="absolute left-0 right-0 top-[3.5px] hidden h-px origin-left bg-museum-brass/40 md:block"
        />
        <span
          ref={lineVRef}
          aria-hidden="true"
          className="absolute bottom-2 left-[3.5px] top-2 w-px origin-top bg-museum-brass/40 md:hidden"
        />

        <ol className="flex flex-col gap-10 md:grid md:grid-cols-[repeat(4,minmax(0,1fr))_80px] md:gap-6">
          {c.nodes.map((n) => (
            <li key={`${n.date}-${n.tag}`} className="relative flex items-start gap-5 md:block">
              <span
                data-dot
                className="mt-[7px] block h-2 w-2 shrink-0 rounded-full bg-museum-ink will-change-transform md:mt-0"
              />
              <div data-label className="md:mt-5">
                <p className="font-mono text-xs text-museum-muted">{n.date}</p>
                <p className="mt-1 font-mono text-xs font-medium uppercase tracking-[0.14em] text-museum-brass">
                  {n.tag}
                </p>
                <p className="mt-2 max-w-[26ch] text-sm leading-relaxed text-museum-muted">{n.text}</p>
              </div>
            </li>
          ))}
          {/* hollow end dot — to be continued */}
          <li className="relative flex items-start gap-5 md:block" aria-label={c.more}>
            <span
              data-hollow
              aria-hidden="true"
              className="mt-[7px] block h-2 w-2 shrink-0 animate-pulse rounded-full border border-museum-brass/70 bg-transparent will-change-transform [animation-duration:1.6s] md:mt-0"
            />
            <p data-label className="font-mono text-xs text-museum-muted md:mt-5">
              {c.more}
            </p>
          </li>
        </ol>
      </div>
    </section>
  )
}
