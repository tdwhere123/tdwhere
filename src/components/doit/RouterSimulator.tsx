import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import { useLang } from '@/context/LangContext'
import { doItContent } from '@/content/doIt'
import Kicker from '@/components/Kicker'
import Stamp from '@/components/Stamp'
import { ALL_AGENTS, classifyTask } from '@/components/doit/routerLogic'
import type { RiskLevel, RouteResult } from '@/components/doit/routerLogic'
import { cn } from '@/lib/utils'

const ZEN = [0.22, 1, 0.36, 1] as [number, number, number, number]

type Phase = 'idle' | 'route' | 'delegate' | 'prove' | 'done'
const ORDER: Phase[] = ['idle', 'route', 'delegate', 'prove', 'done']
const at = (phase: Phase, p: Phase) => ORDER.indexOf(phase) >= ORDER.indexOf(p)

const POINTER_POS: Record<RiskLevel, string> = {
  LIGHT: '16.66%',
  STANDARD: '50%',
  HEAVY: '83.33%',
}

/** hand-drawn style check / cross stroke inside the evidence checkbox */
function Mark({ failed, delay }: { failed: boolean; delay: number }) {
  if (failed) {
    return (
      <motion.svg viewBox="0 0 20 20" className="h-4 w-4 text-seal" aria-hidden="true">
        <motion.path
          d="M5 5 L15 15 M15 5 L5 15"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut', delay }}
        />
      </motion.svg>
    )
  }
  return (
    <motion.svg viewBox="0 0 20 20" className="h-4 w-4 text-tea" aria-hidden="true">
      <motion.path
        d="M3.5 10.5 C 6 12.5 7 14 8 15.5 C 10.5 11 13.5 6.5 17 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut', delay }}
      />
    </motion.svg>
  )
}

/** S3 · 【核心交互】路由器模拟器 — input → risk grade → buckets → Route/Delegate/Prove → stamp. */
export default function RouterSimulator() {
  const { lang } = useLang()
  const c = doItContent[lang].sim
  const reduced = useReducedMotion()

  const [input, setInput] = useState('')
  const [result, setResult] = useState<RouteResult | null>(null)
  const [failProve, setFailProve] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [runId, setRunId] = useState(0)

  const timers = useRef<number[]>([])
  const rootRef = useRef<HTMLDivElement>(null)
  const inView = useInView(rootRef, { once: true, amount: 0.3 })

  /* act timings (design: 0–1.2s route, 1.2–2.6s delegate, 2.6–4.5s prove) */
  const T = reduced
    ? { delegate: 350, prove: 700, done: 1100 }
    : { delegate: 1200, prove: 2600, done: 4100 }

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }

  const run = (text: string, fail: boolean) => {
    clearTimers()
    setInput(text)
    setResult(classifyTask(text.trim()))
    setFailProve(fail)
    setRunId((id) => id + 1)
    setPhase('route')
    timers.current = [
      window.setTimeout(() => setPhase('delegate'), T.delegate),
      window.setTimeout(() => setPhase('prove'), T.prove),
      window.setTimeout(() => setPhase('done'), T.done),
    ]
  }

  useEffect(() => clearTimers, [])

  /* first performance: auto-run once when the simulator scrolls into view */
  useEffect(() => {
    if (inView && phase === 'idle') run(c.examples[2].text, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView])

  const activeExample = c.examples.find((e) => e.text === input)

  return (
    <section id="router" className="mx-auto max-w-shell scroll-mt-20 px-5 py-[clamp(72px,12vh,128px)] md:px-10">
      <motion.div
        initial={{ y: 40, opacity: 0, filter: 'blur(8px)' }}
        whileInView={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.9, ease: ZEN }}
        className="mx-auto max-w-demo rounded-2xl border border-hairline bg-museum-stone p-[clamp(24px,4vw,56px)]"
      >
        <div ref={rootRef}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Kicker>{c.kicker}</Kicker>
              <h2 className="mt-4 font-serif text-h2 font-semibold text-ink">{c.title}</h2>
            </div>
            {phase !== 'idle' && (
              <button
                type="button"
                onClick={() => run(input, failProve)}
                className="inline-flex items-center gap-2 rounded-md border border-hairline bg-paper px-3.5 py-2 font-mono text-xs text-ink-3 transition-colors duration-300 hover:border-clay hover:text-clay"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                {c.replay}
              </button>
            )}
          </div>

          {/* ——— input ——— */}
          <form
            className="mt-8"
            onSubmit={(e) => {
              e.preventDefault()
              run(input, activeExample?.failProve ?? false)
            }}
          >
            <label htmlFor="router-input" className="sr-only">
              {c.inputLabel}
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="router-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={c.placeholder}
                autoComplete="off"
                className="min-w-0 flex-1 rounded-md border border-hairline bg-paper px-4 py-3.5 font-mono text-[15px] text-ink placeholder:text-faint focus:border-clay focus:outline-none focus:ring-[3px] focus:ring-clay/10"
              />
              <motion.button
                type="submit"
                whileTap={{ scale: 0.96 }}
                className="shrink-0 rounded-md bg-clay px-6 py-3.5 font-mono text-sm font-medium text-paper transition-colors duration-300 hover:bg-tea-deep"
              >
                {c.routeButton}
              </motion.button>
            </div>
          </form>

          {/* example chips — click fills & auto-runs */}
          <div className="mt-4 flex flex-wrap gap-2">
            {c.examples.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => run(ex.text, ex.failProve ?? false)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-left font-mono text-xs transition-colors duration-300',
                  input === ex.text
                    ? 'border-clay bg-clay/10 text-ink'
                    : 'border-hairline bg-paper text-ink-3 hover:border-clay hover:text-ink',
                )}
              >
                {ex.text}
              </button>
            ))}
          </div>

          {/* ——— result: three acts ——— */}
          <div className="relative mt-10" aria-live="off">
            {phase === 'idle' && <p className="font-mono text-xs text-faint">{c.idleHint}</p>}

            {result && at(phase, 'route') && (
              <div key={`acts-${runId}`}>
                {/* ——— act 1 · ROUTE ——— */}
                <div>
                  <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-clay">
                    {c.actRoute}
                  </p>

                  {/* risk gauge */}
                  <div className="relative mt-5 pt-7">
                    {/* pointer */}
                    <motion.div
                      aria-hidden="true"
                      className="absolute left-0 top-0 w-full"
                      initial={{ x: '0%' }}
                      animate={{ x: POINTER_POS[result.level] }}
                      transition={{ duration: reduced ? 0.2 : 0.6, ease: ZEN }}
                    >
                      <span className="absolute -translate-x-1/2 text-[10px] leading-none text-ink">
                        ▼
                      </span>
                    </motion.div>
                    <div className="flex overflow-hidden rounded-md border border-hairline">
                      {c.levels.map((lv) => {
                        const active = lv === result.level
                        return (
                          <motion.div
                            key={lv}
                            animate={
                              active ? { scale: 1.04 } : { scale: 1 }
                            }
                            transition={{ duration: 0.4, ease: ZEN, delay: reduced ? 0 : 0.45 }}
                            className={cn(
                              'flex-1 px-2 py-3 text-center font-mono text-xs tracking-[0.12em] transition-colors duration-500',
                              active ? 'bg-clay/15 font-medium text-clay' : 'bg-paper text-faint',
                            )}
                          >
                            {lv}
                            <span className="ml-1.5 hidden text-[10px] sm:inline">
                              {c.levelZh[lv]}
                            </span>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>

                  {/* signals */}
                  <motion.p
                    className="mt-4 font-mono text-xs text-ink-3"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: ZEN, delay: reduced ? 0 : 0.55 }}
                  >
                    {result.unclear
                      ? c.unclear
                      : `${c.signalsPrefix}${result.signals.join(' / ') || c.signalsNone} → ${result.level}`}
                  </motion.p>

                  {/* buckets */}
                  <div className="mt-4">
                    <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
                      {c.bucketsLabel}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {result.buckets.map((b, i) => (
                        <motion.span
                          key={b}
                          className="rounded-full border border-clay/50 bg-clay/5 px-3 py-1 font-mono text-xs text-ink-2"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.35,
                            ease: ZEN,
                            delay: (reduced ? 0.1 : 0.7) + i * 0.08,
                          }}
                        >
                          {b}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ——— act 2 · DELEGATE ——— */}
                <AnimatePresence>
                  {at(phase, 'delegate') && (
                    <motion.div
                      key={`delegate-${runId}`}
                      className="mt-10"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-clay">
                        {c.actDelegate}
                      </p>
                      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                        {ALL_AGENTS.map((agent, i) => {
                          const seated = result.agents.includes(agent)
                          return (
                            <motion.div
                              key={agent}
                              initial={{ opacity: 0, scale: 0.6, y: 24, rotate: -12 }}
                              animate={{
                                opacity: seated ? 1 : 0.45,
                                scale: 1,
                                y: 0,
                                rotate: 0,
                              }}
                              transition={{
                                duration: reduced ? 0.25 : 0.5,
                                ease: ZEN,
                                delay: reduced ? 0 : i * 0.05,
                              }}
                              className={cn(
                                'rounded-md border px-2.5 py-2 font-mono text-[11px] leading-tight',
                                seated
                                  ? 'border-clay bg-clay/10 text-ink'
                                  : 'border-hairline bg-paper text-ink-3',
                              )}
                            >
                              {agent}
                            </motion.div>
                          )
                        })}
                      </div>
                      <p className="mt-3 font-mono text-[11px] text-faint">{c.delegateNote}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ——— act 3 · PROVE ——— */}
                <AnimatePresence>
                  {at(phase, 'prove') && (
                    <motion.div
                      key={`prove-${runId}`}
                      className="mt-10"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4, ease: ZEN }}
                    >
                      <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-clay">
                        {c.actProve}
                      </p>
                      <ul className="mt-4 space-y-2.5">
                        {c.proveItems.map((item, i) => {
                          const failed = failProve && i === 1
                          return (
                            <motion.li
                              key={item}
                              className="flex items-center gap-3"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{
                                duration: 0.3,
                                ease: ZEN,
                                delay: reduced ? 0 : i * 0.4,
                              }}
                            >
                              <span
                                className={cn(
                                  'grid h-6 w-6 shrink-0 place-items-center rounded-[4px] border',
                                  failed ? 'border-seal bg-seal/5' : 'border-tea bg-paper',
                                )}
                              >
                                <Mark failed={failed} delay={(reduced ? 0 : i * 0.4) + 0.15} />
                              </span>
                              <span
                                className={cn(
                                  'text-sm',
                                  failed ? 'text-seal line-through decoration-seal/60' : 'text-ink-2',
                                )}
                              >
                                {item}
                              </span>
                            </motion.li>
                          )
                        })}
                      </ul>

                      {/* the stamp */}
                      {phase === 'done' && (
                        <div className="mt-8 flex flex-wrap items-center gap-6">
                          <motion.div
                            key={`shake-${runId}`}
                            animate={
                              !failProve && !reduced ? { x: [0, -4, 4, -2, 0] } : { x: 0 }
                            }
                            transition={{ duration: 0.35, delay: 0.2 }}
                          >
                            <Stamp
                              key={`stamp-${runId}`}
                              animateOnView={false}
                              text={failProve ? c.notVerified : c.verified}
                              className="border-[3px] px-5 py-3 text-sm"
                            />
                          </motion.div>
                          {failProve && (
                            <motion.p
                              className="max-w-xs font-serif text-sm text-ink-2"
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.5, ease: ZEN, delay: 0.35 }}
                            >
                              {c.notVerifiedNote}
                            </motion.p>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* ——— act 4 · LEARN (off by default, disabled) ——— */}
          <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-hairline pt-6">
            <button
              type="button"
              disabled
              aria-disabled="true"
              title={c.learnTip}
              className="relative h-5 w-10 shrink-0 cursor-not-allowed rounded-full bg-hairline/70 opacity-60"
            >
              <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-paper shadow-xs" />
            </button>
            <span className="font-mono text-xs text-faint">
              {c.learnLabel} · {c.learnState}
            </span>
            <span className="w-full font-mono text-[11px] leading-relaxed text-faint sm:w-auto sm:flex-1">
              {c.learnTip}
            </span>
          </div>

          {/* screen-reader run summary */}
          <div role="status" aria-live="polite" className="sr-only">
            {phase === 'done' && result
              ? `${c.summaryPrefix}: ${result.level} → ${result.buckets.join(', ')} → ${
                  failProve ? c.notVerified : c.verified
                }`
              : ''}
          </div>
        </div>
      </motion.div>
    </section>
  )
}
