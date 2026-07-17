import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { motion } from 'framer-motion'
import { Power, Volume2, VolumeX } from 'lucide-react'
import { useLang } from '@/context/LangContext'
import { playground } from '@/content/playground'
import Kicker from '@/components/Kicker'
import InkReveal from '@/components/InkReveal'
import Stamp from '@/components/Stamp'

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
  tRef.current = t

  const [phase, setPhase] = useState<Phase>('off')
  const [lines, setLines] = useState<TermLine[]>([])
  const [typing, setTyping] = useState<{ kind: LineKind; text: string } | null>(null)
  const [input, setInput] = useState('')
  const [sound, setSound] = useState(false)
  const [outBusy, setOutBusy] = useState(false)

  const phaseRef = useRef(phase)
  phaseRef.current = phase
  const sessionRef = useRef(0)
  const idRef = useRef(0)
  const timersRef = useRef<number[]>([])
  const pendingFreedomRef = useRef(false)
  const sleepPendingRef = useRef(false)
  const fallbackIdxRef = useRef(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<AudioContext | null>(null)

  const reduced = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )

  const sleep = useCallback(
    (ms: number) =>
      new Promise<void>((resolve) => {
        if (reduced && ms > 60) ms = 60
        const id = window.setTimeout(resolve, ms)
        timersRef.current.push(id)
      }),
    [reduced],
  )

  // cancel everything on unmount
  useEffect(() => {
    const timers = timersRef.current
    return () => {
      sessionRef.current += 1
      timers.forEach((id) => window.clearTimeout(id))
    }
  }, [])

  const pushLine = useCallback((kind: LineKind, text: string) => {
    idRef.current += 1
    const id = idRef.current
    setLines((prev) => [...prev, { id, kind, text }].slice(-200))
  }, [])

  const typeLine = useCallback(
    async (kind: LineKind, text: string, token: number) => {
      if (reduced) {
        if (token === sessionRef.current) pushLine(kind, text)
        return
      }
      setTyping({ kind, text: '' })
      let buf = ''
      for (const ch of text) {
        if (token !== sessionRef.current) {
          setTyping(null)
          return
        }
        buf += ch
        setTyping({ kind, text: buf })
        await sleep(CJK.test(ch) ? 55 : 20)
      }
      if (token !== sessionRef.current) {
        setTyping(null)
        return
      }
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

  const playClick = useCallback(() => {
    if (!sound) return
    try {
      audioRef.current ??= new (window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const ctx = audioRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      osc.frequency.value = 160
      gain.gain.setValueAtTime(0.035, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.06)
    } catch {
      /* audio unavailable — stay silent */
    }
  }, [sound])

  const powerOff = useCallback(() => {
    sessionRef.current += 1
    sleepPendingRef.current = false
    pendingOutRef.current = 0
    setOutBusy(false)
    setTyping(null)
    setLines([])
    setInput('')
    pendingFreedomRef.current = false
    setPhase('off')
  }, [])

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
    playClick()
    if (phaseRef.current === 'off') {
      void runBoot()
    } else {
      powerOff()
    }
  }, [playClick, powerOff, runBoot])

  const runSleep = useCallback(async () => {
    const token = sessionRef.current
    sleepPendingRef.current = true // block further commands while saying goodbye
    await say(tRef.current.sleep.slice(0, 1))
    await sleep(1200)
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
        default: {
          const i = fallbackIdxRef.current
          fallbackIdxRef.current = (i + 1) % s.fallback.length
          void say([s.fallback[i]])
        }
      }
    },
    [pushLine, runSleep, say],
  )

  const onSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault()
      if (phaseRef.current !== 'chatting' || sleepPendingRef.current) return
      const raw = input.trim()
      if (!raw) return
      setInput('')
      handleCommand(raw)
    },
    [handleCommand, input],
  )

  const onInputKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation()
  }, [])

  const screenOn = phase !== 'off'
  const inputEnabled = phase === 'chatting'
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
    <section aria-label={t.title} className="relative overflow-hidden rounded-[24px] bg-night">
      <style>{`
        .pg-machine {
          --pg-chassis-hi: color-mix(in srgb, var(--museum-stone) 62%, var(--museum-brass));
          --pg-chassis-lo: color-mix(in srgb, var(--museum-brass) 55%, var(--amber-dim));
          --pg-crt: color-mix(in srgb, var(--night-2) 78%, black);
          --pg-phosphor: color-mix(in srgb, var(--amber) 72%, var(--museum-stone));
          --pg-glow: color-mix(in srgb, var(--amber) 45%, transparent);
          --pg-glow-soft: color-mix(in srgb, var(--amber) 18%, transparent);
          --pg-seal-muted: color-mix(in srgb, var(--seal) 58%, var(--night));
          --pg-metal-ink: color-mix(in srgb, var(--ink) 72%, var(--museum-brass));
        }
        @keyframes pg-led-breath { 0%,100% { opacity:.3 } 50% { opacity:1 } }
        @keyframes pg-crt-band { from { transform: translateY(-130%) } to { transform: translateY(130%) } }
        @keyframes pg-caret { 0%,49% { opacity:1 } 50%,100% { opacity:0 } }
        .pg-caret { animation: pg-caret 1.06s steps(1) infinite }
        .pg-led { animation: pg-led-breath 2.6s ease-in-out infinite }
        .pg-band { animation: pg-crt-band 8s linear infinite }
      `}</style>

      <div className="mx-auto max-w-shell px-5 py-[120px] md:px-10">
        {/* dark-room header */}
        <InkReveal>
          <Kicker light>{t.kicker}</Kicker>
          <h2 className="mt-6 font-serif text-h2 font-semibold text-paper">{t.title}</h2>
          <p className="mt-5 max-w-reading text-[15px] leading-[1.85] text-amber-dim">
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
            className="pg-machine relative mx-auto w-[min(760px,100%)] rounded-[18px] border border-amber-dim p-4 md:p-6"
            style={{
              background: 'linear-gradient(160deg, var(--pg-chassis-hi) 0%, var(--pg-chassis-lo) 100%)',
            }}
          >
            {/* plastic grain */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-[18px] opacity-30 mix-blend-multiply"
              style={{ backgroundImage: `url("${GRAIN}")` }}
            />

            {/* CRT bezel */}
            <div
              className="relative aspect-[4/3] cursor-text overflow-hidden rounded-[28px]"
              style={{
                background: 'var(--pg-crt)',
                boxShadow:
                  'inset 0 0 70px color-mix(in srgb, var(--night) 92%, transparent), inset 0 0 22px color-mix(in srgb, black 85%, transparent), inset 0 2px 6px color-mix(in srgb, black 90%, transparent)',
              }}
              onClick={() => {
                if (phaseRef.current === 'chatting') inputRef.current?.focus()
              }}
            >
              {/* amber glow bloom */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-1000"
                style={{
                  opacity: screenOn ? 1 : 0,
                  background:
                    'radial-gradient(ellipse 70% 60% at 50% 45%, var(--pg-glow-soft), transparent 70%)',
                }}
              />

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
                    scrollbarColor: 'color-mix(in srgb, var(--amber) 32%, transparent) transparent',
                  }}
                >
                  <div
                    className="font-mono text-[13px] leading-[1.75] md:text-[15px]"
                    style={{ textShadow: '0 0 8px var(--pg-glow)' }}
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
                                ? 'var(--pg-phosphor)'
                                : 'var(--amber)',
                        }}
                      >
                        {l.kind === 'sentinel' ? '> ' : l.kind === 'user' ? '# ' : ''}
                        {l.text}
                      </p>
                    ))}
                    {typing && (
                      <p
                        className="whitespace-pre-wrap break-words"
                        style={{ color: typing.kind === 'bios' ? 'var(--amber-dim)' : 'var(--amber)' }}
                      >
                        {typing.kind === 'sentinel' ? '> ' : ''}
                        {typing.text}
                        <span aria-hidden="true" className="pg-caret">▌</span>
                      </p>
                    )}
                    {phase === 'chatting' && !typing && !outBusy && (
                      <p aria-hidden="true" style={{ color: 'var(--amber)' }}>
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
                    style={{ color: 'var(--pg-phosphor)', textShadow: '0 0 8px var(--pg-glow)' }}
                  >
                    {'>'}
                  </span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onInputKeyDown}
                    disabled={!inputEnabled}
                    aria-label={m.inputLabel}
                    placeholder={inputEnabled ? m.placeholder : ''}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    className="min-w-0 flex-1 bg-transparent font-mono text-[13px] caret-amber outline-none placeholder:opacity-40 md:text-[15px]"
                    style={{
                      color: 'var(--pg-phosphor)',
                      textShadow: '0 0 8px color-mix(in srgb, var(--amber) 35%, transparent)',
                    }}
                  />
                </form>
              </div>

              {/* scanlines */}
              <div aria-hidden="true" className="crt-scanlines pointer-events-none absolute inset-0 z-30 opacity-80" />
              {/* slow bright band */}
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-30 overflow-hidden mix-blend-overlay">
                <div
                  className="pg-band absolute inset-x-0 h-1/3"
                  style={{
                    opacity: screenOn ? 0.2 : 0,
                    background:
                      'linear-gradient(180deg, transparent, color-mix(in srgb, var(--amber) 55%, transparent) 50%, transparent)',
                  }}
                />
              </div>
              <FlickerOverlay active={screenOn && phase !== 'sleeping'} />
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

            {/* bottom panel: power, LED, floppy slot, vents, silk, sound */}
            <div className="relative mt-4 flex items-center gap-4 px-1 md:mt-5">
              <button
                type="button"
                onClick={togglePower}
                aria-label={`${m.powerLabel} · ${screenOn ? m.powerOff : m.powerOn}`}
                aria-pressed={screenOn}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-tea-deep transition-transform duration-100 active:translate-y-px"
                style={{
                  background: 'color-mix(in srgb, var(--museum-stone) 55%, var(--museum-brass))',
                  color: 'var(--pg-metal-ink)',
                  boxShadow: 'inset 0 -2px 3px color-mix(in srgb, black 25%, transparent)',
                }}
              >
                <Power className="h-4 w-4" />
              </button>
              <span
                aria-hidden="true"
                className={`h-2 w-2 shrink-0 rounded-full ${screenOn ? '' : 'pg-led'}`}
                style={{
                  background: screenOn ? 'var(--amber)' : 'var(--pg-seal-muted)',
                  boxShadow: screenOn
                    ? '0 0 8px color-mix(in srgb, var(--amber) 70%, transparent)'
                    : '0 0 6px color-mix(in srgb, var(--pg-seal-muted) 55%, transparent)',
                }}
              />
              <span aria-hidden="true" className="hidden h-px w-16 bg-amber-dim sm:block" />
              <div
                aria-hidden="true"
                className="ml-auto hidden h-6 w-24 rounded-sm opacity-60 md:block"
                style={{
                  background:
                    'repeating-linear-gradient(90deg, var(--amber-dim) 0 2px, transparent 2px 7px)',
                }}
              />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-tea-deep">
                {m.silk}
              </span>
              <button
                type="button"
                onClick={() => setSound((s) => !s)}
                aria-label={sound ? m.soundOff : m.soundOn}
                aria-pressed={sound}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-amber-dim/60 text-tea-deep transition-colors duration-300 hover:text-ink"
              >
                {sound ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
              </button>
            </div>

            {/* status line */}
            <p className="relative mt-3 px-1 font-mono text-[10px] uppercase tracking-[0.18em] text-tea-deep/80">
              status · {statusText}
              <span className="ml-3 normal-case tracking-normal">{m.hint}</span>
            </p>
          </div>

          {/* nameplate */}
          <div className="mx-auto mt-8 flex w-fit max-w-full flex-col items-center gap-3 rounded-[10px] border border-museum-line/40 bg-museum-stone px-6 py-4 text-center">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-ink-2">{m.plate}</p>
              <Stamp text={m.stamp} animateOnView />
            </div>
            <p className="text-[13px] italic text-ink-3">{m.plateNote}</p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
