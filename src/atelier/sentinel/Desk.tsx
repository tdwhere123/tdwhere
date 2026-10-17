import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AudioLines, Check, Monitor } from 'lucide-react'
import { useLang } from '@/context/LangContext'
import MachineStage from '../machine/MachineStage'
import { useNarrow, useQuiet, useWords } from '../hooks'
import Ledger from './Ledger'
import {
  AGAIN,
  begin,
  choicesOf,
  choose,
  copied,
  copy,
  DEADLINE,
  hour,
  keep,
  LEDGER,
  left,
  linesOf,
  OFF,
  type Choice,
  type Kind,
  type Words,
  type Prev,
} from './story'

type Entry = { kind: Kind | 'you'; text: Words; clip?: string }
type EntryKind = Kind | 'you'
const KEY = 'tdwhere:sentinel'
const CJK = /[\u3000-\u303f\u3400-\u9fff\uff00-\uffef]/
const NUMERALS = '一二三四五六七八九十'
/** What glows on the machine's screen; everything else lies on the desk. */
const SCREEN: EntryKind[] = ['bios', 'say', 'doc']

function recall(): Prev | undefined {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Prev) : undefined
  } catch {
    return undefined
  }
}
function remember(prev: Prev) {
  try {
    localStorage.setItem(KEY, JSON.stringify(prev))
  } catch {
    // a private window keeps no archive; the next night starts clean
  }
}

/** Consecutive lines of one medium share a block: a screen, a slip of paper, a tape. */
type Block = {
  medium: 'screen' | 'paper' | 'tape' | 'page'
  from: number
  to: number
}
function blocks(log: Entry[], upto: number): Block[] {
  const out: Block[] = []
  for (let i = 0; i < upto; i++) {
    const k = log[i].kind
    const medium = SCREEN.includes(k) ? 'screen' : k === 'paper' ? 'paper' : k === 'tape' ? 'tape' : 'page'
    const last = out[out.length - 1]
    if (last && last.medium === medium && medium !== 'page') last.to = i + 1
    else out.push({ medium, from: i, to: i + 1 })
  }
  return out
}

/**
 * The review, laid out on a desk once the machine is on: the painted machine
 * sits fixed on one side with its words live on the glass, the story is
 * printed on the paper beside it, and the ledger lies closed in the corner. Lines arrive one at a time (a click or
 * Space finishes them); choices are taken by click or number key. Switching
 * off keeps the night where it was; a finished record is kept for the next.
 */
export default function Desk({ open, onClose }: { open: boolean; onClose: () => void }) {
  const w = useWords()
  const { lang } = useLang()
  const quiet = useQuiet()
  const [game, setGame] = useState(() => begin(recall()))
  const [log, setLog] = useState<Entry[]>(() => linesOf(game))
  const [scene, setScene] = useState(0)
  const [shown, setShown] = useState(0)
  const [typed, setTyped] = useState(0)
  const [book, setBook] = useState<number | null>(null)
  const [bump, setBump] = useState(0)
  const narrow = useNarrow()
  const room = useRef<HTMLDivElement>(null)
  const glass = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLOListElement>(null)
  const visible = quiet ? log.length : shown
  const done = visible >= log.length
  const choices = useMemo(() => (done ? choicesOf(game) : []), [done, game])
  const clipped = copied(game)

  // One character (or a few Latin ones) at a time, then a breath between lines.
  useEffect(() => {
    if (!open || quiet || book !== null || shown >= log.length) return
    const entry = log[shown],
      text = lang === 'zh' ? entry.text[0] : entry.text[1]
    const next = text[typed]
    const pause = entry.kind === 'doc' || entry.kind === 'bios' || entry.kind === 'paper' ? 160 : 420
    const id = window.setTimeout(
      () => {
        if (typed < text.length) setTyped((t) => t + (next && CJK.test(next) ? 1 : 3))
        else {
          setShown((n) => n + 1)
          setTyped(0)
        }
      },
      typed >= text.length ? pause : entry.kind === 'bios' ? 8 : CJK.test(next ?? '') ? 24 : 15,
    )
    return () => window.clearTimeout(id)
  }, [open, quiet, book, shown, typed, log, lang])

  useLayoutEffect(() => {
    for (const el of [room.current, glass.current]) if (el) el.scrollTop = el.scrollHeight
  }, [visible, typed, choices.length])

  useEffect(() => {
    // the list, not its first option: a second Space must not choose for the reader
    if (open && done && book === null) list.current?.focus({ preventScroll: true })
  }, [open, done, game, book])

  const finish = useCallback(() => {
    setShown(log.length)
    setTyped(0)
  }, [log.length])

  const pick = useCallback(
    (c: Choice) => {
      if (c.to === OFF) return onClose()
      if (c.to === LEDGER) return setBook(Infinity)
      if (c.to === AGAIN) {
        const fresh = begin(recall())
        setGame(fresh)
        setLog(linesOf(fresh))
        setScene(0)
        setShown(0)
      } else {
        const next = choose(game, c)
        if (choicesOf(next).some((x) => x.to === AGAIN)) remember(keep(next))
        setGame(next)
        setLog([...log, { kind: 'you', text: c.text }, ...linesOf(next)])
        setScene(log.length)
        setShown(log.length + 1)
      }
      setTyped(0)
    },
    [game, log, onClose],
  )

  const take = (id: string) => {
    setGame((g) => copy(g, id))
    setBump((n) => n + 1)
  }

  useEffect(() => {
    if (!open) return
    const root = document.documentElement,
      overflow = root.style.overflow
    root.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (book !== null) {
        if (e.key === 'Escape') setBook(null)
        return
      }
      if (e.key === 'Escape') return onClose()
      if (!done && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault()
        return finish()
      }
      const n = Number(e.key)
      if (done && n >= 1 && n <= choices.length) {
        e.preventDefault()
        pick(choices[n - 1])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      root.style.overflow = overflow
    }
  }, [open, done, choices, pick, finish, book, onClose])

  const line = (entry: Entry, i: number) => {
    const text = w(...entry.text)
    const typing = i === visible && !done
    const kept = !!entry.clip && clipped.includes(entry.clip)
    return (
      <p key={i} data-kind={entry.kind} data-clip={entry.clip ? '' : undefined}>
        <span>{typing ? text.slice(0, typed) : text}</span>
        {typing && <span className="a-desk-caret" aria-hidden="true" />}
        {entry.clip && !typing && (
          <button
            type="button"
            className="a-desk-copy"
            data-kept={kept ? '' : undefined}
            disabled={!!kept}
            onClick={() => take(entry.clip!)}
            aria-label={kept ? w('已抄进账本', 'Copied into the ledger') : w('抄进账本', 'Copy into the ledger')}
          >
            {kept ? <Check size={13} aria-hidden="true" /> : null}
            {kept ? w('已抄', 'copied') : w('抄', 'copy')}
          </button>
        )}
      </p>
    )
  }

  const remaining = DEADLINE - game.clock
  const upto = done ? log.length : visible + 1
  return (
    <div
      className="a-desk"
      data-dry
      data-open={open ? '' : undefined}
      role="dialog"
      aria-modal="true"
      aria-label="SENTINEL"
      inert={!open}
    >
      <header className="a-desk-bar">
        <span>1011-07 · {w('第七区', 'Section 7')}</span>
        <span className="a-desk-clock" data-late={remaining <= 40 ? '' : undefined}>
          {hour(game.clock)}
          <small>{remaining > 0 ? w(`离六点 ${left(game)[0]}`, `${left(game)[1]} to six`) : w('六点', 'six')}</small>
        </span>
        <span className="a-desk-tools">
          <button type="button" onClick={() => setBook(Infinity)}>
            {w('账本', 'Ledger')} · {clipped.length}
          </button>
          <button type="button" onClick={onClose}>
            {w('关机', 'Off')} <kbd>Esc</kbd>
          </button>
        </span>
      </header>

      <div className="a-desk-body">
        <div className="a-desk-machine">
          {open && (
            <MachineStage powered onPowerKey={onClose} near={narrow ? 0.62 : 0.86} keys="window" fixed>
              <div className="a-desk-glass" ref={glass} onClick={done ? undefined : finish}>
                {log.slice(0, upto).map((e, i) =>
                  SCREEN.includes(e.kind) ? (
                    <div key={i} data-past={i < scene ? '' : undefined}>
                      {line(e, i)}
                    </div>
                  ) : null,
                )}
                {!done && SCREEN.includes(log[visible]?.kind) ? null : (
                  <p className="a-desk-glass-caret" aria-hidden="true">
                    _
                  </p>
                )}
              </div>
            </MachineStage>
          )}
        </div>
        <div className="a-desk-room" ref={room} onClick={done ? undefined : finish}>
          <div className="a-desk-column">
            {blocks(log, upto).map((b) => {
              const past = b.to <= scene ? '' : undefined
              if (b.medium === 'screen')
                return (
                  <p
                    key={b.from}
                    className="a-desk-cue"
                    data-past={past}
                    data-live={!done && visible >= b.from && visible < b.to ? '' : undefined}
                  >
                    <Monitor size={14} aria-hidden="true" />
                    {w('屏幕上', 'On the screen')}
                  </p>
                )
              const items = log.slice(b.from, b.to).map((e, j) => line(e, b.from + j))
              if (b.medium === 'page')
                return (
                  <div key={b.from} className="a-desk-page" data-past={past}>
                    {items}
                  </div>
                )
              if (b.medium === 'tape')
                return (
                  <div key={b.from} className="a-desk-tape" data-past={past}>
                    <AudioLines size={16} aria-hidden="true" />
                    <div>{items}</div>
                  </div>
                )
              return (
                <div key={b.from} className="a-desk-slip" data-past={past}>
                  {items}
                </div>
              )
            })}
            {done && (
              <ol className="a-desk-choices" ref={list} tabIndex={-1} aria-label={w('选择', 'Choices')}>
                {choices.map((c, i) => (
                  <li key={`${game.at}-${i}`}>
                    <button type="button" onClick={() => pick(c)}>
                      <span aria-hidden="true">{lang === 'zh' ? NUMERALS[i] : `${i + 1}.`}</span>
                      {w(...c.text)}
                    </button>
                  </li>
                ))}
              </ol>
            )}
            {!done && (
              <p className="a-desk-skip" aria-hidden="true">
                {w('点一下，或按空格，让它说完', 'Click, or press Space, to let it finish')}
              </p>
            )}
          </div>
        </div>
      </div>

      <button
        type="button"
        className="a-desk-book"
        key={bump}
        data-bump={bump ? '' : undefined}
        onClick={() => setBook(Infinity)}
      >
        <span className="a-desk-book-label">
          <strong>{w('账本', 'Ledger')}</strong>
          <small>{w(`摘抄 ${clipped.length}`, `${clipped.length} copied`)}</small>
        </span>
      </button>

      {book !== null && (
        <Ledger game={game} setGame={setGame} page={book} setPage={setBook} onClose={() => setBook(null)} />
      )}
    </div>
  )
}
