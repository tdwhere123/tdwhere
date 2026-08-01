import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useLang } from '@/context/LangContext'
import { alayaContent } from '@/content/alaya'
import MetaChip from '@/components/MetaChip'
import Kicker from '@/components/Kicker'
import { getLenis } from '@/lib/smooth-scroll'

gsap.registerPlugin(useGSAP)

/** Soft moss/cobalt wash — CSS drift (no GSAP ticker on the hero wash). */
function MossGlow() {
  return (
    <>
      <style>{`
        @keyframes alaya-moss-drift {
          from { transform: translate(0, 0); }
          to { transform: translate(56px, -36px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .alaya-moss-glow { animation: none !important; }
        }
      `}</style>
      <div
        aria-hidden="true"
        className="alaya-moss-glow pointer-events-none absolute -right-24 top-1/4 h-[600px] w-[600px]"
        style={{
          background:
            'radial-gradient(circle, color-mix(in srgb, color-mix(in srgb, var(--moss) 52%, var(--cobalt)) 7%, transparent) 0%, transparent 72%)',
          opacity: 0.42,
          animation: 'alaya-moss-drift 10s ease-in-out infinite alternate',
        }}
      />
    </>
  )
}

/** Quiet thin ring + orbit dots — museum accent, not UI chrome. */
function HeroOrbitMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 120 120"
      className="pointer-events-none absolute -right-2 top-[18%] hidden h-36 w-36 opacity-40 md:block lg:right-8"
    >
      <circle
        cx="60"
        cy="60"
        r="48"
        fill="none"
        stroke="var(--cobalt)"
        strokeWidth="0.75"
        opacity="0.45"
      />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const rad = ((i * 60 - 90) * Math.PI) / 180
        return (
          <circle
            key={i}
            cx={60 + 48 * Math.cos(rad)}
            cy={60 + 48 * Math.sin(rad)}
            r="1.25"
            fill="var(--moss)"
            opacity="0.55"
          />
        )
      })}
    </svg>
  )
}

/** S1 · Project Hero — Gate Open entrance, char-level ink reveal, moss glow. */
export default function Hero() {
  const { lang, t } = useLang()
  const a = alayaContent[lang].hero
  const rootRef = useRef<HTMLElement>(null)
  const gateLRef = useRef<HTMLSpanElement>(null)
  const gateRRef = useRef<HTMLSpanElement>(null)

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return
      const chars = root.querySelectorAll('[data-char]')
      const blocks = root.querySelectorAll('[data-block]')
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      if (reduced) {
        gsap.set([gateLRef.current, gateRRef.current], { opacity: 0 })
        return
      }

      /* Gate Open — two vertical lines slide apart (scaleX 1→0, stagger 0.07s) */
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl.to(gateLRef.current, { scaleX: 0, duration: 0.55, ease: 'power2.inOut' }, 0.05)
      tl.to(gateRRef.current, { scaleX: 0, duration: 0.55, ease: 'power2.inOut' }, 0.12)
      /* from(): title/blocks start hidden for the gate beat; safety below
         recovers if the timeline is killed mid-tween (SPA leave). */
      tl.from(
        chars,
        { y: 36, opacity: 0, duration: 0.65, stagger: 0.03, immediateRender: true },
        0.28,
      )
      tl.from(
        blocks,
        { y: 28, opacity: 0, duration: 0.6, stagger: 0.07, immediateRender: true },
        0.5,
      )

      /* hard safety: hero fully visible by 1.2s even if GSAP is interrupted */
      const safety = window.setTimeout(() => {
        gsap.set([chars, blocks], { y: 0, opacity: 1 })
      }, 1200)
      return () => window.clearTimeout(safety)
    },
    { scope: rootRef },
  )

  const scrollToLifecycle = () => {
    const el = document.getElementById('lifecycle')
    if (!el) return
    const lenis = getLenis()
    if (lenis) lenis.scrollTo(el, { offset: -72 })
    else el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section
      ref={rootRef}
      className="relative mx-auto flex min-h-[78dvh] max-w-shell items-center overflow-hidden px-5 py-20 md:px-10"
      aria-label={a.title}
    >
      <MossGlow />
      <HeroOrbitMark />

      {/* Gate Open lines */}
      <span
        ref={gateLRef}
        aria-hidden="true"
        className="absolute inset-y-8 left-1/2 w-px origin-left -translate-x-[7px] bg-ink/50"
      />
      <span
        ref={gateRRef}
        aria-hidden="true"
        className="absolute inset-y-8 left-1/2 w-px origin-right translate-x-[7px] bg-ink/50"
      />

      {/* right vertical decoration */}
      <p
        aria-hidden="true"
        data-block
        className="vertical-rl absolute right-5 top-1/2 hidden -translate-y-1/2 select-none font-display text-sm tracking-[0.3em] text-faint md:right-10 lg:block"
      >
        {a.vertical}
      </p>

      <div className="relative max-w-3xl">
        <div data-block>
          <Kicker>{a.kicker}</Kicker>
        </div>

        <h1
          className="mt-8 font-display font-semibold text-ink"
          style={{ fontSize: 'clamp(40px, 7vw, 72px)', lineHeight: 1.05 }}
        >
          {Array.from(a.title).map((ch, i) => (
            <span key={i} data-char className="inline-block will-change-transform">
              {ch}
            </span>
          ))}
        </h1>

        <p data-block className="mt-5 text-lg text-ink-2 md:text-xl">
          {a.subtitle}
        </p>
        <p data-block className="mt-3 font-display text-xl italic text-ink-3 md:text-2xl">
          {a.slogan}
        </p>

        <div data-block className="mt-8 flex flex-wrap gap-2">
          {a.chips.map((chip) => (
            <MetaChip key={chip}>{chip}</MetaChip>
          ))}
        </div>

        <div data-block className="mt-10 flex flex-wrap items-center gap-4">
          <a
            href={t.meta.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-full border border-cobalt/70 px-6 py-3 font-mono text-sm text-ink transition-colors duration-300 hover:border-seal/75 hover:bg-seal/[0.04]"
          >
            {a.ctaGithub}
          </a>
          <button
            type="button"
            onClick={scrollToLifecycle}
            className="inline-flex items-center rounded-full border border-hairline px-6 py-3 font-mono text-sm text-ink-3 transition-colors duration-300 hover:border-moss hover:text-ink"
          >
            {a.ctaDemo}
          </button>
        </div>
      </div>
    </section>
  )
}
