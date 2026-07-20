import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Pause, Play } from 'lucide-react'
import { useLang } from '@/context/LangContext'
import { alayaContent } from '@/content/alaya'
import { cn } from '@/lib/utils'

const ZEN = [0.22, 1, 0.36, 1] as [number, number, number, number]
const SIZE = 560
const CENTER = SIZE / 2
const RADIUS = 228
const NODE = 92

const baseAngle = (i: number) => i * 60 - 90
const nodePos = (i: number) => {
  const rad = (baseAngle(i) * Math.PI) / 180
  return { x: CENTER + RADIUS * Math.cos(rad), y: CENTER + RADIUS * Math.sin(rad) }
}

/**
 * S4.1 · Six-stage lifecycle ring (desktop) / vertical stepper (mobile).
 * Click a node, or let the ink-dot signal flow (auto-play, 2.6s/stage);
 * the central gate opens once per hop.
 */
export default function LifecycleRing() {
  const { lang } = useLang()
  const a = alayaContent[lang].lifecycle
  const stages = a.stages

  const [active, setActive] = useState(0)
  const [auto, setAuto] = useState(
    () =>
      typeof window !== 'undefined' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [angle, setAngle] = useState(baseAngle(0))
  const [gateTick, setGateTick] = useState(0)

  const goTo = (i: number) => {
    setActive(i)
    setGateTick((t) => t + 1)
    /* nearest equivalent angle → shortest clockwise-friendly path */
    setAngle((cur) => {
      const base = baseAngle(i)
      return base + 360 * Math.round((cur - base) / 360)
    })
  }

  /* auto-flow: 2.6s per stage, re-armed after every change */
  useEffect(() => {
    if (!auto) return undefined
    const id = window.setInterval(() => goTo((active + 1) % stages.length), 2600)
    return () => window.clearInterval(id)
  }, [auto, active, stages.length])

  const stage = stages[active]

  const detail = (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${active}-${lang}`}
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -12, opacity: 0 }}
        transition={{ duration: 0.35, ease: ZEN }}
        className="rounded-[16px] border border-hairline bg-museum-bg-deep/50 p-6"
        role="status"
      >
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-faint">
          {a.stageLabel} 0{active + 1} / 0{stages.length}
        </p>
        <h3 className="mt-2 font-serif text-h3 font-semibold text-ink">
          {stage.name}{' '}
          <span className="font-mono text-sm font-normal normal-case tracking-[0.08em] text-faint">
            {stage.en}
          </span>
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-3">{stage.line}</p>
        <p className="mt-3 font-mono text-xs text-seal/75">
          {a.preventPrefix} {stage.prevent}
        </p>
      </motion.div>
    </AnimatePresence>
  )

  const autoToggle = (
    <button
      type="button"
      onClick={() => setAuto((v) => !v)}
      aria-pressed={auto}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-xs uppercase tracking-[0.12em] transition-colors duration-300',
              auto ? 'border-moss/70 bg-[color-mix(in_srgb,var(--moss)_6%,var(--museum-stone))] text-ink' : 'border-hairline text-ink-3 hover:border-moss',
      )}
    >
      {auto ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      {a.auto}
    </button>
  )

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="font-mono text-xs text-faint">
          01 {stages[0].name} → 06 {stages[5].name}
        </p>
        {autoToggle}
      </div>

      {/* —— desktop ring —— */}
      <div className="relative mx-auto mt-6 hidden md:block" style={{ width: SIZE, maxWidth: '100%' }}>
        <div className="relative" style={{ width: SIZE, height: SIZE }}>
          {/* connecting circle, drawn 1.2s on entry */}
          <svg
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            {/* quiet brass guide ring — museum accent behind the stage path */}
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS + 18}
              fill="none"
              stroke="var(--museum-brass)"
              strokeWidth={0.75}
              opacity={0.28}
            />
            {stages.map((_, i) => {
              const rad = (baseAngle(i) * Math.PI) / 180
              return (
                <circle
                  key={`orbit-${i}`}
                  cx={CENTER + (RADIUS + 18) * Math.cos(rad)}
                  cy={CENTER + (RADIUS + 18) * Math.sin(rad)}
                  r={1.5}
                  fill="var(--moss)"
                  opacity={0.4}
                />
              )
            })}
            <motion.circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke="var(--hairline)"
              strokeWidth={1}
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 1.2, ease: ZEN }}
            />
          </svg>

          {/* traveling ink-dot signal (0.8s / segment) */}
          <motion.div
            aria-hidden="true"
            className="absolute"
            style={{ left: CENTER, top: CENTER }}
            animate={{ rotate: angle }}
            transition={{ duration: 0.8, ease: ZEN }}
          >
            <span
              className="absolute block rounded-full bg-ink"
              style={{ width: 10, height: 10, left: RADIUS - 5, top: -5 }}
            />
          </motion.div>

          {/* central gate — grows from a hairline, leaves breathe per hop */}
          <motion.div
            aria-hidden="true"
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease: ZEN }}
            className="absolute overflow-hidden rounded-[4px] border-2 border-ink-3/50 bg-museum-bg"
            style={{ left: CENTER - 36, top: CENTER - 48, width: 72, height: 96 }}
          >
            <motion.span
              key={`gl-${gateTick}`}
              className="absolute inset-y-0 left-0 w-1/2 border-r border-hairline bg-museum-bg-deep"
              initial={{ x: 0 }}
              animate={{ x: [0, -15, 0] }}
              transition={{ duration: 0.6, times: [0, 0.45, 1], ease: 'easeInOut' }}
            />
            <motion.span
              key={`gr-${gateTick}`}
              className="absolute inset-y-0 right-0 w-1/2 border-l border-hairline bg-museum-bg-deep"
              initial={{ x: 0 }}
              animate={{ x: [0, 15, 0] }}
              transition={{ duration: 0.6, times: [0, 0.45, 1], ease: 'easeInOut' }}
            />
          </motion.div>

          {/* stage nodes */}
          {stages.map((s, i) => {
            const pos = nodePos(i)
            const isActive = i === active
            return (
              <motion.div
                key={s.en}
                className="absolute"
                style={{ left: pos.x - NODE / 2, top: pos.y - NODE / 2, width: NODE, height: NODE }}
                initial={{ x: CENTER - pos.x, y: CENTER - pos.y, opacity: 0 }}
                whileInView={{ x: 0, y: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.7, ease: ZEN, delay: i * 0.08 }}
              >
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-pressed={isActive}
                  aria-label={`${a.stageLabel} ${i + 1}: ${s.name} ${s.en}`}
                  className={cn(
                    'relative flex h-full w-full flex-col items-center justify-center rounded-full border bg-museum-bg transition-colors duration-300',
                    isActive ? 'border-transparent' : 'border-hairline hover:border-moss/60',
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="lc-active"
                      transition={{ duration: 0.5, ease: ZEN }}
                      className="absolute inset-0 rounded-full border-2 border-moss/70 bg-[color-mix(in_srgb,var(--moss)_6%,var(--museum-stone))]"
                    />
                  )}
                  <span className="relative font-mono text-[10px] text-faint">0{i + 1}</span>
                  <span
                    className={cn(
                      'relative text-sm font-medium transition-colors duration-300',
                      isActive ? 'text-ink' : 'text-ink-2',
                    )}
                  >
                    {s.name}
                  </span>
                  <span className="relative font-mono text-[9px] uppercase tracking-[0.08em] text-faint">
                    {s.en}
                  </span>
                </button>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* —— mobile vertical stepper —— */}
      <div className="relative mt-8 md:hidden">
        <span aria-hidden="true" className="absolute bottom-4 left-[17px] top-4 w-px bg-hairline" />
        <ol className="relative flex flex-col">
          {stages.map((s, i) => {
            const isActive = i === active
            return (
              <li key={s.en}>
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-pressed={isActive}
                  className="flex w-full items-center gap-4 py-2.5 text-left"
                >
                  <span
                    className={cn(
                      'relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-museum-bg font-mono text-[10px] transition-colors duration-300',
                      isActive ? 'border-transparent text-ink' : 'border-hairline text-faint',
                    )}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="lc-active-mobile"
                        transition={{ duration: 0.5, ease: ZEN }}
                        className="absolute inset-0 rounded-full border-2 border-moss/70 bg-[color-mix(in_srgb,var(--moss)_6%,var(--museum-stone))]"
                      />
                    )}
                    <span className="relative">0{i + 1}</span>
                  </span>
                  <span
                    className={cn(
                      'text-sm font-medium transition-colors duration-300',
                      isActive ? 'text-ink' : 'text-ink-3',
                    )}
                  >
                    {s.name}
                    <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
                      {s.en}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </div>

      {/* detail card */}
      <div className="mx-auto mt-8 min-h-[190px] max-w-lg md:mt-10">{detail}</div>
    </div>
  )
}
