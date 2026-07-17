import { useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { useLang } from '@/context/LangContext'
import Kicker from '@/components/Kicker'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const ACCENTS = ['var(--clay)', 'var(--moss)', 'var(--dai)']

/** S2 · 一条线 The Thread — pinned ~250vh scroll narrative (A → B → C). */
export default function Thread() {
  const { t, lang } = useLang()
  const sectionRef = useRef<HTMLElement>(null)
  const stageARef = useRef<HTMLDivElement>(null)
  const stageBRef = useRef<HTMLDivElement>(null)
  const stageCRef = useRef<HTMLDivElement>(null)
  const bLineRef = useRef<HTMLSpanElement>(null)
  const cItemsRef = useRef<SVGGElement>(null)
  const cLinesRef = useRef<SVGGElement>(null)
  const cDotRef = useRef<SVGCircleElement>(null)
  const cCaptionRef = useRef<HTMLParagraphElement>(null)
  const gateLRef = useRef<HTMLSpanElement>(null)
  const gateRRef = useRef<HTMLSpanElement>(null)

  const [reduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  const stageAUnits =
    lang === 'zh' ? Array.from(t.thread.stageA) : t.thread.stageA.split(' ')
  const stageBWords = t.thread.stageB

  useGSAP(
    () => {
      const section = sectionRef.current
      if (!section || reduced) return

      const aUnits = stageARef.current?.querySelectorAll('[data-u]') ?? []
      const bWords = stageBRef.current?.querySelectorAll('[data-u]') ?? []
      const cItems = cItemsRef.current?.querySelectorAll('[data-c-item]') ?? []
      const cLines = cLinesRef.current?.querySelectorAll('line') ?? []

      /* initial states */
      gsap.set(aUnits, { y: 30, opacity: 0, filter: 'blur(10px)' })
      gsap.set(bWords, { y: 40, opacity: 0, filter: 'blur(8px)' })
      gsap.set(bLineRef.current, { scaleX: 0 })
      gsap.set(stageBRef.current, { opacity: 1 })
      gsap.set(stageCRef.current, { opacity: 1 })
      const dirs = [{ x: -60 }, { y: 44 }, { x: 60 }]
      cItems.forEach((el, i) => gsap.set(el, { ...dirs[i % 3], opacity: 0 }))
      gsap.set(cLines, { strokeDasharray: 100, strokeDashoffset: 100 })
      gsap.set(cDotRef.current, { scale: 0, transformOrigin: '50% 50%' })
      gsap.set(cCaptionRef.current, { opacity: 0, y: 16 })
      gsap.set([gateLRef.current, gateRRef.current], { opacity: 0 })

      /* Stage A enters on approach (not scrubbed), so the section is never empty */
      gsap.to(aUnits, {
        y: 0,
        opacity: 1,
        filter: 'blur(0px)',
        duration: 0.9,
        stagger: 0.05,
        ease: 'power3.out',
        overwrite: 'auto',
        scrollTrigger: { trigger: section, start: 'top 80%', toggleActions: 'play none none reverse' },
      })

      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=250%',
          pin: true,
          scrub: 0.5,
          anticipatePin: 1,
        },
      })

      /* Stage A holds, then floats out */
      tl.to(stageARef.current, { y: -40, opacity: 0, duration: 0.7, ease: 'power2.in' }, 2.2)

      /* Stage B (30–65%) */
      tl.to(bWords, { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1.0, stagger: 0.35 }, 3.0)
      tl.to(bLineRef.current, { scaleX: 1, duration: 0.8, ease: 'power2.inOut' }, 4.5)
      tl.to(stageBRef.current, { y: -40, opacity: 0, duration: 0.7, ease: 'power2.in' }, 6.0)

      /* Stage C (65–100%) */
      tl.to(cItems, { x: 0, y: 0, opacity: 1, duration: 0.9, stagger: 0.25 }, 6.7)
      tl.to(cLines, { strokeDashoffset: 0, duration: 0.9, stagger: 0.12, ease: 'power2.inOut' }, 7.4)
      tl.to(cDotRef.current, { scale: 1, duration: 0.6, ease: 'back.out(2)' }, 7.9)
      tl.to(cCaptionRef.current, { opacity: 1, y: 0, duration: 0.6 }, 8.6)

      /* gate opens on the way out */
      tl.to([gateLRef.current, gateRRef.current], { opacity: 1, duration: 0.25 }, 9.2)
      tl.to(gateLRef.current, { x: '-46vw', duration: 0.7, ease: 'power2.inOut' }, 9.35)
      tl.to(gateRRef.current, { x: '46vw', duration: 0.7, ease: 'power2.inOut' }, 9.43)
    },
    { scope: sectionRef, dependencies: [lang, reduced] },
  )

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-paper-warm"
      aria-label={t.thread.kicker}
    >
      <div className={reduced ? 'flex flex-col gap-24 py-24' : 'relative h-[100dvh]'}>
        {/* kicker — vertical along the left edge on desktop */}
        <Kicker className="absolute left-5 top-8 z-20 md:hidden">{t.thread.kicker}</Kicker>
        <Kicker className="vertical-rl absolute left-6 top-1/2 z-20 hidden -translate-y-1/2 md:flex">
          {t.thread.kicker}
        </Kicker>

        {/* Stage A */}
        <div
          ref={stageARef}
          className={
            reduced
              ? 'px-6 text-center'
              : 'absolute inset-0 z-[3] grid place-items-center px-6 text-center'
          }
        >
          <p className="font-serif text-[clamp(30px,4.2vw,52px)] font-semibold leading-snug text-ink">
            {stageAUnits.map((u, i) => (
              <span key={i} data-u className="inline-block will-change-transform">
                {u}
                {lang === 'en' && i < stageAUnits.length - 1 ? ' ' : ''}
              </span>
            ))}
          </p>
        </div>

        {/* Stage B */}
        <div
          ref={stageBRef}
          className={
            reduced
              ? 'px-6 text-center'
              : 'absolute inset-0 z-[2] grid place-items-center px-6 text-center'
          }
        >
          <div>
            <p className="flex flex-wrap items-baseline justify-center gap-x-[0.18em] font-serif text-[clamp(34px,4.8vw,60px)] font-semibold leading-tight text-ink">
              {stageBWords.map((w, i) =>
                /agent/i.test(w) ? (
                  <em key={i} data-u className="inline-block font-serif italic will-change-transform">
                    {w}
                  </em>
                ) : (
                  <span key={i} data-u className="inline-block will-change-transform">
                    {w}
                  </span>
                ),
              )}
            </p>
            <span
              ref={bLineRef}
              aria-hidden="true"
              className="mx-auto mt-8 block h-px w-[120px] origin-left bg-ink-3"
            />
          </div>
        </div>

        {/* Stage C */}
        <div
          ref={stageCRef}
          className={
            reduced
              ? 'px-6 text-center'
              : 'absolute inset-0 z-[1] grid place-items-center px-6 text-center'
          }
        >
          <div className="w-full max-w-3xl">
            <svg viewBox="0 0 640 300" className="mx-auto w-full" role="img" aria-label="Process · Memory · Writing">
              <g ref={cLinesRef} stroke="var(--ink-3)" strokeWidth={1} opacity={0.6}>
                <line x1={110} y1={104} x2={320} y2={212} pathLength={100} />
                <line x1={320} y1={104} x2={320} y2={212} pathLength={100} />
                <line x1={530} y1={104} x2={320} y2={212} pathLength={100} />
              </g>
              <g ref={cItemsRef}>
                {t.thread.stageC.items.map((item, i) => {
                  const x = [110, 320, 530][i]
                  return (
                    <g key={item.project} data-c-item>
                      <circle cx={x} cy={56} r={5} fill={ACCENTS[i]} />
                      <text
                        x={x}
                        y={90}
                        textAnchor="middle"
                        fontFamily="'IBM Plex Mono', monospace"
                        fontSize={16}
                        fill="var(--ink)"
                      >
                        {item.label}
                      </text>
                      <text
                        x={x}
                        y={112}
                        textAnchor="middle"
                        fontFamily="'IBM Plex Mono', monospace"
                        fontSize={12}
                        fill="var(--faint)"
                      >
                        {item.project}
                      </text>
                    </g>
                  )
                })}
              </g>
              <circle ref={cDotRef} cx={320} cy={222} r={7} fill="var(--ink)" />
            </svg>
            <p ref={cCaptionRef} className="mt-6 text-sm text-ink-3">
              {t.thread.stageC.caption}
            </p>
          </div>
        </div>

        {/* gate pair — slides open when leaving the pin */}
        {!reduced && (
          <>
            <span
              ref={gateLRef}
              aria-hidden="true"
              className="absolute left-1/2 top-0 z-10 h-full w-px -translate-x-[5px] bg-ink-3"
            />
            <span
              ref={gateRRef}
              aria-hidden="true"
              className="absolute left-1/2 top-0 z-10 h-full w-px translate-x-[4px] bg-ink-3"
            />
          </>
        )}
      </div>
    </section>
  )
}
