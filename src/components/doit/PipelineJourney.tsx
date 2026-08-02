import { useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useLang } from '@/context/LangContext'
import { doItContent } from '@/content/doIt'
import Kicker from '@/components/Kicker'
import { cn } from '@/lib/utils'
import { ZEN } from '@/lib/motion'


gsap.registerPlugin(ScrollTrigger, useGSAP)

/**
 * 签名交互 · One task, four gates — a scroll-pinned journey: a single task
 * packet rides a cobalt rail through ROUTE → JUDGE → REVIEW → VERIFY while
 * the page is pinned; the packet's state badge swaps at each gate.
 * Desktop + motion-allowed only. Mobile / reduced-motion get a deliberate
 * tap-based stepper with the same content.
 */
export default function PipelineJourney() {
  const reduced = useReducedMotion() ?? false

  return (
    <div id="pipeline">
      {reduced ? (
        <TapJourney />
      ) : (
        <>
          <PinnedJourney />
          <div className="md:hidden">
            <TapJourney />
          </div>
        </>
      )}
    </div>
  )
}

/* ————— desktop signature: pinned, scrubbed ————— */

function PinnedJourney() {
  const { lang } = useLang()
  const c = doItContent[lang].pipeline
  const rootRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const progRef = useRef<HTMLSpanElement>(null)
  const packetRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const root = rootRef.current
      const track = trackRef.current
      const prog = progRef.current
      const packet = packetRef.current
      if (!root || !track || !prog || !packet) return

      const stations = gsap.utils.toArray<HTMLElement>('[data-station]', track)
      const lits = gsap.utils.toArray<HTMLElement>('[data-lit]', track)
      const badges = gsap.utils.toArray<HTMLElement>('[data-badge]', packet)
      const descs = gsap.utils.toArray<HTMLElement>('[data-desc]', root)
      if (stations.length === 0) return

      const centerX = (el: HTMLElement) => {
        const b = el.getBoundingClientRect()
        const t = track.getBoundingClientRect()
        return b.left - t.left + b.width / 2
      }

      const mm = gsap.matchMedia()

      mm.add('(min-width: 768px)', () => {
        gsap.set(packet, { xPercent: -50, opacity: 1 })
        gsap.set(prog, { scaleX: 0 })
        gsap.set(badges, { opacity: 0 })
        gsap.set(descs, { opacity: 0.3 })

        const n = stations.length
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: root,
            start: 'top top',
            end: '+=2200',
            pin: true,
            scrub: 0.6,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        })

        /* cobalt rail fills across the whole journey */
        tl.fromTo(prog, { scaleX: 0 }, { scaleX: 1, duration: n }, 0)

        stations.forEach((st, i) => {
          /* travel to gate i (first gate: already there) */
          tl.to(packet, { x: () => centerX(st), duration: i === 0 ? 0.001 : 1 }, i)
          const arrive = i === 0 ? 0.01 : i + 0.78
          /* gate lights, packet state badge swaps, description wakes */
          tl.to(lits[i], { opacity: 1, duration: 0.15 }, arrive)
          tl.to(descs[i], { opacity: 1, duration: 0.25 }, arrive)
          if (i > 0) tl.to(badges[i - 1], { opacity: 0, duration: 0.12 }, arrive)
          tl.to(badges[i], { opacity: 1, duration: i === 0 ? 0.001 : 0.12 }, i === 0 ? 0 : arrive + 0.12)
          /* small hop on arrival */
          if (i > 0) {
            tl.to(packet, { y: -8, duration: 0.1, ease: 'power1.out' }, i + 0.82)
            tl.to(packet, { y: 0, duration: 0.12, ease: 'power1.in' }, i + 0.92)
          }
        })

        /* settle beat before unpin */
        tl.to({}, { duration: 0.4 })

        return () => tl.kill()
      })

      return () => mm.revert()
    },
    { scope: rootRef },
  )

  return (
    <section
      ref={rootRef}
      className="relative hidden overflow-hidden border-y border-hairline bg-paper-warm md:block"
    >
      {/* accessible summary; the animated visuals are decorative duplication */}
      <p className="sr-only">
        {c.title} {c.stages.map((s) => `${s.en}: ${s.desc}`).join(' ')}
      </p>

      <div aria-hidden="true" className="mx-auto flex min-h-screen max-w-shell flex-col justify-center px-10 py-16">
        <Kicker>{c.kicker}</Kicker>
        <h2 className="mt-4 font-display text-h2 font-semibold text-ink">{c.title}</h2>

        {/* rail + traveling packet */}
        <div ref={trackRef} className="relative mt-44">
          <span className="absolute inset-x-0 top-1/2 h-px bg-hairline" />
          <span
            ref={progRef}
            className="absolute inset-x-0 top-1/2 h-px origin-left bg-cobalt"
          />

          {/* the packet */}
          <div
            ref={packetRef}
            className="absolute bottom-full left-0 z-10 mb-7 w-60 rounded-xl border border-clay/60 bg-paper p-3.5 opacity-0 shadow-card"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-clay">
              {c.packetLabel}
            </p>
            <p className="mt-1.5 text-[13px] leading-snug text-ink">{c.packet}</p>
            <div className="relative mt-2.5 h-5">
              {c.stages.map((s) => (
                <span
                  key={s.en}
                  data-badge
                  className="absolute inset-0 flex items-center font-mono text-[11px] tracking-[0.06em] text-clay"
                >
                  ▸ {s.state}
                </span>
              ))}
            </div>
            {/* pointer nub toward the rail */}
            <span className="absolute -bottom-[5px] left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-clay/60 bg-paper" />
          </div>

          {/* gates */}
          <div className="relative grid grid-cols-4">
            {c.stages.map((s, i) => (
              <div key={s.en} className="relative flex h-10 items-center justify-center">
                <span
                  data-station
                  className="relative z-10 grid h-4 w-4 place-items-center rounded-full border border-ink-3/50 bg-paper"
                >
                  <span data-lit className="h-1.5 w-1.5 bg-cobalt opacity-0" />
                </span>
                <span className="absolute left-1/2 top-full mt-1.5 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                  0{i + 1}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* gate descriptions */}
        <div className="mt-16 grid grid-cols-4 gap-8">
          {c.stages.map((s) => (
            <div key={s.en} data-desc className="border-t border-hairline pt-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-cobalt">{s.en}</p>
              <h3 className="mt-1 font-display text-lg font-semibold text-ink">{s.zh}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-3">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ————— tap-based fallback: mobile, or reduced-motion at any width ————— */

function TapJourney() {
  const { lang } = useLang()
  const c = doItContent[lang].pipeline
  const reduced = useReducedMotion() ?? false
  const [idx, setIdx] = useState(0)
  const stage = c.stages[idx]
  const dur = reduced ? 0 : 0.3
  const panelId = `pipeline-panel-${stage.en}`

  return (
    <section className="border-y border-hairline bg-paper-warm">
      <div className="mx-auto max-w-shell px-5 py-[clamp(72px,12vh,128px)] md:px-10">
        <Kicker>{c.kicker}</Kicker>
        <h2 className="mt-4 font-display text-h2 font-semibold text-ink">{c.title}</h2>

        {/* packet card */}
        <div className="mt-10 max-w-md rounded-xl border border-clay/60 bg-paper p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-clay">
            {c.packetLabel}
          </p>
          <p className="mt-1.5 text-sm leading-snug text-ink">{c.packet}</p>
          <div className="mt-2.5 h-5 overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={`${lang}-${idx}`}
                className="block font-mono text-[11px] tracking-[0.06em] text-clay"
                initial={{ opacity: 0, y: reduced ? 0 : 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduced ? 0 : -8 }}
                transition={{ duration: dur, ease: ZEN }}
              >
                ▸ {stage.state}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        {/* gate tabs */}
        <div className="mt-8 grid grid-cols-4 gap-2" role="tablist" aria-label={c.title}>
          {c.stages.map((s, i) => {
            const active = i === idx
            const tabId = `pipeline-tab-${s.en}`
            return (
              <button
                key={s.en}
                type="button"
                id={tabId}
                role="tab"
                aria-selected={active}
                aria-controls={`pipeline-panel-${s.en}`}
                onClick={() => setIdx(i)}
                className={cn(
                  'border px-2 py-2.5 text-center font-mono text-[11px] uppercase tracking-[0.08em] transition-colors duration-300',
                  active
                    ? 'border-cobalt bg-cobalt text-paper'
                    : 'border-hairline bg-paper text-ink-3 hover:border-cobalt hover:text-cobalt',
                )}
              >
                {s.en}
              </button>
            )
          })}
        </div>

        {/* stage detail */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`panel-${lang}-${idx}`}
            role="tabpanel"
            id={panelId}
            aria-labelledby={`pipeline-tab-${stage.en}`}
            className="mt-6 border-t border-hairline pt-5"
            initial={{ opacity: 0, y: reduced ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduced ? 0 : -10 }}
            transition={{ duration: dur, ease: ZEN }}
          >
            <h3 className="font-display text-lg font-semibold text-ink">
              {stage.zh}
              <span className="ml-2 font-mono text-[11px] uppercase tracking-[0.12em] text-cobalt">
                {stage.en}
              </span>
            </h3>
            <p className="mt-2 max-w-reading text-sm leading-relaxed text-ink-3">{stage.desc}</p>
          </motion.div>
        </AnimatePresence>

        <p className="mt-6 font-mono text-[11px] text-ink-3">{c.tapHint}</p>
      </div>
    </section>
  )
}
