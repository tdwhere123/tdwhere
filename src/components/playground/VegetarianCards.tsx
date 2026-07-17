import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Github, Sparkles } from 'lucide-react'
import { useLang } from '@/context/LangContext'
import { playground } from '@/content/playground'
import type { VeggieCard } from '@/content/playground'
import Kicker from '@/components/Kicker'
import InkReveal from '@/components/InkReveal'
import MetaChip from '@/components/MetaChip'
import Stamp from '@/components/Stamp'

const STORAGE_KEY = 'tdwhere-veggie-unlocked'
const FLIP_MS = 700

/** paper line-drawn veggie motif for the card back */
function VeggiePattern() {
  return (
    <svg aria-hidden="true" className="absolute inset-0 h-full w-full opacity-25">
      <defs>
        <pattern id="pg-veggie" width="56" height="56" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="var(--paper)" strokeWidth="1">
            <path d="M14 30c-5-8 1-16 8-14 7 2 8 12 1 15-3 1.2-7 1-9-1Z" />
            <path d="M20 16c1-4 4-6 7-7" />
            <circle cx="42" cy="40" r="6" />
            <path d="M42 34v-6m0 0c3 0 5-2 5-5" />
            <path d="M6 50c4-2 8-2 12 0" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#pg-veggie)" />
    </svg>
  )
}

function CardBack() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-[16px] border border-tea-deep bg-museum-brass shadow-card [backface-visibility:hidden]">
      <VeggiePattern />
      <div className="absolute inset-2 rounded-[12px] border border-paper/30" />
      <div className="absolute inset-0 grid place-items-center">
        <span className="grid h-16 w-16 place-items-center rounded-full border border-paper/50 font-serif text-3xl font-semibold text-paper">
          素
        </span>
      </div>
    </div>
  )
}

function CardFront({ card, index, label }: { card: VeggieCard; index: number; label: string }) {
  return (
    <div className="absolute inset-0 rounded-[16px] border border-hairline bg-paper p-2 shadow-card [backface-visibility:hidden] [transform:rotateY(180deg)]">
      <div className="flex h-full flex-col rounded-[10px] border border-hairline px-5 py-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
          No.{String(index + 1).padStart(2, '0')} · Vegetarian-card
        </p>
        <p className="mt-4 font-serif text-[26px] font-semibold leading-tight text-ink">
          {card.name}
        </p>
        <p className="mt-3 font-mono text-[11px] leading-relaxed text-museum-brass">
          {label}：{card.ingredients}
        </p>
        <p className="mt-auto text-[13px] leading-relaxed text-ink-3">{card.desc}</p>
        <span aria-hidden="true" className="mt-3 h-px w-full bg-hairline" />
        <p className="mt-2 font-mono text-[10px] tracking-[0.14em] text-faint">AI-GENERATED RECIPE</p>
      </div>
    </div>
  )
}

function readUnlocked(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

export default function VegetarianCards() {
  const { lang } = useLang()
  const t = playground[lang].veggie
  const cards = t.cards
  const total = cards.length

  const [unlocked, setUnlocked] = useState<string[]>(readUnlocked)
  const [current, setCurrent] = useState<{ card: VeggieCard; isNew: boolean } | null>(null)
  const [flipped, setFlipped] = useState(false)
  const [busy, setBusy] = useState(false)
  const [stampedId, setStampedId] = useState<string | null>(null)
  const timersRef = useRef<number[]>([])

  const reduced = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )

  useEffect(
    () => () => {
      timersRef.current.forEach((id) => window.clearTimeout(id))
    },
    [],
  )

  // persist unlocks
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(unlocked))
    } catch {
      /* storage unavailable */
    }
  }, [unlocked])

  const fullSet = unlocked.length >= total
  const [celebrate, setCelebrate] = useState(false)
  // adjust-during-render: fire the one-shot celebration exactly when the set completes
  const [prevFullSet, setPrevFullSet] = useState(fullSet)
  if (fullSet !== prevFullSet) {
    setPrevFullSet(fullSet)
    if (fullSet) setCelebrate(true)
  }

  const later = useCallback((ms: number) => {
    return new Promise<void>((resolve) => {
      const id = window.setTimeout(resolve, ms)
      timersRef.current.push(id)
    })
  }, [])

  const draw = useCallback(async () => {
    if (busy) return
    setBusy(true)
    setStampedId(null)
    if (flipped) {
      setFlipped(false)
      await later(reduced ? 250 : 420)
    }
    const pick = cards[Math.floor(Math.random() * cards.length)]
    const isNew = !unlocked.includes(pick.id)
    setCurrent({ card: pick, isNew })
    setFlipped(true)
    await later(reduced ? 250 : FLIP_MS + 120)
    if (isNew) {
      setUnlocked((prev) => (prev.includes(pick.id) ? prev : [...prev, pick.id]))
      setStampedId(pick.id)
    }
    setBusy(false)
  }, [busy, cards, flipped, later, reduced, unlocked])

  const hint = !current
    ? null
    : stampedId === current.card.id
      ? t.newDish
      : !current.isNew
        ? t.tasted
        : null

  return (
    <section aria-label={t.title} className="mx-auto max-w-shell px-5 py-[clamp(96px,15vh,168px)] md:px-10">
      <div className="grid gap-14 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-20">
        {/* left: intro */}
        <InkReveal>
          <Kicker>{t.kicker}</Kicker>
          <h2 className="mt-6 font-serif text-h2 font-semibold text-ink">{t.title}</h2>
          <p className="mt-5 max-w-reading text-[15px] leading-[1.85] text-ink-3">{t.blurb}</p>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {t.chips.map((c) => (
              <MetaChip key={c}>{c}</MetaChip>
            ))}
            <a
              href="https://github.com/tdwhere123"
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center gap-1.5 font-mono text-xs text-ink-3 transition-colors duration-300 hover:text-[color-mix(in_srgb,var(--seal)_62%,var(--ink))]"
            >
              <Github className="h-3.5 w-3.5" />
              {t.github}
            </a>
          </div>
          {/* album counter */}
          <div className="mt-10 border-t border-hairline pt-6">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-faint">
              {t.albumLabel} · {t.count(unlocked.length, total)}
            </p>
            {/* album: mini cards */}
            <motion.div
              className="mt-4 flex min-h-[64px] flex-wrap items-center gap-2"
              animate={celebrate ? { y: [0, -6, 0] } : { y: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 12 }}
              onAnimationComplete={() => setCelebrate(false)}
            >
              {unlocked.length === 0 && (
                <span className="text-[13px] italic text-faint">— —</span>
              )}
              <AnimatePresence>
                {unlocked.map((id) => {
                  const card = cards.find((c) => c.id === id)
                  if (!card) return null
                  return (
                    <motion.span
                      key={id}
                      layout="position"
                      initial={{ y: -26, opacity: 0, rotate: -6, scale: 0.8 }}
                      animate={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      className="inline-flex items-center rounded-md border border-hairline bg-paper-deep px-2.5 py-1.5 font-mono text-[11px] text-ink-2"
                    >
                      {card.name}
                    </motion.span>
                  )
                })}
              </AnimatePresence>
            </motion.div>
            {fullSet && (
              <div className="mt-6">
                <Stamp text={t.fullSetStamp} animateOnView={false} />
              </div>
            )}
          </div>
        </InkReveal>

        {/* right: draw table */}
        <InkReveal delay={0.15} className="flex flex-col items-center md:items-start">
          <div className="relative h-[340px] w-[240px] md:h-[360px] md:w-[252px]" style={{ perspective: '1200px' }}>
            {/* stacked backs (2px offsets) */}
            {[2, 1].map((i) => (
              <div
                key={i}
                aria-hidden="true"
                className="absolute inset-0 rounded-[16px] border border-tea-deep bg-museum-brass"
                style={{ transform: `translate(${i * 2}px, ${i * 2}px)`, opacity: 0.9 - i * 0.25 }}
              />
            ))}
            {/* the flipping card */}
            <motion.div
              className="absolute inset-0"
              style={{ transformStyle: 'preserve-3d' }}
              animate={{ rotateY: flipped ? 180 : 0 }}
              whileHover={!busy ? { y: -6 } : undefined}
              transition={{ duration: reduced ? 0.2 : 0.7, ease: [0.34, 1.2, 0.64, 1] }}
            >
              <CardBack />
              {current && (
                <CardFront card={current.card} index={cards.indexOf(current.card)} label={t.ingredientsLabel} />
              )}
            </motion.div>
            {/* unlocked stamp on the fresh card */}
            <AnimatePresence>
              {stampedId && current && stampedId === current.card.id && flipped && (
                <motion.div
                  key={stampedId}
                  className="absolute -right-3 -top-3 z-10"
                  exit={{ opacity: 0 }}
                >
                  <Stamp text={t.unlockedStamp} animateOnView={false} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* hint line */}
          <p aria-live="polite" className="mt-5 flex h-6 items-center gap-1.5 text-[13px] text-ink-3">
            {hint && (
              <>
                <Sparkles
                  className="h-3.5 w-3.5"
                  style={{ color: 'color-mix(in srgb, var(--seal) 62%, var(--ink))' }}
                  aria-hidden="true"
                />
                {hint}
                {current ? ` · ${current.card.name}` : ''}
              </>
            )}
          </p>

          <motion.button
            type="button"
            onClick={() => void draw()}
            disabled={busy}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="mt-4 rounded-full bg-museum-brass px-7 py-3 font-mono text-sm text-paper transition-colors duration-300 hover:bg-tea-deep disabled:opacity-60"
          >
            {busy ? t.drawing : current ? t.drawAgain : t.draw}
          </motion.button>
        </InkReveal>
      </div>
    </section>
  )
}
