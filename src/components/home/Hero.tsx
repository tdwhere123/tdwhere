import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLang } from '@/context/LangContext'
import MetaChip from '@/components/MetaChip'
import ScrollCue from '@/components/ScrollCue'
import SealMark from '@/components/SealMark'
import Stamp from '@/components/Stamp'
import useTypewriter from '@/hooks/useTypewriter'
import useCopyText from '@/hooks/useCopyText'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const ZEN = 'power3.out' // ≈ cubic-bezier(0.22, 1, 0.36, 1)

/** S1 · Hero 「圆相」 — load sequence + ensō self-draw + mouse/scroll parallax. */
export default function Hero() {
  const { t, lang } = useLang()
  const heroRef = useRef<HTMLElement>(null)
  const inkRef = useRef<HTMLDivElement>(null)
  const ensoWrapRef = useRef<HTMLDivElement>(null)
  const ensoPathRef = useRef<SVGPathElement>(null)
  const ensoDotRef = useRef<SVGCircleElement>(null)
  const streaksRef = useRef<SVGGElement>(null)
  const nameARef = useRef<HTMLSpanElement>(null)
  const nameBRef = useRef<HTMLSpanElement>(null)
  const rowsRef = useRef<HTMLDivElement>(null)
  const sealRef = useRef<HTMLDivElement>(null)
  const chipsRef = useRef<HTMLDivElement>(null)
  const cueRef = useRef<HTMLDivElement>(null)

  const typed = useTypewriter([t.hero.signature], {
    typeMs: lang === 'zh' ? 55 : 22,
    holdMs: 3200,
    startDelayMs: 1500,
  })
  const { copied, copy } = useCopyText(t.meta.email)

  useGSAP(
    () => {
      const hero = heroRef.current
      const path = ensoPathRef.current
      const dot = ensoDotRef.current
      const streaks = streaksRef.current
      if (!hero || !path || !dot || !streaks) return

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const fine = window.matchMedia('(pointer: fine)').matches

      if (reduced) {
        gsap.set(hero, { opacity: 1 })
        gsap.set(path, { strokeDashoffset: 0 })
        gsap.set(dot, { opacity: 0 })
        gsap.set(streaks, { opacity: 1 })
        return
      }

      /* initial states */
      gsap.set(path, { strokeDasharray: 1200, strokeDashoffset: 1200 })
      gsap.set(streaks, { opacity: 0 })
      gsap.set([nameARef.current, nameBRef.current], { y: 60, opacity: 0, filter: 'blur(12px)' })
      gsap.set(rowsRef.current?.children ?? [], { y: 40, opacity: 0, filter: 'blur(8px)' })
      gsap.set(sealRef.current, { scale: 1.7, rotate: -10, opacity: 0 })
      gsap.set([chipsRef.current, cueRef.current], { y: 24, opacity: 0 })

      const total = path.getTotalLength()
      const draw = { v: 1200 }

      /* —— load sequence (~3.4s) —— */
      const tl = gsap.timeline({ defaults: { ease: ZEN } })
      tl.fromTo(hero, { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0)
      tl.to(
        draw,
        {
          v: 0,
          duration: 2.4,
          ease: 'power2.inOut',
          onUpdate: () => {
            path.style.strokeDashoffset = String(draw.v)
            const p = path.getPointAtLength(total * ((1200 - draw.v) / 1200))
            dot.setAttribute('cx', String(p.x))
            dot.setAttribute('cy', String(p.y))
          },
        },
        0.1,
      )
      tl.to(dot, { opacity: 0, duration: 0.3 }, '>-0.1')
      tl.to(streaks, { opacity: 1, duration: 0.6 }, '<')
      tl.to(nameARef.current, { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.9 }, 0.5)
      tl.to(nameBRef.current, { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.9 }, 0.65)
      tl.to(
        rowsRef.current?.children ?? [],
        { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.9, stagger: 0.12 },
        1.1,
      )
      /* seal lands + 4px page tremor */
      tl.to(
        sealRef.current,
        { scale: 1, rotate: -4, opacity: 1, duration: 0.38, ease: 'back.out(1.7)' },
        2.6,
      )
      tl.to(hero, { y: -4, duration: 0.04, yoyo: true, repeat: 1 }, 2.6)
      tl.to([chipsRef.current, cueRef.current], { y: 0, opacity: 1, duration: 0.8, stagger: 0.15 }, 2.9)

      /* scroll parallax — ink mountains drift up */
      gsap.to(inkRef.current, {
        yPercent: -12,
        ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 },
      })

      /* mouse parallax (desktop): mountains ±10px, ensō ∓6px */
      if (fine) {
        const inkX = gsap.quickTo(inkRef.current, 'x', { duration: 0.9, ease: 'power2.out' })
        const inkY = gsap.quickTo(inkRef.current, 'y', { duration: 0.9, ease: 'power2.out' })
        const ensoX = gsap.quickTo(ensoWrapRef.current, 'x', { duration: 0.9, ease: 'power2.out' })
        const ensoY = gsap.quickTo(ensoWrapRef.current, 'y', { duration: 0.9, ease: 'power2.out' })
        const onMove = (e: MouseEvent) => {
          const r = hero.getBoundingClientRect()
          const nx = (e.clientX - r.left) / r.width - 0.5
          const ny = (e.clientY - r.top) / r.height - 0.5
          inkX(nx * 20)
          inkY(ny * 20)
          ensoX(-nx * 12)
          ensoY(-ny * 12)
        }
        hero.addEventListener('mousemove', onMove)
        return () => hero.removeEventListener('mousemove', onMove)
      }
      return undefined
    },
    { scope: heroRef },
  )

  return (
    <section
      ref={heroRef}
      style={{ opacity: 0 }}
      className="relative -mt-16 flex min-h-[100dvh] min-h-[640px] items-center overflow-hidden"
      aria-label={t.hero.role}
    >
      {/* ink-wash mountains */}
      <div ref={inkRef} className="pointer-events-none absolute -right-[8%] top-0 h-full w-[72%]">
        <img
          src="/ink-wash-hero.png"
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-right opacity-[0.35] select-none"
        />
      </div>

      {/* ensō, self-drawn behind the giant name */}
      <div
        ref={ensoWrapRef}
        aria-hidden="true"
        className="pointer-events-none absolute right-[6vw] top-[12vh] w-[min(560px,62vw)]"
      >
        <svg viewBox="0 0 800 800" fill="none" className="h-auto w-full opacity-90">
          <defs>
            <filter id="enso-rough" x="-8%" y="-8%" width="116%" height="116%">
              <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="3" seed="7" result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale="14" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
          <g filter="url(#enso-rough)">
            <path
              ref={ensoPathRef}
              d="M 644.2 259.0 A 282 282 0 0 1 659.4 494.4 A 276 276 0 0 1 400.0 684.0 A 284 284 0 0 1 142.5 493.7 A 274 274 0 0 1 220.6 186.2 A 279 279 0 0 1 495.8 136.9"
              pathLength={1200}
              stroke="var(--ink)"
              strokeWidth={34}
              strokeLinecap="round"
              fill="none"
            />
            <g ref={streaksRef} stroke="var(--ink)" fill="none" strokeLinecap="round" opacity={0}>
              <path d="M 508 128 A 279 279 0 0 1 556 152" strokeWidth={7} opacity={0.5} />
              <path d="M 492 120 A 292 292 0 0 1 548 140" strokeWidth={4} opacity={0.38} />
              <path d="M 522 146 A 262 262 0 0 1 566 172" strokeWidth={3} opacity={0.3} />
            </g>
            <path
              d="M 640 250 A 288 288 0 0 1 668 330"
              stroke="var(--ink)"
              strokeWidth={10}
              opacity={0.55}
              strokeLinecap="round"
              fill="none"
            />
            <circle ref={ensoDotRef} r={8} fill="var(--ink)" />
          </g>
        </svg>
      </div>

      {/* tea stain, lower-left edge */}
      <img
        src="/stain-ring.svg"
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="pointer-events-none absolute -left-10 bottom-[6%] w-[220px] rotate-[14deg] opacity-50 select-none"
      />

      {/* vertical caption on the far left */}
      <span
        aria-hidden="true"
        className="vertical-rl absolute left-7 top-1/2 hidden -translate-y-1/2 select-none font-serif text-sm text-faint xl:block"
      >
        {t.hero.vertical}
      </span>

      {/* main content */}
      <div className="relative z-10 mx-auto w-full max-w-shell px-5 pb-24 pt-32 md:px-10">
        <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-faint">
          {t.hero.kicker}
        </p>

        <h1 className="mt-6 font-serif text-hero font-bold text-ink transition-[filter] [transition-duration:400ms] hover:brightness-[0.97]">
          <span ref={nameARef} className="inline-block will-change-transform">
            {t.hero.nameA}
          </span>
          <span ref={nameBRef} className="inline-block will-change-transform">
            {t.hero.nameB}
          </span>
        </h1>

        <div ref={rowsRef}>
          <p className="mt-4 font-mono text-lg">
            <span className="text-tea">{t.hero.handle}</span>
            <span className="text-faint"> {t.hero.handleSuffix}</span>
          </p>
          <p className="mt-5 font-serif text-[clamp(22px,2.6vw,32px)] font-semibold text-ink-2">
            {t.hero.role}
          </p>
          <p className="mt-4 min-h-[1.8em] font-mono text-[15px] text-ink-3">
            &gt; {typed}
            <span aria-hidden="true" className="animate-caret-blink [animation-duration:1.06s]">
              ▌
            </span>
          </p>
        </div>

        {/* meta chips */}
        <div ref={chipsRef} className="mt-8 flex flex-wrap items-center gap-3">
          {t.hero.chips.map((c) => (
            <MetaChip key={c}>{c}</MetaChip>
          ))}
          <span className="relative inline-flex">
            <button
              type="button"
              onClick={copy}
              aria-label={`${t.common.copy}: ${t.meta.email}`}
              className="group inline-flex items-center rounded-full border border-hairline bg-paper px-3 py-1 font-mono text-xs text-ink-3 transition-colors duration-300 hover:border-seal hover:text-ink"
            >
              {t.meta.email}
              <span
                aria-hidden="true"
                className="absolute bottom-0 left-3 right-3 h-px origin-left scale-x-0 bg-seal transition-transform duration-300 ease-zen group-hover:scale-x-100"
              />
            </button>
            <AnimatePresence>
              {copied && (
                <motion.span
                  key="hero-copied"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.25 } }}
                  className="absolute -top-10 right-0"
                >
                  <Stamp text={t.common.copied} animateOnView={false} />
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        </div>
      </div>

      {/* seal, bottom right */}
      <div ref={sealRef} className="absolute bottom-[10%] right-[8%] hidden md:block">
        <SealMark size={64} />
      </div>

      <div ref={cueRef} className="absolute bottom-7 left-1/2 -translate-x-1/2">
        <ScrollCue />
      </div>
    </section>
  )
}
