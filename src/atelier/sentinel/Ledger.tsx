import { useEffect, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useLang } from '@/context/LangContext'
import { useNarrow, useWords } from '../hooks'
import { clips, copied, mark, timeline, type Mark, type State, type Words } from './story'

/** One thing written on a page, and roughly how many ruled lines it takes. */
/** A heading never ends a page: it moves on with the entry after it. */
type Entry = { key: string; lines: number; node: ReactNode; heading?: boolean }
const LINES = 15
const measure = (text: string, zh: boolean) => Math.max(1, Math.ceil(text.length / (zh ? 21 : 44)))

/**
 * The reviewer's ledger, opened as a book: rule twelve inside the cover, a
 * timeline that fills itself in, and the sentences copied by hand, each
 * marked trustworthy or doubtful. Two pages to a spread, one on a phone.
 */
export default function Ledger({
  game,
  setGame,
  page,
  setPage,
  onClose,
}: {
  game: State
  setGame: Dispatch<SetStateAction<State>>
  /** may run past the end: the book opens at its last written page */
  page: number
  setPage: (n: number) => void
  onClose: () => void
}) {
  const w = useWords()
  const zh = useLang().lang === 'zh'
  const narrow = useNarrow()
  const say = (x: Words) => (zh ? x[0] : x[1])
  const toggle = (id: string, m: Mark) => setGame((g) => mark(g, id, g.marks[id] === m ? null : m))

  const entries: Entry[] = [
    { key: 'h-time', lines: 2, heading: true, node: <h3>{w('时间线', 'Timeline')}</h3> },
    ...timeline(game).map((t, i) => ({
      key: `t${i}`,
      lines: measure(say(t.text), zh) + (say(t.time).length > 6 ? 1 : 0),
      node: (
        <p className="a-ledger-time">
          <span>{say(t.time)}</span>
          {say(t.text)}
        </p>
      ),
    })),
    { key: 'h-clips', lines: 3, heading: true, node: <h3>{w('摘抄', 'Copied out')}</h3> },
    ...(copied(game).length
      ? copied(game).map((id) => {
          const c = clips[id],
            m = game.marks[id]
          return {
            key: id,
            lines: measure(say(c.text), zh) + 2,
            node: (
              <div className="a-ledger-clip" data-mark={m}>
                <small>{say(c.from)}</small>
                <p>{say(c.text)}</p>
                <span className="a-ledger-marks">
                  <button type="button" aria-pressed={m === 'trust'} onClick={() => toggle(id, 'trust')}>
                    {w('可信', 'Trust')}
                  </button>
                  <button type="button" aria-pressed={m === 'doubt'} onClick={() => toggle(id, 'doubt')}>
                    {w('存疑', 'Doubt')}
                  </button>
                </span>
              </div>
            ),
          }
        })
      : [{ key: 'none', lines: 2, node: <p className="a-ledger-empty">{w('还没有抄下任何东西。', 'Nothing copied out yet.')}</p> }]),
  ]
  const pages: Entry[][] = [[]]
  let used = 0
  entries.forEach((e, i) => {
    const need = e.lines + (e.heading ? (entries[i + 1]?.lines ?? 0) : 0)
    if (used + need > LINES && pages[pages.length - 1].length) {
      pages.push([])
      used = 0
    }
    pages[pages.length - 1].push(e)
    used += e.lines
  })

  // Page 0 is the inside cover; the written pages follow it.
  const count = pages.length + 1,
    step = narrow ? 1 : 2
  const at = Math.min(page, count - 1),
    first = at - (at % step)
  const turn = (d: number) => setPage(Math.max(0, Math.min(count - 1, first + d * step)))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const d = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0
      if (!d) return
      e.preventDefault()
      setPage(Math.max(0, Math.min(count - 1, first + d * step)))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [count, first, step, setPage])

  const sheet = (n: number) =>
    n === 0 ? (
      <section key="cover" className="a-ledger-page is-cover">
        <h2>{w('账本', 'Ledger')}</h2>
        <p className="a-ledger-owner">{w('审查员　十月十一日夜', 'Reviewer · night of 11 October')}</p>
        <div className="a-ledger-rule">
          <small>{w('委员会规程　第十二条', 'Committee rules · twelve')}</small>
          <p>{w('正式记录所引内容，须经审查员亲手抄录，并认定可信。', 'An official record may cite only what the reviewer has copied by hand and judged trustworthy.')}</p>
        </div>
        <p className="a-ledger-hint">
          {w('读到能抄的句子，点它旁边的“抄”。抄下来的，在这里标可信或存疑。', 'Where a sentence can be copied, press “copy” beside it. Mark what you copy here, trusted or doubtful.')}
        </p>
        <span className="a-ledger-n">i</span>
      </section>
    ) : n < count ? (
      <section key={n} className="a-ledger-page">
        {pages[n - 1].map((e) => (
          <div key={e.key}>{e.node}</div>
        ))}
        <span className="a-ledger-n">{n}</span>
      </section>
    ) : (
      <section key="blank" className="a-ledger-page is-blank" aria-hidden="true" />
    )

  return (
    <div className="a-ledger" role="dialog" aria-modal="true" aria-label={w('账本', 'Ledger')} onClick={onClose}>
      <div className="a-ledger-book" onClick={(e) => e.stopPropagation()}>
        <div className="a-ledger-spread" data-single={narrow ? '' : undefined}>
          {sheet(first)}
          {!narrow && sheet(first + 1)}
        </div>
        <nav className="a-ledger-nav">
          <button type="button" onClick={() => turn(-1)} disabled={first === 0}>
            <ArrowLeft size={14} aria-hidden="true" />
            {w('上一页', 'Back')}
          </button>
          <span>
            {first ? first : 'i'}
            {!narrow && first + 1 < count ? `–${first + 1}` : ''} / {count - 1}
          </span>
          <button type="button" onClick={() => turn(1)} disabled={first + step >= count}>
            {w('下一页', 'Next')}
            <ArrowRight size={14} aria-hidden="true" />
          </button>
          <button type="button" className="a-ledger-close" onClick={onClose}>
            {w('合上', 'Close')}
          </button>
        </nav>
      </div>
    </div>
  )
}
