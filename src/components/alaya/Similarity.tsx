import { useEffect, useRef, useState } from 'react'
import { ZEN } from '@/lib/motion'
import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'framer-motion'
import { MoveHorizontal } from 'lucide-react'
import { useLang } from '@/context/LangContext'
import { alayaContent } from '@/content/alaya'
import { useIsMobile } from '@/hooks/use-mobile'
import InkReveal from '@/components/InkReveal'
import Kicker from '@/components/Kicker'
import { cn } from '@/lib/utils'

type Frag = {
  tag: string
  diff: string
  evidenceLabel: string
  evidence: string
  verdict: string
}

/**
 * One memory fragment, rendered identically in both layers so the wipe
 * swaps the decisive word in place. Side A is the fluent guess (plain);
 * side B is the evidenced truth (moss highlight).
 */
function Fragment({
  frag,
  side,
  claimLead,
  claimTail,
}: {
  frag: Frag
  side: 'a' | 'b'
  claimLead: string
  claimTail: string
}) {
  const truth = side === 'b'
  return (
    <div
      className={cn(
        'flex h-full flex-col justify-between p-6 md:p-10',
        truth
          ? 'bg-[color-mix(in_srgb,var(--moss)_6%,var(--museum-bg))]'
          : 'bg-museum-bg-deep',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
          {frag.tag}
        </p>
        <span
          className={cn(
            'border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em]',
            truth ? 'border-moss/70 text-moss' : 'border-ink-3/40 text-ink-3',
          )}
        >
          {frag.verdict}
        </span>
      </div>

      <p className="py-8 text-center font-display text-[22px] font-semibold leading-snug text-ink md:text-[30px]">
        {claimLead}
        <span
          className={cn(
            'px-0.5',
            truth
              ? 'bg-[color-mix(in_srgb,var(--moss)_22%,transparent)] text-ink'
              : 'text-ink-3 underline decoration-dotted decoration-ink-3/60 underline-offset-4',
          )}
        >
          {frag.diff}
        </span>
        {claimTail}
      </p>

      <p className="font-mono text-[11px] leading-relaxed text-ink-3 md:text-xs">
        <span className={cn('uppercase tracking-[0.12em]', truth ? 'text-moss' : 'text-faint')}>
          {frag.evidenceLabel}
        </span>
        {' · '}
        {frag.evidence}
      </p>
    </div>
  )
}

/**
 * S2.5 · Similarity is not truth — the signature piece. Two memory fragments
 * read almost the same; a cobalt divider (pointer-driven clip-path wipe on a
 * motion value, keyboard accessible) reveals the one word and the one
 * provenance line that decide which memory may live. One gentle auto-sweep
 * on first view; any interaction takes over permanently.
 * Mobile (<768px) falls back to a deliberate tap toggle.
 */
export default function Similarity() {
  const { lang } = useLang()
  const s = alayaContent[lang].similar
  const isMobile = useIsMobile()
  const reduced = useReducedMotion() ?? false

  const paneRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const interacted = useRef(false)
  const p = useMotionValue(reduced ? 0.5 : 0.92)
  const inView = useInView(paneRef, { once: true, amount: 0.4 })

  /* aria value: re-render only at 10% steps, never per frame */
  const [ariaNow, setAriaNow] = useState(() => Math.round(p.get() * 10) * 10)
  useEffect(() => {
    return p.on('change', (v) =>
      setAriaNow((prev) => {
        const next = Math.round(v * 10) * 10
        return next === prev ? prev : next
      }),
    )
  }, [p])

  const rightPct = useTransform(p, (v) => `${(1 - v) * 100}%`)
  const clip = useMotionTemplate`inset(0 ${rightPct} 0 0)`
  const leftPct = useTransform(p, (v) => `${v * 100}%`)

  /* one-time attract sweep: mostly A → mostly B, resting clear of the claim */
  useEffect(() => {
    if (!inView || reduced || interacted.current) return undefined
    const controls = animate(p, [0.92, 0.24, 0.32], {
      duration: 2.4,
      ease: ZEN,
      times: [0, 0.7, 1],
      delay: 0.5,
    })
    return () => controls.stop()
  }, [inView, reduced, p])

  const clamp = (v: number) => Math.min(0.96, Math.max(0.04, v))

  const setFromClientX = (clientX: number, direct: boolean) => {
    const el = paneRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const v = clamp((clientX - r.left) / r.width)
    if (direct || reduced) p.set(v)
    else animate(p, v, { duration: 0.3, ease: ZEN })
  }

  const nudge = (delta: number) => {
    interacted.current = true
    const v = clamp(p.get() + delta)
    if (reduced) p.set(v)
    else animate(p, v, { duration: 0.3, ease: ZEN })
  }

  /* —— mobile fallback: tap to switch fragments —— */
  const [tab, setTab] = useState<'a' | 'b'>('a')

  return (
    <section className="mx-auto max-w-demo px-5 py-24 md:px-10 md:py-32" aria-label={s.title}>
      <InkReveal amount={0.5}>
        <Kicker>{s.kicker}</Kicker>
      </InkReveal>
      <InkReveal amount={0.4} delay={0.08}>
        <h2 className="mt-6 font-display text-h2 font-semibold text-ink">{s.title}</h2>
        <p className="mt-3 max-w-reading text-ink-3">{isMobile ? s.mobileHint : s.sub}</p>
      </InkReveal>

      <InkReveal amount={0.25} className="mt-12">
        {isMobile ? (
          <div>
            <div
              className="grid grid-cols-2 border border-hairline"
              role="tablist"
              aria-label={s.title}
            >
              {(['a', 'b'] as const).map((side) => {
                const tabId = `similarity-tab-${side}`
                return (
                  <button
                    key={side}
                    type="button"
                    id={tabId}
                    role="tab"
                    aria-selected={tab === side}
                    aria-controls="similarity-panel"
                    onClick={() => setTab(side)}
                    className={cn(
                      'px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors duration-300',
                      tab === side
                        ? side === 'b'
                          ? 'bg-[color-mix(in_srgb,var(--moss)_10%,var(--museum-bg))] text-ink'
                          : 'bg-museum-bg-deep text-ink'
                        : 'text-faint',
                    )}
                  >
                    {side === 'a' ? s.fragA.tag : s.fragB.tag}
                  </button>
                )
              })}
            </div>
            <div
              id="similarity-panel"
              role="tabpanel"
              aria-labelledby={`similarity-tab-${tab}`}
              className="h-[300px] border border-t-0 border-hairline"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`${tab}-${lang}`}
                  initial={{ opacity: 0, y: reduced ? 0 : 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: reduced ? 0 : -10 }}
                  transition={{ duration: reduced ? 0 : 0.25, ease: ZEN }}
                  className="h-full"
                >
                  <Fragment
                    frag={tab === 'a' ? s.fragA : s.fragB}
                    side={tab}
                    claimLead={s.claimLead}
                    claimTail={s.claimTail}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div>
            <div
              ref={paneRef}
              className="relative h-[320px] touch-none select-none overflow-hidden border border-hairline"
              onPointerDown={(e) => {
                interacted.current = true
                dragging.current = true
                e.currentTarget.setPointerCapture(e.pointerId)
                setFromClientX(e.clientX, true)
              }}
              onPointerMove={(e) => {
                if (dragging.current) setFromClientX(e.clientX, true)
              }}
              onPointerUp={() => {
                dragging.current = false
              }}
              onPointerCancel={() => {
                dragging.current = false
              }}
            >
              {/* base layer: the evidenced truth */}
              <div className="absolute inset-0">
                <Fragment frag={s.fragB} side="b" claimLead={s.claimLead} claimTail={s.claimTail} />
              </div>
              {/* overlay layer: the fluent guess, clipped by the divider */}
              <motion.div className="absolute inset-0" style={{ clipPath: clip }}>
                <Fragment frag={s.fragA} side="a" claimLead={s.claimLead} claimTail={s.claimTail} />
              </motion.div>

              {/* cobalt divider */}
              <motion.div
                aria-hidden="true"
                className="absolute inset-y-0 w-px bg-cobalt"
                style={{ left: leftPct }}
              />
              <motion.button
                type="button"
                role="slider"
                aria-label={s.sliderAria}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={ariaNow}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowLeft') nudge(-0.05)
                  else if (e.key === 'ArrowRight') nudge(0.05)
                  else if (e.key === 'Home') nudge(-1)
                  else if (e.key === 'End') nudge(1)
                }}
                onPointerDown={(e) => {
                  /* let the pane handler drive; just mark interaction + focus */
                  interacted.current = true
                  e.currentTarget.focus()
                }}
                className="absolute top-1/2 z-10 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center bg-cobalt text-white transition-colors duration-300 hover:bg-cobalt-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
                style={{ left: leftPct }}
              >
                <MoveHorizontal className="h-4 w-4" aria-hidden="true" />
              </motion.button>
            </div>
            <p className="mt-4 font-mono text-xs text-faint">{s.hint}</p>
          </div>
        )}
      </InkReveal>

      <InkReveal amount={0.5} className="mt-10">
        <div className="relative overflow-hidden border border-hairline bg-museum-bg-deep/60 px-5 py-4">
          <motion.span
            aria-hidden="true"
            initial={reduced ? false : { scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: reduced ? 0 : 0.5, ease: ZEN }}
            className="absolute inset-y-0 left-0 w-1 origin-top bg-moss"
          />
          <p className="pl-2 font-mono text-xs leading-relaxed text-ink-2 md:text-sm">
            {s.takeaway}
          </p>
        </div>
      </InkReveal>
    </section>
  )
}
