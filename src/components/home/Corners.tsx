import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useInView } from 'framer-motion'
import { useLang } from '@/context/LangContext'
import Kicker from '@/components/Kicker'
import Stamp from '@/components/Stamp'
import InkReveal from '@/components/InkReveal'
import useTypewriter from '@/hooks/useTypewriter'

/** mini CRT preview — amber phosphor screen with rolling scanlines + typing loop */
function MiniCrt() {
  const { t } = useLang()
  const typed = useTypewriter(t.corners.crtLines, { typeMs: 55, holdMs: 2600 })
  return (
    <div
      className="relative h-[180px] w-[240px] overflow-hidden rounded-[18px] border border-amber-dim/40 bg-night-2"
      style={{ boxShadow: 'inset 0 0 42px rgba(229, 163, 61, 0.10), 0 0 24px rgba(229, 163, 61, 0.06)' }}
      data-native-cursor
    >
      {/* scanlines */}
      <div aria-hidden="true" className="crt-scanlines animate-scanlines absolute inset-0 opacity-70" />
      {/* phosphor text */}
      <p className="relative z-10 p-4 font-mono text-[13px] leading-relaxed text-amber">
        {typed}
        <span aria-hidden="true" className="animate-caret-blink [animation-duration:1.06s]">
          ▌
        </span>
      </p>
      {/* vignette for the barrel feel */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[18px]"
        style={{ boxShadow: 'inset 0 0 28px rgba(0, 0, 0, 0.55)' }}
      />
    </div>
  )
}

/** fanned deck of vegetarian recipe cards; fans wider on hover */
function CardFan() {
  const { t } = useLang()
  const cards = [
    { rotate: -8, hoverRotate: -14, x: 0, z: 1, top: false },
    { rotate: 8, hoverRotate: 14, x: 124, z: 2, top: false },
    { rotate: 0, hoverRotate: 0, x: 62, z: 3, top: true }, /* 罗汉斋 on top */
  ]
  return (
    <div className="group relative h-[200px] w-[290px]" data-cursor="hover">
      {cards.map((c, i) => (
        <div
          key={i}
          className="absolute top-0 flex h-[190px] w-[150px] flex-col rounded-xl border border-hairline bg-paper p-4 shadow-card transition-transform [transition-duration:350ms] ease-stamp"
          style={{
            left: c.x,
            zIndex: c.z,
            transform: `rotate(var(--fan-rotate, ${c.rotate}deg))`,
            transformOrigin: '50% 100%',
            ['--fan-hover' as string]: `${c.hoverRotate}deg`,
          }}
        >
          {c.top ? (
            <>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">No.01</p>
              <p className="mt-3 font-serif text-2xl font-semibold text-ink">{t.corners.cardTop}</p>
              <span className="mt-3 block h-px w-10 bg-hairline" />
              <p className="mt-3 font-mono text-[10px] text-faint">vegetarian-card</p>
            </>
          ) : (
            <div aria-hidden="true" className="mt-2 space-y-3">
              {[0, 1, 2, 3].map((r) => (
                <span key={r} className="block h-px bg-hairline" style={{ width: `${86 - r * 14}%` }} />
              ))}
            </div>
          )}
        </div>
      ))}
      {/* hover fan-out via per-card CSS var */}
      <style>{`
        .group:hover > div { --fan-rotate: var(--fan-hover); }
      `}</style>
    </div>
  )
}

/** S4 · 角落预告 The Corners — the one dark strip on the home page. */
export default function Corners() {
  const { t } = useLang()
  const revealRef = useRef<HTMLDivElement>(null)
  const inView = useInView(revealRef, { once: true, amount: 0.15 })
  return (
    <section className="relative overflow-hidden bg-night text-paper" aria-label={t.corners.kicker}>
      {/* curtain pull: clip-path inset reveal, CSS-driven (0.8s ease-zen).
          NB: the observed wrapper stays un-clipped — clip-path zeroes IntersectionObserver ratio. */}
      <div ref={revealRef}>
        <div
          className="mx-auto max-w-shell px-5 py-24 transition-[clip-path] [transition-duration:800ms] ease-zen md:px-10"
          style={{ clipPath: inView ? 'inset(0% 0 0 0)' : 'inset(100% 0 0 0)' }}
        >
        <Kicker light>{t.corners.kicker}</Kicker>

        <div className="mt-14 grid gap-16 lg:grid-cols-2">
          {/* left — SENTINEL ruin */}
          <InkReveal amount={0.2}>
            <MiniCrt />
            <h3 className="mt-8 font-serif text-2xl font-semibold text-paper">
              {t.corners.leftTitle}
            </h3>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-paper/60">
              {t.corners.leftLine}
            </p>
            <p className="mt-6">
              <Stamp text={t.corners.leftStamp} />
            </p>
          </InkReveal>

          {/* right — vegetarian-card drawer */}
          <InkReveal amount={0.2} delay={0.12}>
            <CardFan />
            <h3 className="mt-8 font-serif text-2xl font-semibold text-paper">
              {t.corners.rightTitle}
            </h3>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-paper/60">
              {t.corners.rightLine}
            </p>
          </InkReveal>
        </div>

        <InkReveal amount={0.4} delay={0.2} className="mt-14">
          <Link
            to="/playground"
            className="group relative inline-block font-mono text-sm text-paper/80 transition-colors duration-300 hover:text-amber"
          >
            {t.corners.cta.replace(' →', '')}
            <span className="ml-1 inline-block transition-transform duration-300 ease-zen group-hover:translate-x-1.5">
              →
            </span>
            <span
              aria-hidden="true"
              className="absolute -bottom-1 left-0 h-px w-0 bg-amber transition-all duration-300 ease-zen group-hover:w-full"
            />
          </Link>
        </InkReveal>
        </div>
      </div>
    </section>
  )
}
