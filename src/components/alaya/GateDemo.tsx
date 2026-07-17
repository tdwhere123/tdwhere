import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { Check, Pause, Play } from 'lucide-react'
import { useLang } from '@/context/LangContext'
import { alayaContent } from '@/content/alaya'
import Stamp from '@/components/Stamp'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

const ZEN = [0.22, 1, 0.36, 1] as [number, number, number, number]

type Phase = 'waiting' | 'admitted' | 'landed' | 'rejected' | 'leaving'
type Verdict = 'admit' | 'reject'

/**
 * S4.2 · The Gate Demo — candidate memories ride the conveyor; the visitor
 * is the gate (or AUTO runs the script A→B→C). Admit → through the gate,
 * shrink into the pool (EventLog → DB → notify) + WRITTEN stamp in moss;
 * Reject → bounced back + REJECTED stamp in seal + reason line.
 */
export default function GateDemo() {
  const { lang } = useLang()
  const g = alayaContent[lang].gate
  const isMobile = useIsMobile()

  const [round, setRound] = useState(0)
  const [phase, setPhase] = useState<Phase>('waiting')
  const [auto, setAuto] = useState(
    () =>
      typeof window !== 'undefined' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [manual, setManual] = useState(false)
  const [stats, setStats] = useState({ proposed: 0, written: 0, rejected: 0 })
  const [pool, setPool] = useState<string[]>([])
  const [lastVerdict, setLastVerdict] = useState<Verdict | null>(null)
  const [liveMsg, setLiveMsg] = useState('')

  const card = g.cards[round % g.cards.length]
  const gateOpen = phase === 'admitted' || phase === 'landed'

  const nextRound = useCallback(() => {
    setRound((r) => r + 1)
    setLastVerdict(null)
    setPhase('waiting')
  }, [])

  const judge = useCallback(
    (v: Verdict, byUser: boolean) => {
      if (byUser && auto) {
        setAuto(false)
        setManual(true)
      }
      setLastVerdict(v)
      setStats((s) => ({
        ...s,
        written: s.written + (v === 'admit' ? 1 : 0),
        rejected: s.rejected + (v === 'reject' ? 1 : 0),
      }))
      setLiveMsg(v === 'admit' ? g.liveAdmit : g.liveReject)
      setPhase(v === 'admit' ? 'admitted' : 'rejected')
    },
    [auto, g.liveAdmit, g.liveReject],
  )

  /* AUTO script: 3s per card, cycles A→B→C */
  useEffect(() => {
    if (!auto || phase !== 'waiting') return undefined
    const id = window.setTimeout(() => judge(card.verdict, false), 3000)
    return () => window.clearTimeout(id)
  }, [auto, phase, round, card.verdict, judge])

  /* rejected card: hold (stamp + reason), then slide out */
  useEffect(() => {
    if (phase !== 'rejected') return undefined
    const id = window.setTimeout(() => setPhase('leaving'), 1900)
    return () => window.clearTimeout(id)
  }, [phase])

  /* landed card: brief pause, then next candidate */
  useEffect(() => {
    if (phase !== 'landed') return undefined
    const id = window.setTimeout(nextRound, 900)
    return () => window.clearTimeout(id)
  }, [phase, nextRound])

  const handleComplete = (def: string) => {
    if (def === 'waiting') setStats((s) => ({ ...s, proposed: s.proposed + 1 }))
    else if (def === 'admitted') {
      setPool((p) => [...p.slice(-4), card.key])
      setPhase('landed')
    } else if (def === 'leaving') nextRound()
  }

  const variants: Variants = {
    incoming: { x: 360, y: '-50%', scale: 1, opacity: 0 },
    waiting: {
      x: 0,
      y: '-50%',
      scale: 1,
      opacity: 1,
      transition: { duration: 0.5, ease: ZEN },
    },
    admitted: isMobile
      ? { x: 0, y: '170%', scale: 0.6, opacity: 0, transition: { duration: 0.8, ease: ZEN, delay: 0.25 } }
      : { x: '-120%', y: '-50%', scale: 0.6, opacity: 0, transition: { duration: 0.8, ease: ZEN, delay: 0.25 } },
    landed: isMobile
      ? { x: 0, y: '170%', scale: 0.6, opacity: 0 }
      : { x: '-120%', y: '-50%', scale: 0.6, opacity: 0 },
    rejected: {
      x: 0,
      y: ['-50%', '-58%', '-49%', '-50%'],
      scale: 1,
      opacity: 1,
      transition: { duration: 0.6, times: [0, 0.35, 0.7, 1], ease: 'easeInOut' },
    },
    leaving: { x: 400, y: '-50%', scale: 1, opacity: 0, transition: { duration: 0.35, ease: 'easeIn' } },
  }

  const showRejectMark = lastVerdict === 'reject' && (phase === 'rejected' || phase === 'leaving')

  return (
    <div className="mt-14">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-serif text-h3 font-semibold text-ink">{g.title}</h3>
          <p className="mt-1 text-sm text-ink-3">{g.sub}</p>
        </div>
        <div className="flex items-center gap-3">
          {manual && !auto && (
            <span className="font-mono text-xs uppercase tracking-[0.12em] text-seal/75">
              {g.manualNotice}
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setAuto((v) => !v)
              setManual(false)
            }}
            aria-pressed={auto}
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-xs uppercase tracking-[0.12em] transition-colors duration-300',
              auto ? 'border-moss/80 bg-moss/[0.08] text-ink' : 'border-hairline text-ink-3 hover:border-moss',
            )}
          >
            {auto ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {g.auto}
          </button>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-[16px] border border-hairline bg-museum-stone/40 p-4 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          {/* memory pool */}
          <div className="order-3 w-full shrink-0 rounded-[10px] border border-hairline bg-paper p-4 md:order-1 md:w-[210px]">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">{g.pool}</p>
            <div className="relative mt-3 h-[92px]">
              {pool.length === 0 && (
                <span className="absolute inset-0 rounded-[6px] border border-dashed border-hairline" />
              )}
              {pool.map((key, i) => {
                const pooled = g.cards.find((c) => c.key === key)
                const isTop = i === pool.length - 1
                return (
                  <motion.div
                    key={`${key}-${i}`}
                    initial={{ y: -22, opacity: 0, scale: 0.85 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, ease: ZEN }}
                    className="absolute rounded-[6px] border border-hairline bg-paper-deep px-2 py-1.5"
                    style={{ top: i * 2, left: i * 2, right: 0 }}
                  >
                    <p className="line-clamp-2 text-[10px] leading-snug text-ink-3">
                      {pooled?.claim}
                    </p>
                    {isTop && (
                      <span className="absolute -right-2 -top-4 scale-75">
                        <Stamp
                          text={g.written}
                          animateOnView={false}
                          className="border-moss/80 bg-moss/[0.08] text-moss"
                        />
                      </span>
                    )}
                  </motion.div>
                )
              })}
            </div>
            {/* Durability: EventLog → DB → notify */}
            <div key={pool.length} className="mt-3 space-y-1 border-t border-hairline pt-3">
              {g.durability.map((step, i) => (
                <motion.p
                  key={step}
                  initial={{ opacity: 0.25 }}
                  animate={{ opacity: pool.length > 0 ? 1 : 0.25 }}
                  transition={{ delay: pool.length > 0 ? 0.1 + i * 0.25 : 0, duration: 0.3 }}
                  className="flex items-center gap-1.5 font-mono text-[10px] text-ink-3"
                >
                  <Check className="h-3 w-3 text-moss" />
                  {step}
                </motion.p>
              ))}
            </div>
          </div>

          {/* the gate */}
          <div className="order-2 flex items-center justify-center">
            <div
              aria-hidden="true"
              className="relative h-24 w-12 overflow-hidden rounded-[4px] border-2 border-ink-3/50 bg-paper md:h-28"
            >
              <motion.span
                className="absolute inset-y-0 left-0 w-1/2 border-r border-hairline bg-paper-deep"
                animate={{ x: gateOpen ? -13 : 0 }}
                transition={{ duration: 0.3, ease: ZEN }}
              />
              <motion.span
                className="absolute inset-y-0 right-0 w-1/2 border-l border-hairline bg-paper-deep"
                animate={{ x: gateOpen ? 13 : 0 }}
                transition={{ duration: 0.3, ease: ZEN }}
              />
            </div>
          </div>

          {/* conveyor lane */}
          <div className="relative order-1 h-[240px] flex-1 md:order-3 md:h-[260px]">
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-1/2 h-px bg-hairline"
            />
            <span
              aria-hidden="true"
              className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border border-hairline bg-paper"
            />
            <AnimatePresence mode="wait">
              <motion.div
                key={`${round}-${lang}`}
                initial="incoming"
                animate={phase}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                variants={variants}
                onAnimationComplete={handleComplete}
                className="absolute left-0 top-1/2 w-[min(280px,88%)]"
              >
                <div className="relative rounded-[10px] border border-hairline bg-paper p-4 shadow-card">
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
                    #{card.key}
                  </p>
                  <p className="mt-1.5 text-sm font-medium leading-snug text-ink">{card.claim}</p>
                  <p className="mt-2 font-mono text-[11px] leading-snug text-faint">{card.arg}</p>

                  {phase === 'waiting' && (
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => judge('admit', true)}
                        className="rounded-full border border-moss/80 px-4 py-1.5 font-mono text-xs text-ink transition-colors duration-300 hover:bg-moss/[0.08]"
                      >
                        {g.admit}
                      </button>
                      <button
                        type="button"
                        onClick={() => judge('reject', true)}
                        className="rounded-full border border-hairline px-4 py-1.5 font-mono text-xs text-ink-3 transition-colors duration-300 hover:border-seal/70 hover:text-seal/80"
                      >
                        {g.reject}
                      </button>
                    </div>
                  )}

                  {showRejectMark && (
                    <span className="absolute -right-3 -top-5">
                      <Stamp
                        text={g.rejected}
                        animateOnView={false}
                        className="border-seal/70 bg-seal/[0.06] text-seal/80"
                      />
                    </span>
                  )}
                </div>
                {showRejectMark && card.reason && (
                  <motion.p
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: ZEN, delay: 0.2 }}
                    className="mt-3 text-center font-mono text-[11px] leading-snug text-seal/80"
                  >
                    {card.reason}
                  </motion.p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* stats bar */}
        <p
          aria-live="polite"
          className="mt-6 border-t border-hairline pt-4 font-mono text-xs text-ink-3"
        >
          {g.statsProposed}: {stats.proposed} · {g.statsWritten}: {stats.written} ·{' '}
          {g.statsRejected}: {stats.rejected}
        </p>
        <p className="sr-only" role="status" aria-live="polite">
          {liveMsg}
        </p>
      </div>

      {/* core sentence */}
      <div className="mt-10 text-center">
        <p className="font-serif text-[22px] italic text-ink-2">
          {lang === 'zh' ? g.coreZh : g.core}
        </p>
        <p className="mt-2 font-mono text-xs text-faint">{lang === 'zh' ? g.core : g.coreZh}</p>
      </div>
    </div>
  )
}
