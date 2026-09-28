import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
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
import EggModal from '@/components/playground/EggModal'
import FinaleMask from '@/components/playground/FinaleMask'
import './playground.css'

export type Phase = 'off' | 'booting' | 'awake' | 'chatting' | 'sleeping'
type LineKind = 'bios' | 'sentinel' | 'user' | 'note'
type TermLine = { id: number; kind: LineKind; text: string }

const CJK = /[\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\u3000-\u303F\uFF00-\uFFEF]/

const lineColor = (kind: LineKind) =>
  kind === 'bios' || kind === 'note'
    ? 'var(--amber-dim)'
    : kind === 'user'
      ? 'var(--pg-phosphor-hi)'
      : 'var(--pg-phosphor)'
const linePrefix = (kind: LineKind) => (kind === 'sentinel' ? '> ' : kind === 'user' ? '# ' : '')

/** Settled lines only re-render when a line is added, never per typed character. */
const Lines = memo(function Lines({ lines }: { lines: TermLine[] }) {
  return lines.map((l) => (
    <p key={l.id} className="whitespace-pre-wrap break-words" style={{ color: lineColor(l.kind) }}>
      {linePrefix(l.kind)}
      {l.text}
    </p>
  ))
})

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

/**
 * The SENTINEL screen: only the glass and what glows on it. Power is owned by
 * the machine around it; the screen reports its phase back so the case can
 * light its LED and turn off when the conversation says goodbye.
 */
export default function SentinelTerminal({
  powered,
  active = true,
  onPhase,
}: {
  powered: boolean
  active?: boolean
  onPhase?: (phase: Phase) => void
}) {
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
  const onPhaseRef = useRef(onPhase)

  const reduced = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )

  useLayoutEffect(() => {
    tRef.current = t
    eggOpenRef.current = eggOpen
    finaleOpenRef.current = finaleOpen
    phaseRef.current = phase
    onPhaseRef.current = onPhase
  }, [eggOpen, finaleOpen, phase, t, onPhase])

  useEffect(() => {
    onPhaseRef.current?.(phase)
  }, [phase])

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
  }, [])

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
    inputRef.current?.focus({ preventScroll: true })
  }, [say, sleep, typeLine])

  useEffect(() => {
    if (powered && phaseRef.current === 'off') void runBoot()
    else if (!powered && phaseRef.current !== 'off') powerOff()
  }, [powered, powerOff, runBoot])

  const runSleep = useCallback(async () => {
    const token = sessionRef.current
    sleepPendingRef.current = true
    await say(tRef.current.sleep.slice(0, 1))
    if (token !== sessionRef.current) return
    await sleep(1200)
    if (token !== sessionRef.current) return
    await say(tRef.current.sleep.slice(1))
    if (token !== sessionRef.current) return
    setPhase('sleeping')
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
      if (token === sessionRef.current && !finaleOpenRef.current)
        inputRef.current?.focus({ preventScroll: true })
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
          const progress = lang === 'zh' ? `概念图进度：${n} / 5。` : `Concept cards: ${n} / 5.`
          void say([progress, ...s.cardsStatus])
          return
        }
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
      if (eggOpenRef.current || finaleOpenRef.current) return
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

  return (
    <section
      aria-label={t.title}
      className={`pg-sentinel pg-screen${active ? '' : ' pg-paused'}`}
      onClick={() => {
        if (phaseRef.current === 'chatting') inputRef.current?.focus({ preventScroll: true })
      }}
    >
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 z-0 transition-opacity duration-1000${screenOn ? ' pg-breathe' : ''}`}
        style={{
          opacity: screenOn ? 1 : 0,
          background: 'radial-gradient(ellipse 70% 60% at 50% 45%, var(--pg-glow-soft), transparent 70%)',
        }}
      />

      <div className="pg-standby-text" aria-hidden={screenOn} style={{ opacity: screenOn ? 0 : 1 }}>
        <p>
          <span className="pg-caret">_</span> THE SIGNAL REMAINS.
        </p>
        <small>{lang === 'zh' ? '这台终端还醒着。' : 'This terminal is still awake.'}</small>
      </div>

      <div
        className="absolute inset-0 z-10 flex flex-col"
        style={{
          transform: screenOn ? 'scaleY(1)' : 'scaleY(0.004)',
          opacity: screenOn ? 1 : 0,
          transformOrigin: '50% 50%',
          transition: `transform ${screenOn ? '350ms' : '400ms'} var(--ease-zen), opacity 200ms linear`,
        }}
      >
        <div
          ref={scrollRef}
          role="log"
          aria-live="polite"
          aria-label="SENTINEL"
          className="pg-scroll flex-1 overflow-y-auto"
        >
          <div className="pg-text">
            <Lines lines={lines} />
            {typing && (
              <p className="whitespace-pre-wrap break-words" style={{ color: lineColor(typing.kind) }}>
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

        <form onSubmit={onSubmit} className="pg-input-row">
          <span aria-hidden="true">{'>'}</span>
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
            style={{ opacity: inputAccepting ? 1 : 0.55 }}
          />
        </form>
      </div>

      <div aria-hidden="true" className="crt-scanlines pointer-events-none absolute inset-0 z-30 opacity-70" />
      <div aria-hidden="true" className="pg-sheen pointer-events-none absolute inset-0 z-30" />
      <FlickerOverlay active={screenOn && phase !== 'sleeping' && active} />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-40 bg-black"
        style={{ opacity: phase === 'sleeping' ? 0.92 : 0, transition: 'opacity 2000ms ease' }}
      />

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
          window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 80)
        }}
      />
    </section>
  )
}
