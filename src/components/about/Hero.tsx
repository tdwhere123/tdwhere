import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useLang } from '@/context/LangContext'
import { aboutContent } from '@/content/about'
import Kicker from '@/components/Kicker'
import SealMark from '@/components/SealMark'
import useTypeOnce from '@/components/about/useTypeOnce'
import { asset } from '@/lib/asset'

gsap.registerPlugin(useGSAP)

const ZEN = 'power3.out' // ≈ cubic-bezier(0.22, 1, 0.36, 1)

/**
 * S1 · 页头 The Gardener — gate-open entrance, char-level ink reveal of 阿黄,
 * curtain-reveal still life on stone matte, type-once signature, seal stamp landing.
 */
export default function Hero() {
  const { lang } = useLang()
  const c = aboutContent[lang].hero
  const heroRef = useRef<HTMLElement>(null)
  const gateLRef = useRef<HTMLSpanElement>(null)
  const gateRRef = useRef<HTMLSpanElement>(null)
  const kickerRef = useRef<HTMLDivElement>(null)
  const nameARef = useRef<HTMLSpanElement>(null)
  const nameBRef = useRef<HTMLSpanElement>(null)
  const rowsRef = useRef<HTMLDivElement>(null)
  const sealRef = useRef<HTMLSpanElement>(null)
  const stillRef = useRef<HTMLDivElement>(null)
  const stainRef = useRef<HTMLImageElement>(null)
  const ensoRef = useRef<HTMLImageElement>(null)

  /* signature types once, then stays (no loop) */
  const typed = useTypeOnce(c.signature, {
    typeMs: lang === 'zh' ? 55 : 22,
    startDelayMs: 1700,
  })

  useGSAP(
    () => {
      const hero = heroRef.current
      if (!hero) return

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const rows = rowsRef.current?.children ?? []

      if (reduced) {
        /* static end state: no gate, decorations shown as designed */
        gsap.set([gateLRef.current, gateRRef.current], { display: 'none' })
        gsap.set(ensoRef.current, { opacity: 0.16 })
        gsap.set(stainRef.current, { opacity: 0.28 })
        return
      }

      /* initial states */
      gsap.set([nameARef.current, nameBRef.current], { y: 50, opacity: 0, filter: 'blur(10px)' })
      gsap.set(kickerRef.current, { y: 24, opacity: 0, filter: 'blur(6px)' })
      gsap.set(rows, { y: 40, opacity: 0, filter: 'blur(8px)' })
      gsap.set(sealRef.current, { scale: 1.7, rotate: -10, opacity: 0 })
      gsap.set(stillRef.current, { clipPath: 'inset(0% 100% 0% 0%)' })
      gsap.set(stainRef.current, { opacity: 0, scale: 0.92 })
      gsap.set(ensoRef.current, { opacity: 0 })

      /* —— gate open + ink reveal load sequence (~2.6s) —— */
      const tl = gsap.timeline({ defaults: { ease: ZEN } })
      /* two vertical lines slide apart, 0.7s each, staggered 0.08s */
      tl.to(gateLRef.current, { x: '-46vw', duration: 0.7, ease: 'power2.inOut' }, 0.15)
      tl.to(gateRRef.current, { x: '46vw', duration: 0.7, ease: 'power2.inOut' }, 0.23)
      tl.set([gateLRef.current, gateRRef.current], { display: 'none' }, 1.0)
      /* content ink-reveals as the gate opens */
      tl.to(kickerRef.current, { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.7 }, 0.35)
      tl.to(nameARef.current, { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.9 }, 0.45)
      tl.to(nameBRef.current, { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.9 }, 0.6)
      tl.to(ensoRef.current, { opacity: 0.16, duration: 1.4 }, 0.7)
      /* still-life curtain, drawn open from the left */
      tl.to(stillRef.current, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.0 }, 0.55)
      tl.to(stainRef.current, { opacity: 0.28, scale: 1, duration: 1.2 }, 1.2)
      tl.to(rows, { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.9, stagger: 0.1 }, 0.95)
      /* seal lands on the signature line + 4px tremor */
      tl.to(sealRef.current, { scale: 1, rotate: -4, opacity: 1, duration: 0.38, ease: 'back.out(1.7)' }, 1.9)
      tl.to(hero, { y: -4, duration: 0.04, yoyo: true, repeat: 1 }, 1.9)
    },
    { scope: heroRef, dependencies: [lang] },
  )

  return (
    <section
      ref={heroRef}
      className="relative overflow-hidden"
      aria-label={`${c.nameA}${c.nameB} · ${c.handle} — ${c.role}`}
    >
      {/* gate-open lines (page entrance) */}
      <span
        ref={gateLRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 z-30 h-full w-px -translate-x-[5px] bg-museum-line"
      />
      <span
        ref={gateRRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 z-30 h-full w-px translate-x-[4px] bg-museum-line"
      />

      <div className="mx-auto grid w-full max-w-shell items-center gap-12 px-5 py-[clamp(64px,10vh,120px)] md:px-10 lg:grid-cols-[55fr_45fr] lg:gap-16">
        {/* left column — identity */}
        <div className="relative">
          <img
            ref={ensoRef}
            src={asset('enso.svg')}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -left-20 -top-24 w-[min(380px,70vw)] select-none opacity-0"
          />

          <div ref={kickerRef}>
            <Kicker>{c.kicker}</Kicker>
          </div>

          <h1 className="relative mt-8 font-serif text-[clamp(64px,10vw,120px)] font-bold leading-[1.05] tracking-[0.02em] text-museum-ink">
            <span ref={nameARef} className="inline-block will-change-transform">
              {c.nameA}
            </span>
            <span ref={nameBRef} className="inline-block will-change-transform">
              {c.nameB}
            </span>
          </h1>

          <div ref={rowsRef}>
            <p className="mt-4 font-mono text-lg text-museum-brass">{c.handle}</p>
            <p className="mt-5 font-serif text-2xl font-semibold text-museum-ink">{c.role}</p>
            <p className="mt-4 flex min-h-[3.5rem] flex-wrap items-center gap-4 font-mono text-[15px] text-museum-muted">
              <span>
                <span className="sr-only">{c.signature}</span>
                <span aria-hidden="true" className="text-museum-muted/70">
                  &gt;&nbsp;
                </span>
                <span aria-hidden="true">{typed}</span>
                <span aria-hidden="true" className="animate-caret-blink text-museum-brass [animation-duration:1.06s]">
                  ▌
                </span>
              </span>
              <span
                ref={sealRef}
                className="inline-block opacity-90 will-change-transform [filter:saturate(0.68)_brightness(0.96)]"
              >
                <SealMark size={48} />
              </span>
            </p>
          </div>
        </div>

        {/* right column — still life on museum-stone matte (no mint/cream frame clash) */}
        <div className="relative">
          <div
            ref={stillRef}
            className="overflow-hidden border border-museum-brass/25 bg-museum-stone p-3 md:p-4"
          >
            <img
              src={asset('about-still.png')}
              alt={c.stillAlt}
              className="block aspect-[4/3] w-full select-none object-cover"
            />
          </div>
          <img
            ref={stainRef}
            src={asset('stain-ring.svg')}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="pointer-events-none absolute -bottom-10 -left-10 w-[160px] rotate-[18deg] select-none opacity-0 md:w-[190px] [filter:saturate(0.45)_hue-rotate(12deg)_brightness(0.9)]"
          />
        </div>
      </div>
    </section>
  )
}
