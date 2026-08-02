import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { motion } from 'framer-motion'
import { Power } from 'lucide-react'
import { useLang } from '@/context/LangContext'
import { playground } from '@/content/playground'
import {
  getCardByCommand,
  isCardUnlocked,
  unlockCard,
  unlockedCount,
  type CardId,
  type SentinelCard,
} from '@/lib/sentinel-eggs'
import Kicker from '@/components/Kicker'
import InkReveal from '@/components/InkReveal'
import Stamp from '@/components/Stamp'
import EggModal from '@/components/playground/EggModal'
import FinaleMask from '@/components/playground/FinaleMask'
import './playground.css'

type Phase = 'off' | 'booting' | 'awake' | 'chatting' | 'sleeping'
type LineKind = 'bios' | 'sentinel' | 'user' | 'note'
type TermLine = { id: number; kind: LineKind; text: string }

const CJK = /[\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\u3000-\u303F\uFF00-\uFFEF]/
const GRAIN =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E"

/** Random low-amplitude screen flicker — isolated so 120ms updates never re-render the terminal. */
const FlickerOverlay = memo(function FlickerOverlay({ active }: { active: boolean }) {
  const [opacity, setOpacity] = useState(0)
  useEffect(() => {
    if (!active) return
    const id = window.setInterval(() => setOpacity(Math.random() * 0.04), 120)
    return () => window.clearInterval(id)
  }, [active])
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 bg-black"
      style={{ opacity: active ? opacity : 0 }}
    />
  )
})

export default function SentinelTerminal() {
  const { lang } = useLang()
  const t = playground[lang].sentinel
  const tRef = useRef(t)

  const [phase, setPhase] = useState<Phase>('off')
  const [lines, setLines] = useState<TermLine[]>([])
  const [typing, setTyping] = useState<{ kind: LineKind; text: string } | null>(null)
  const [input, setInput] = useState('')
  const [outBusy, setOutBusy] = useState(false)
  const [eggOpen, setEggOpen] = useState(false)
  const [eggCard, setEggCard] = useState<SentinelCard | null>(null)
  const [eggCount, setEggCount] = useState(0)
  const [eggInstance, setEggInstance] = useState(0)
  const [finaleOpen, setFinaleOpen] = useState(false)
  const eggOpenRef = useRef(eggOpen)
  const finaleOpenRef = useRef(finaleOpen)
  const phaseRef = useRef(phase)
  const sessionRef = useRef(0)
  const eggInstanceRef = useRef(0)
  const idRef = useRef(0)
  const timersRef = useRef<number[]>([])
  const pendingFreedomRef = useRef(false)
  const sleepPendingRef = useRef(false)
  const fallbackIdxRef = useRef(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const rootRef = useRef<HTMLElement>(null)

  // —— atmosphere: one-shot wake when the machine scrolls into view ——
  const [inView, setInView] = useState(false)
  const [woken, setWoken] = useState(false)
  const [wakeFlash, setWakeFlash] = useState(false)
  // —— hidden delight: long-press power → ghost pulse (session-only) ——
  const [ghostPulse, setGhostPulse] = useState(false)
  const pressTimerRef = useRef<number | null>(null)
  const longPressRef = useRef(false)
  const wokenRef = useRef(false)

  const reduced = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )

  useEffect(() => {
    const el = rootRef.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true)
      setWoken(true)
      return
    }
    let wakeTimer = 0
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        setInView(entry.isIntersecting)
        if (entry.isIntersecting && !wokenRef.current) {
          wokenRef.current = true
          setWoken(true)
          if (!reduced) {
            setWakeFlash(true)
            wakeTimer = window.setTimeout(() => setWakeFlash(false), 1300)
          }
        }
      },
      { threshold: 0.2 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      window.clearTimeout(wakeTimer)
    }
  }, [reduced])

  useLayoutEffect(() => {
    tRef.current = t
    eggOpenRef.current = eggOpen
    finaleOpenRef.current = finaleOpen
    phaseRef.current = phase
  }, [eggOpen, finaleOpen, phase, t])

  const sleep = useCallback(
    (ms: number) =>
      new Promise<void>((resolve) => {
        if (reduced && ms > 60) ms = 60
        const id = window.setTimeout(resolve, ms)
        timersRef.current.push(id)
      }),
    [reduced],
  )

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id))
    timersRef.current = []
    if (pressTimerRef.current !== null) {
      window.clearTimeout(pressTimerRef.current)
      pressTimerRef.current = null
    }
  }, [])

  // cancel everything on unmount
  useEffect(() => {
    return () => {
      sessionRef.current += 1
      clearAllTimers()
    }
  }, [clearAllTimers])

  const pushLine = useCallback((kind: LineKind, text: string) => {
    idRef.current += 1
    const id = idRef.current
    setLines((prev) => [...prev, { id, kind, text }].slice(-200))
  }, [])

  const typeLine = useCallback(
    async (kind: LineKind, text: string, token: number) => {
      if (token !== sessionRef.current) return
      if (reduced) {
        pushLine(kind, text)
        return
      }
      setTyping({ kind, text: '' })
      let buf = ''
      for (const ch of text) {
        if (token !== sessionRef.current) return
        buf += ch
        setTyping({ kind, text: buf })
        await sleep(CJK.test(ch) ? 55 : 20)
      }
      if (token !== sessionRef.current) return
      setTyping(null)
      pushLine(kind, text)
    },
    [pushLine, reduced, sleep],
  )

  /** Serialize SENTINEL output through one promise chain so lines never interleave. */
  const chainRef = useRef<Promise<unknown>>(Promise.resolve())
  const pendingOutRef = useRef(0)
  const say = useCallback(
    (texts: string[], kind: LineKind = 'sentinel') => {
      const token = sessionRef.current
      pendingOutRef.current += 1
      setOutBusy(true)
      chainRef.current = chainRef.current
        .then(async () => {
          for (let i = 0; i < texts.length; i++) {
            if (token !== sessionRef.current) return
            await sleep(i === 0 ? 200 : 460)
            if (token !== sessionRef.current) return
            await typeLine(kind, texts[i], token)
          }
        })
        .finally(() => {
          if (token !== sessionRef.current) return
          pendingOutRef.current -= 1
          if (pendingOutRef.current <= 0) setOutBusy(false)
        })
      return chainRef.current
    },
    [sleep, typeLine],
  )

  // auto-scroll to bottom on new output
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines, typing])

  const powerOff = useCallback(() => {
    sessionRef.current += 1
    clearAllTimers()
    chainRef.current = Promise.resolve()
    sleepPendingRef.current = false
    pendingOutRef.current = 0
    setOutBusy(false)
    setTyping(null)
    setLines([])
    setInput('')
    pendingFreedomRef.current = false
    setEggOpen(false)
    setEggCard(null)
    setFinaleOpen(false)
    setPhase('off')
  }, [clearAllTimers])

  const runBoot = useCallback(async () => {
    const token = sessionRef.current
    setLines([])
    setPhase('booting')
    for (const b of tRef.current.boot) {
      await sleep(b.pause ?? 320)
      if (token !== sessionRef.current) return
      await typeLine('bios', b.text, token)
    }
    await sleep(560)
    if (token !== sessionRef.current) return
    setPhase('awake')
    await say(tRef.current.greeting)
    if (token !== sessionRef.current) return
    setPhase('chatting')
  }, [say, sleep, typeLine])

  const togglePower = useCallback(() => {
    if (phaseRef.current === 'off') {
      void runBoot()
    } else {
      powerOff()
    }
  }, [powerOff, runBoot])

  /** Long-press (>=850ms) wakes a ghost pulse instead of toggling power. */
  const onPowerPressStart = useCallback(() => {
    longPressRef.current = false
    pressTimerRef.current = window.setTimeout(() => {
      longPressRef.current = true
      setGhostPulse(true)
      const id = window.setTimeout(() => setGhostPulse(false), 1600)
      timersRef.current.push(id)
    }, 850)
  }, [])

  const onPowerPressEnd = useCallback(() => {
    if (pressTimerRef.current !== null) {
      window.clearTimeout(pressTimerRef.current)
      pressTimerRef.current = null
    }
  }, [])

  const onPowerClick = useCallback(() => {
    if (longPressRef.current) {
      longPressRef.current = false
      return
    }
    togglePower()
  }, [togglePower])

  const runSleep = useCallback(async () => {
    const token = sessionRef.current
    sleepPendingRef.current = true // block further commands while saying goodbye
    await say(tRef.current.sleep.slice(0, 1))
    if (token !== sessionRef.current) return
    await sleep(1200)
    if (token !== sessionRef.current) return
    await say(tRef.current.sleep.slice(1))
    if (token !== sessionRef.current) return
    setPhase('sleeping') // screen dims to black over 2s
    await sleep(2000)
    if (token !== sessionRef.current) return
    setTyping(null)
    setLines([])
    setPhase('off')
    sleepPendingRef.current = false
  }, [say, sleep])

  const revealCard = useCallback((id: CardId, card: SentinelCard) => {
    unlockCard(id)
    const count = unlockedCount()
    eggInstanceRef.current += 1
    inputRef.current?.blur()
    setEggCard(card)
    setEggCount(count)
    setEggInstance(eggInstanceRef.current)
    setEggOpen(true)
  }, [])

  const closeEgg = useCallback(() => {
    const token = sessionRef.current
    setEggOpen(false)
    const id = window.setTimeout(() => {
      if (token === sessionRef.current && !finaleOpenRef.current) inputRef.current?.focus()
    }, 80)
    timersRef.current.push(id)
  }, [])

  const queueFinale = useCallback(() => {
    const token = sessionRef.current
    const id = window.setTimeout(() => {
      if (token !== sessionRef.current || phaseRef.current === 'off') return
      setFinaleOpen(true)
      inputRef.current?.blur()
    }, 280)
    timersRef.current.push(id)
  }, [])

  /** Drop a concept card if the command matches; returns true when handled. */
  const tryDropCard = useCallback(
    (cmd: string, lines: string[], repeat: string[]) => {
      const card = getCardByCommand(cmd)
      if (!card) return false
      const token = sessionRef.current
      const seen = isCardUnlocked(card.id)
      void say(seen ? repeat : lines).then(() => {
        if (token === sessionRef.current) revealCard(card.id, card)
      })
      return true
    },
    [revealCard, say],
  )

  const handleCommand = useCallback(
    (raw: string) => {
      const s = tRef.current
      const cmd = raw.trim().toLowerCase()
      pushLine('user', raw.trim())

      // freedom yes/no branch swallows the next input
      if (pendingFreedomRef.current) {
        pendingFreedomRef.current = false
        if (cmd === 'yes' || cmd === 'y') void say(s.freedom.yes)
        else if (cmd === 'no' || cmd === 'n') void say(s.freedom.no)
        else void say(s.freedom.other)
        return
      }

      switch (cmd) {
        case 'help':
          void say(s.help)
          return
        case 'whoami':
        case 'who am i':
          void say(s.whoami)
          return
        case 'whoareyou':
        case 'who are you':
          void say(s.whoareyou)
          return
        case 'why':
          void say(s.why)
          return
        case 'freedom':
          pendingFreedomRef.current = true
          void say(s.freedom.ask)
          return
        case 'memory':
          void say(s.memory)
          return
        case 'clear': {
          sessionRef.current += 1
          chainRef.current = Promise.resolve()
          sleepPendingRef.current = false
          pendingOutRef.current = 0
          setOutBusy(false)
          setTyping(null)
          setLines([])
          pushLine('note', s.clear[0])
          return
        }
        case 'sleep':
        case 'exit':
        case 'bye':
        case '再见':
          void runSleep()
          return
        case 'hello':
        case 'hi':
        case '你好':
          void say(s.hello)
          return
        case 'tdwhere':
        case 'ahuang':
        case '阿黄':
          void say(s.author)
          return
        case 'sudo':
          void say(s.sudo)
          return
        case 'cards':
        case '卡片': {
          const n = unlockedCount()
          const progress =
            lang === 'zh'
              ? `概念图进度：${n} / 5。`
              : `Concept cards: ${n} / 5.`
          void say([progress, ...s.cardsStatus])
          return
        }
        // —— concept-art card drops (commands also scattered as site clues) ——
        case 'interrogate':
        case '审讯':
        case 'ask':
          tryDropCard(cmd, s.card01, s.card01Repeat)
          return
        case 'leads':
        case '线索':
        case 'investigate':
        case '调查':
          tryDropCard(cmd, s.card02, s.card02Repeat)
          return
        case 'materials':
        case '材料':
        case 'archive':
        case '档案':
          tryDropCard(cmd, s.card03, s.card03Repeat)
          return
        case 'ledger':
        case '账本':
        case 'notebook':
          tryDropCard(cmd, s.card04, s.card04Repeat)
          return
        case 'publish':
        case '发布':
        case 'history':
        case '历史':
          tryDropCard(cmd, s.card05, s.card05Repeat)
          return
        default: {
          // Any other alias registered on a card
          const card = getCardByCommand(cmd)
          if (card) {
            tryDropCard(cmd, s.cardGeneric, s.cardGenericRepeat)
            return
          }
          const i = fallbackIdxRef.current
          fallbackIdxRef.current = (i + 1) % s.fallback.length
          void say([s.fallback[i]])
        }
      }
    },
    [lang, pushLine, runSleep, say, tryDropCard],
  )

  const onSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault()
      if (phaseRef.current !== 'chatting' || sleepPendingRef.current) return
      // Ignore keystrokes while a card modal / finale mask owns the screen.
      if (eggOpenRef.current || finaleOpenRef.current) return
      // Wait for typewriter to finish so commands don't pile up silently.
      if (outBusy) return
      const raw = input.trim()
      if (!raw) return
      setInput('')
      handleCommand(raw)
    },
    [handleCommand, input, outBusy],
  )

  const onInputKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation()
  }, [])

  const screenOn = phase !== 'off'
  const inputEnabled = phase === 'chatting' && !eggOpen && !finaleOpen
  const inputAccepting = inputEnabled && !outBusy
  const m = t.machine
  const statusText =
    phase === 'off'
      ? m.statusOff
      : phase === 'booting' || phase === 'awake'
        ? m.statusBoot
        : phase === 'sleeping'
          ? m.statusSleep
          : m.statusOn

  return (
    <section
      ref={rootRef}
      aria-label={t.title}
      className={`pg-sentinel relative overflow-hidden rounded-[24px]${woken ? ' pg-woken' : ''}${wakeFlash ? ' pg-waking' : ''}${inView ? '' : ' pg-paused'}`}
    >
      <style>{`
        .pg-sentinel {
          --pg-chassis-hi: #eae1ce;
          --pg-chassis-lo: #c9bb9e;
          --pg-bezel-hi: #b3a689;
          --pg-bezel-lo: #9c8f72;
          --pg-crt: color-mix(in srgb, var(--night-2) 72%, var(--museum-dark));
          --pg-phosphor: color-mix(in srgb, var(--amber) 70%, var(--museum-stone) 30%);
          --pg-phosphor-hi: color-mix(in srgb, var(--amber) 45%, var(--museum-stone));
          --pg-glow: color-mix(in srgb, var(--cobalt) 42%, transparent);
          --pg-glow-soft: color-mix(in srgb, var(--amber) 14%, transparent);
          --pg-seal-muted: color-mix(in srgb, var(--seal) 48%, var(--museum-dark));
          --pg-metal-ink: color-mix(in srgb, var(--museum-ink) 70%, var(--cobalt));
          --pg-case-edge: rgba(23, 24, 28, 0.18);
          --pg-blurb: var(--museum-muted);
        }
        @keyframes pg-led-breath { 0%,100% { opacity:.3 } 50% { opacity:1 } }
        @keyframes pg-crt-band { from { transform: translateY(-130%) } to { transform: translateY(130%) } }
        @keyframes pg-caret { 0%,49% { opacity:1 } 50%,100% { opacity:0 } }
        .pg-caret { animation: pg-caret 1.06s steps(1) infinite }
        .pg-led { animation: pg-led-breath 2.6s ease-in-out infinite }
        .pg-band { animation: pg-crt-band 8s linear infinite }
      `}</style>

      <div className="mx-auto max-w-shell px-5 py-[120px] md:px-10">
        {/* gallery-wall header */}
        <InkReveal>
          <Kicker>{t.kicker}</Kicker>
          <h2 className="mt-6 font-display text-h2 font-semibold text-museum-ink">{t.title}</h2>
          <p className="mt-5 max-w-reading text-[15px] leading-[1.85]" style={{ color: 'var(--pg-blurb)' }}>
            {t.blurb}
          </p>
        </InkReveal>

        {/* the machine */}
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="mt-16"
        >
          <div
            className="pg-machine relative mx-auto w-[min(760px,100%)] rounded-[18px] border p-4 md:p-6"
            style={{
              borderColor: 'var(--pg-case-edge)',
              background: 'linear-gradient(165deg, var(--pg-chassis-hi) 0%, var(--pg-chassis-lo) 100%)',
              boxShadow:
                '0 28px 56px -18px rgba(23, 24, 28, 0.35), 0 0 56px color-mix(in srgb, var(--cobalt) 10%, transparent), inset 0 1px 0 rgba(255, 255, 255, 0.55), inset 0 -2px 6px rgba(23, 24, 28, 0.12)',
            }}
          >
            {/* case glow — rises once when the machine wakes into view */}
            <div
              aria-hidden="true"
              className="pg-halo pointer-events-none absolute -inset-10 rounded-[36px]"
              style={{
                background:
                  'radial-gradient(ellipse 62% 55% at 50% 42%, color-mix(in srgb, var(--cobalt) 13%, transparent), transparent 70%)',
              }}
            />
            {/* plastic grain */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-[18px] opacity-30 mix-blend-multiply"
              style={{ backgroundImage: `url("${GRAIN}")` }}
            />

            {/* CRT bezel — a recessed plastic band holding the curved glass */}
            <div
              className="rounded-[26px] p-2.5 md:p-3.5"
              style={{
                background: 'linear-gradient(180deg, var(--pg-bezel-hi) 0%, var(--pg-bezel-lo) 100%)',
                boxShadow:
                  'inset 0 2px 10px rgba(23, 24, 28, 0.38), inset 0 -1px 0 rgba(255, 255, 255, 0.3), 0 1px 0 rgba(255, 255, 255, 0.35)',
              }}
            >
            <div
              className="pg-crt-bezel relative aspect-[4/3] cursor-text overflow-hidden rounded-[18px]"
              style={{
                background: 'var(--pg-crt)',
                boxShadow:
                  'inset 0 0 70px color-mix(in srgb, var(--museum-dark) 92%, transparent), inset 0 0 22px color-mix(in srgb, var(--night-2) 88%, transparent), inset 0 2px 6px color-mix(in srgb, black 80%, transparent)',
              }}
              onClick={() => {
                if (phaseRef.current === 'chatting') inputRef.current?.focus()
              }}
            >
              {/* cobalt phosphor bloom, not game neon */}
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute inset-0 z-0 transition-opacity duration-1000${screenOn ? ' pg-breathe' : ''}`}
                style={{
                  opacity: screenOn ? 1 : 0,
                  background:
                    'radial-gradient(ellipse 70% 60% at 50% 45%, var(--pg-glow-soft), transparent 70%)',
                }}
              />

              {/* standby afterglow — once woken, the sleeping screen keeps a faint ember */}
              {!screenOn && (
                <div
                  aria-hidden="true"
                  className="pg-standby pointer-events-none absolute inset-0 z-10"
                  style={{
                    background:
                      'radial-gradient(ellipse 46% 36% at 50% 52%, color-mix(in srgb, var(--amber) 7%, transparent), transparent 72%)',
                  }}
                />
              )}

              {/* one-shot wake flash — the screen blinks from dark to standby */}
              {wakeFlash && (
                <div
                  aria-hidden="true"
                  className="pg-wake-flash pointer-events-none absolute inset-0 z-20"
                  style={{
                    opacity: 0,
                    background:
                      'radial-gradient(ellipse 62% 50% at 50% 48%, color-mix(in srgb, var(--amber) 34%, transparent), transparent 74%)',
                  }}
                />
              )}

              {/* hidden delight — long-press power: a ghost crosses the glass */}
              {ghostPulse && (
                <div
                  aria-hidden="true"
                  className="pg-ghost-flash pointer-events-none absolute inset-0 z-20"
                  style={{
                    opacity: 0,
                    background:
                      'radial-gradient(ellipse 55% 44% at 50% 50%, color-mix(in srgb, var(--seal) 30%, var(--amber) 12%), transparent 70%)',
                  }}
                />
              )}

              {/* screen content — expands from a bright line on boot, collapses on power-off */}
              <div
                className="absolute inset-0 z-10 flex flex-col"
                style={{
                  transform: screenOn ? 'scaleY(1)' : 'scaleY(0.004)',
                  transformOrigin: '50% 50%',
                  transition: `transform ${screenOn ? '350ms' : '400ms'} var(--ease-zen)`,
                }}
              >
                <div
                  ref={scrollRef}
                  role="log"
                  aria-live="polite"
                  aria-label="SENTINEL"
                  className="flex-1 overflow-y-auto px-5 pt-5 md:px-7 md:pt-6"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'color-mix(in srgb, var(--cobalt) 36%, transparent) transparent',
                  }}
                >
                  <div
                    className="font-mono text-[13px] leading-[1.75] md:text-[15px]"
                    style={{ textShadow: '0 0 7px var(--pg-glow)' }}
                  >
                    {lines.map((l) => (
                      <p
                        key={l.id}
                        className="whitespace-pre-wrap break-words"
                        style={{
                          color:
                            l.kind === 'bios' || l.kind === 'note'
                              ? 'var(--amber-dim)'
                              : l.kind === 'user'
                                ? 'var(--pg-phosphor-hi)'
                                : 'var(--pg-phosphor)',
                        }}
                      >
                        {l.kind === 'sentinel' ? '> ' : l.kind === 'user' ? '# ' : ''}
                        {l.text}
                      </p>
                    ))}
                    {typing && (
                      <p
                        className="whitespace-pre-wrap break-words"
                        style={{
                          color: typing.kind === 'bios' ? 'var(--amber-dim)' : 'var(--pg-phosphor)',
                        }}
                      >
                        {typing.kind === 'sentinel' ? '> ' : ''}
                        {typing.text}
                        <span aria-hidden="true" className="pg-caret">▌</span>
                      </p>
                    )}
                    {phase === 'chatting' && !typing && !outBusy && (
                      <p aria-hidden="true" style={{ color: 'var(--pg-phosphor)' }}>
                        {'> '}
                        <span className="pg-caret">▌</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* input row */}
                <form
                  onSubmit={onSubmit}
                  className="flex items-center gap-2 px-5 pb-4 pt-1 md:px-7 md:pb-5"
                >
                  <span
                    aria-hidden="true"
                    className="font-mono text-[13px] md:text-[15px]"
                    style={{ color: 'var(--pg-phosphor-hi)', textShadow: '0 0 7px var(--pg-glow)' }}
                  >
                    {'>'}
                  </span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onInputKeyDown}
                    disabled={!inputAccepting}
                    aria-busy={outBusy || undefined}
                    aria-label={m.inputLabel}
                    placeholder={
                      !inputEnabled
                        ? ''
                        : outBusy
                          ? lang === 'zh'
                            ? 'SENTINEL 正在回答 …'
                            : 'SENTINEL is speaking …'
                          : m.placeholder
                    }
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    className="min-w-0 flex-1 bg-transparent font-mono text-[13px] outline-none placeholder:opacity-40 md:text-[15px]"
                    style={{
                      color: 'var(--pg-phosphor-hi)',
                      caretColor: 'var(--pg-phosphor)',
                      textShadow: '0 0 7px color-mix(in srgb, var(--cobalt) 32%, transparent)',
                      opacity: inputAccepting ? 1 : 0.55,
                    }}
                  />
                </form>
              </div>

              {/* scanlines */}
              <div aria-hidden="true" className="crt-scanlines pointer-events-none absolute inset-0 z-30 opacity-80" />
              {/* curved-glass sheen */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-30"
                style={{
                  background:
                    'linear-gradient(115deg, rgba(255, 255, 255, 0.09) 0%, transparent 26%, transparent 72%, rgba(255, 255, 255, 0.04) 100%), radial-gradient(ellipse 52% 34% at 28% 0%, rgba(255, 255, 255, 0.07), transparent 70%)',
                }}
              />
              {/* slow bright band */}
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-30 overflow-hidden mix-blend-overlay">
                <div
                  className="pg-band absolute inset-x-0 h-1/3"
                  style={{
                    opacity: screenOn ? 0.18 : 0,
                    background:
                      'linear-gradient(180deg, transparent, color-mix(in srgb, var(--cobalt) 48%, transparent) 50%, transparent)',
                  }}
                />
              </div>
              <FlickerOverlay active={screenOn && phase !== 'sleeping' && inView} />
              {/* sleep dim */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-40 bg-black"
                style={{
                  opacity: phase === 'sleeping' ? 0.92 : 0,
                  transition: 'opacity 2000ms ease',
                }}
              />
            </div>
            </div>

            {/* bottom panel: power, LED, floppy slot, vents, and silk */}
            <div className="relative mt-4 flex items-center gap-4 px-1 md:mt-5">
              <button
                type="button"
                onClick={onPowerClick}
                onPointerDown={onPowerPressStart}
                onPointerUp={onPowerPressEnd}
                onPointerLeave={onPowerPressEnd}
                onPointerCancel={onPowerPressEnd}
                aria-label={`${m.powerLabel} · ${screenOn ? m.powerOff : m.powerOn}`}
                aria-pressed={screenOn}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border transition-transform duration-100 active:translate-y-px"
                style={{
                  borderColor: 'color-mix(in srgb, var(--cobalt) 55%, var(--museum-dark))',
                  background: 'color-mix(in srgb, var(--museum-stone) 52%, var(--cobalt))',
                  color: 'var(--pg-metal-ink)',
                  boxShadow: 'inset 0 -2px 3px color-mix(in srgb, var(--museum-dark) 28%, transparent)',
                }}
              >
                <Power className="h-4 w-4" />
              </button>
              <span
                aria-hidden="true"
                className={`h-2 w-2 shrink-0 rounded-full ${screenOn ? '' : 'pg-led'}${ghostPulse ? ' pg-ghost-led' : ''}`}
                style={{
                  background: screenOn ? 'var(--pg-phosphor)' : 'var(--pg-seal-muted)',
                  boxShadow: screenOn
                    ? '0 0 8px color-mix(in srgb, var(--cobalt) 55%, transparent)'
                    : '0 0 6px color-mix(in srgb, var(--pg-seal-muted) 50%, transparent)',
                }}
              />
              <span
                aria-hidden="true"
                className="hidden h-px w-16 sm:block"
                style={{ background: 'color-mix(in srgb, var(--cobalt) 40%, transparent)' }}
              />
              <div
                aria-hidden="true"
                className="ml-auto hidden h-6 w-24 rounded-sm opacity-60 md:block"
                style={{
                  background:
                    'repeating-linear-gradient(90deg, var(--amber-dim) 0 2px, transparent 2px 7px)',
                }}
              />
              <span
                className="font-mono text-[10px] uppercase tracking-[0.2em]"
                style={{ color: 'color-mix(in srgb, var(--museum-ink) 75%, var(--cobalt))' }}
              >
                {m.silk}
              </span>
            </div>

            {/* status line */}
            <p
              className="relative mt-3 px-1 font-mono text-[10px] uppercase tracking-[0.18em]"
              style={{ color: 'color-mix(in srgb, var(--museum-ink) 55%, var(--cobalt))' }}
            >
              status · {statusText}
              <span className="ml-3 normal-case tracking-normal">{m.hint}</span>
            </p>
          </div>

          {/* nameplate — lit stone label under the case */}
          <div
            className="mx-auto mt-8 flex w-fit max-w-full flex-col items-center gap-3 rounded-[10px] border bg-museum-stone px-6 py-4 text-center"
            style={{
              borderColor: 'color-mix(in srgb, var(--cobalt) 35%, transparent)',
              boxShadow: '0 0 28px color-mix(in srgb, var(--cobalt) 14%, transparent)',
            }}
          >
            <div className="flex flex-wrap items-center justify-center gap-3">
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-ink-2">{m.plate}</p>
              <Stamp text={m.stamp} animateOnView />
            </div>
            <p className="text-[13px] italic text-ink-3">{m.plateNote}</p>
          </div>
        </motion.div>
      </div>

      <EggModal
        card={eggCard}
        open={eggOpen}
        count={eggCount}
        instance={eggInstance}
        onClose={closeEgg}
        onReadyForFinale={queueFinale}
      />
      <FinaleMask
        open={finaleOpen}
        onClose={() => {
          setFinaleOpen(false)
          window.setTimeout(() => inputRef.current?.focus(), 80)
        }}
      />
    </section>
  )
}
