import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, Pause, Play, RotateCcw } from 'lucide-react'
import { useWords } from '../hooks'
import { scenes, type Line, type Scene, type Words } from './duelScenes'

const GAP = 1100

type Timed = Line & { at: number }
/** Lays a side's lines on the clock, each `gap` after the one before. */
function clock(lines: Line[]): Timed[] {
  let t = 0
  return lines.map((l) => ({ ...l, at: (t += l.gap ?? GAP) }))
}
function timing(scene: Scene) {
  const left = clock(scene.without),
    right = clock(scene.withIt)
  const told = (right.find((l) => l.reveal)?.at ?? right[right.length - 1].at) + 600
  const end = Math.max(left[left.length - 1].at, right[right.length - 1].at) + 900
  return { left, right, told, end }
}

function Pane({
  title,
  prompt,
  lines,
  t,
  later,
}: {
  title: Words
  prompt: Words
  lines: Timed[]
  t: number
  later?: Words
}) {
  const w = useWords()
  const say = (x: Words | string) => (typeof x === 'string' ? x : w(...x))
  const body = useRef<HTMLDivElement>(null)
  const shown = lines.filter((l) => l.at <= t)
  const busy = shown.length < lines.length
  useEffect(() => {
    const el = body.current
    if (el) el.scrollTop = el.scrollHeight
  }, [shown.length, later])
  return (
    <figure className="a-term">
      <figcaption>
        <span aria-hidden="true">~/project</span>
        {w(...title)}
      </figcaption>
      <div className="a-term-body" ref={body}>
        <p className="a-term-prompt">
          <span aria-hidden="true">&gt;</span>
          {w(...prompt)}
        </p>
        {shown.map((l, i) => (
          <div key={i} className="a-term-line" data-kind={l.kind}>
            {l.tag && <span className="a-term-tag">{l.tag}</span>}
            <p>{say(l.text)}</p>
            {l.out && <p className="a-term-out">{say(l.out)}</p>}
          </div>
        ))}
        {busy && t > 0 && (
          <p className="a-term-busy" aria-hidden="true">
            ✻ {w('工作中', 'Working')} · {(t / 1000).toFixed(0)}s
          </p>
        )}
        {later && (
          <div className="a-term-after" role="note">
            <strong>{w('后来', 'Later')}</strong>
            {w(...later)}
          </div>
        )}
      </div>
    </figure>
  )
}

/**
 * One request in two terminals on one clock: left without do-it, right with
 * it. Plays once in view; scenes switch from the tabs; pausable, replayable,
 * and laid out whole for reduced motion.
 */
export default function Duel() {
  const w = useWords()
  const root = useRef<HTMLDivElement>(null)
  const still = useMemo(
    () => matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window),
    [],
  )
  const [at, setAt] = useState(0)
  const scene = scenes[at],
    time = useMemo(() => timing(scene), [scene])
  const [t, setT] = useState(() => (still ? Infinity : 0)),
    [playing, setPlaying] = useState(false)
  const done = t >= time.end,
    running = playing && !done
  useEffect(() => {
    const el = root.current
    if (!el || still) return
    const seen = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPlaying(true)
          seen.disconnect()
        }
      },
      { threshold: 0.35 },
    )
    seen.observe(el)
    return () => seen.disconnect()
  }, [still])
  useEffect(() => {
    if (!running) return
    let last = performance.now(),
      frame = 0
    const tick = (now: number) => {
      const step = now - last
      last = now
      setT((v) => v + step)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [running])
  const open = (i: number) => {
    setAt(i)
    setT(still ? Infinity : 0)
    setPlaying(!still)
  }
  const toggle = () => {
    if (done) open(at)
    else setPlaying((p) => !p)
  }
  const next = (at + 1) % scenes.length
  return (
    <div className="a-duel" ref={root}>
      <div className="a-duel-scenes" role="group" aria-label={w('场景', 'Scenes')}>
        {scenes.map((s, i) => (
          <button key={s.id} type="button" aria-pressed={i === at} onClick={() => open(i)}>
            <span>{String(i + 1).padStart(2, '0')}</span>
            {w(...s.title)}
          </button>
        ))}
      </div>
      <div className="a-duel-panes" key={scene.id}>
        <Pane
          title={['没装 do-it', 'Without do-it']}
          prompt={scene.prompt}
          lines={time.left}
          t={t}
          later={t >= time.told ? scene.later : undefined}
        />
        <Pane title={['装了 do-it', 'With do-it']} prompt={scene.prompt} lines={time.right} t={t} />
      </div>
      <div className="a-duel-bar">
        <button type="button" onClick={toggle}>
          {done ? (
            <RotateCcw size={15} aria-hidden="true" />
          ) : running ? (
            <Pause size={15} aria-hidden="true" />
          ) : (
            <Play size={15} aria-hidden="true" />
          )}
          {done ? w('重播', 'Replay') : running ? w('暂停', 'Pause') : w('播放', 'Play')}
        </button>
        <div className="a-duel-track" aria-hidden="true">
          <span style={{ width: `${Math.min(1, t / time.end) * 100}%` }} />
        </div>
        {done ? (
          <button type="button" className="a-duel-next" onClick={() => open(next)}>
            {w('下一个：', 'Next: ')}
            {w(...scenes[next].title)}
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        ) : (
          <span />
        )}
        <p>
          {w(...scene.source)}
          {w(
            '。是示意，不是评测结果；不装 do-it 也常常做对，左边是一种常见的结局，不是每一次。',
            '. An illustration, not a benchmark: without do-it an agent often gets this right; the left is a common ending, not every ending.',
          )}
        </p>
      </div>
    </div>
  )
}
