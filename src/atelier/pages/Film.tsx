import { useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useWords } from '../hooks'
import { Art } from '../components/Primitives'
import { Canister } from '../components/Canister'
import { frameById, heroFrame, rolls } from '../film'

/** The dim painting the collection is laid out over. */
const backdrop = frameById('first-roll/02') ?? heroFrame

/**
 * The collection: every roll as its canister, newest first. Choosing one
 * pulls its film out into a strip of frames; any frame opens the viewer.
 */
export default function Film() {
  const w = useWords()
  const [params, setParams] = useSearchParams()
  const open = rolls.find((r) => r.id === params.get('roll'))
  const strip = useRef<HTMLElement>(null)
  useEffect(() => {
    if (open) strip.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [open])
  const choose = (id: string) =>
    setParams(open?.id === id ? {} : { roll: id }, { replace: true, preventScrollReset: true })
  const details = open
    ? [open.place && w(open.place.zh, open.place.en), open.stock, open.camera].filter(Boolean)
    : []
  return (
    <div className="a-film">
      <div className="a-film-backdrop" aria-hidden="true">
        <Art frame={backdrop} still />
      </div>
      <header className="a-film-head">
        <h1>{w('胶片', 'Film')}</h1>
        <p>
          {w(
            '我用胶片拍下的东西，一卷一卷放进来。选一卷，把胶片拉出来；点开任何一格看原片，也可以看它被画成油画的样子。',
            'What I have caught on film, added a roll at a time. Pick a roll to pull its film out; open any frame to see it as shot, or repainted in oils.',
          )}
        </p>
      </header>
      <ul className="a-shelf" aria-label={w('胶卷', 'Rolls')}>
        {rolls.map((roll) => (
          <li key={roll.id}>
            <button
              type="button"
              aria-expanded={open?.id === roll.id}
              aria-controls="a-roll-open"
              onClick={() => choose(roll.id)}
            >
              {roll.canister ? (
                <img
                  className="a-canister a-canister-photo"
                  src={roll.canister}
                  alt=""
                  data-open={open?.id === roll.id ? '' : undefined}
                  draggable={false}
                />
              ) : (
                <Canister
                  stock={roll.stock}
                  tape={roll.date ?? w(roll.title.zh, roll.title.en)}
                  open={open?.id === roll.id}
                />
              )}
              <span className="a-shelf-title">{w(roll.title.zh, roll.title.en)}</span>
              <span className="a-shelf-count">
                {roll.frames.length} {w('格', roll.frames.length === 1 ? 'frame' : 'frames')}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {open && (
        <section className="a-roll" id="a-roll-open" ref={strip} key={open.id} aria-labelledby="a-roll-title">
          <header>
            <span className="a-edge-print">{open.date ?? '—'}</span>
            <h2 id="a-roll-title">{w(open.title.zh, open.title.en)}</h2>
            {details.length > 0 && <p>{details.join(' · ')}</p>}
          </header>
          {open.note && <p className="a-roll-note">{w(open.note.zh, open.note.en)}</p>}
          <ol className="a-roll-strip">
            {open.frames.map((frame, i) => (
              <li key={frame.id} style={{ animationDelay: `${i * 60}ms` }}>
                <Link to={`/film/${open.id}/${frame.name}`} aria-label={w(frame.alt.zh, frame.alt.en)}>
                  <img src={frame.src} alt="" loading="lazy" draggable={false} />
                </Link>
                <span className="a-edge-print" aria-hidden="true">
                  ▸ {String(i + 1).padStart(2, '0')}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  )
}
