import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useWords } from '../hooks'
import { heroFrame } from '../grounds'
import homePainting from '@/assets/ground/home-painted.webp'
import { caption, lightAt, sessionClock, weatherNow } from '../weather'
import type { OvertureHandle, PondFeedback } from '../paint/overture'
import { onReplay } from './overtureCue'
import { paint } from '../paint/bus'

const SEEN = 'tdwhere:overture'

function shouldPlay(pathname: string) {
  if (pathname !== '/') return false
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  try {
    return !sessionStorage.getItem(SEEN)
  } catch {
    return false
  }
}

const css = (c: [number, number, number]) => `rgb(${c.map((v) => Math.round(v * 255)).join(' ')})`

/**
 * A block of water on paper under the island's own sky: its clock starts at
 * the visitor's hour and season and runs a day in twenty minutes, the weather
 * turning every few island hours. Shown once per session when a visit begins
 * on the home page. Touching the water rings it; the line beneath
 * lets the visitor in, sinking into the water onto the home painting.
 * Escape skips straight to the page. The home page can ask for it again.
 */
export default function Overture() {
  const w = useWords()
  const overlay = useRef<HTMLDivElement>(null)
  const enterButton = useRef<HTMLButtonElement>(null)
  const [ready, setReady] = useState(false)
  const [running, setRunning] = useState(true)
  const [feedback, setFeedback] = useState<PondFeedback | null>(null)
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const { pathname } = useLocation()
  const [stage, setStage] = useState<'rest' | 'enter' | 'leave' | 'gone'>(() =>
    shouldPlay(pathname) ? 'rest' : 'gone',
  )
  const [weather, setWeather] = useState(() => weatherNow(sessionClock()))
  // asked for again from the home page: the island has gone on meanwhile
  useEffect(
    () =>
      onReplay(() => {
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
        setStage((s) => (s === 'gone' ? 'rest' : s))
      }),
    [],
  )
  const canvas = useRef<HTMLCanvasElement>(null),
    handle = useRef<OvertureHandle | undefined>(undefined),
    enterRequested = useRef(false)
  // stays mounted through the fade, so the last frame holds while it leaves
  const shown = stage !== 'gone'
  // the line beneath keeps up with the island's hour and weather
  useEffect(() => {
    if (!shown) return
    const tick = () => setWeather(weatherNow(sessionClock()))
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [shown])
  // The overture draws its own home image while entering. Resume the actual
  // home canvas before the overlay fades, not while it is fully occluded.
  const covered = stage === 'rest' || stage === 'enter'
  useEffect(() => {
    paint('home', { type: 'suspend', value: covered })
    return () => paint('home', { type: 'suspend', value: false })
  }, [covered])
  useEffect(() => {
    if (!shown) {
      enterRequested.current = false
      return
    }
    if (!canvas.current) return
    try {
      sessionStorage.setItem(SEEN, '1')
    } catch {
      /* still play; it just may repeat */
    }
    setReady(false)
    setRunning(true)
    setFeedback(null)
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const siblings = Array.from(overlay.current?.parentElement?.children ?? []).filter((el): el is HTMLElement => el instanceof HTMLElement && el !== overlay.current)
    const inert = siblings.map(el => el.inert)
    siblings.forEach(el => { el.inert = true })
    enterButton.current?.focus()
    const html = document.documentElement,
      overflow = html.style.overflow
    html.style.overflow = 'hidden'
    let cancelled = false
    const leave = () => setStage((s) => (s === 'gone' ? s : 'leave'))
    Promise.all([import('../paint/overture'), import('../paint/images'), import('../paint/presets'), import('../paint/island/models')])
      .then(async ([{ mountOverture }, { loadPainting }, { parseObjectPosition }, { loadIslandModels, disposeModelResources }]) => {
        if (cancelled || !canvas.current) return
        // Neither model fetch waits for the photograph/painting to decode.
        const [painting, models] = await Promise.all([
          loadPainting(homePainting).catch(() => null), loadIslandModels(),
        ])
        if (cancelled || !canvas.current || !painting) {
          disposeModelResources(models.coot, models.aerator)
          if (!cancelled && !painting) setStage('gone')
          return
        }
        try {
          handle.current = mountOverture({
            models,
            canvas: canvas.current,
            clock: sessionClock(),
            painting: () => painting,
            onReady: () => { if (!cancelled) setReady(true) },
            focus: parseObjectPosition(heroFrame.focus),
            onDone: leave,
            onFeedback: (value) => {
              setFeedback(value)
              if (value === 'running' || value === 'stopped') setRunning(value === 'running')
              clearTimeout(feedbackTimer.current)
              feedbackTimer.current = setTimeout(() => setFeedback(null), 3200)
            },
          })
        } catch (error) {
          disposeModelResources(models.coot, models.aerator)
          throw error
        }
        if (enterRequested.current) handle.current.enter()
      })
      .catch(() => {
        if (!cancelled) setStage('gone')
      })
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') leave()
      if (e.key === 'Tab') {
        const buttons = Array.from(overlay.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])
        const first = buttons[0], last = buttons[buttons.length - 1]
        if (!first) { e.preventDefault(); return }
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    addEventListener('keydown', onKey)
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    const onReduced = () => { if (reduced.matches) setStage('gone') }
    reduced.addEventListener('change', onReduced)
    return () => {
      cancelled = true
      removeEventListener('keydown', onKey)
      reduced.removeEventListener('change', onReduced)
      clearTimeout(feedbackTimer.current)
      siblings.forEach((el, i) => { el.inert = inert[i] })
      if (previousFocus?.isConnected) previousFocus.focus()
      html.style.overflow = overflow
      handle.current?.destroy()
      handle.current = undefined
    }
  }, [shown])
  useEffect(() => {
    if (stage !== 'leave') return
    const timer = setTimeout(() => setStage('gone'), 900)
    return () => clearTimeout(timer)
  }, [stage])
  if (stage === 'gone') return null
  const enter = () => {
    enterRequested.current = true
    handle.current?.enter()
    setStage((s) => (s === 'rest' ? 'enter' : s))
  }
  const [zh, en] = caption(weather)
  const p = lightAt(weather).paper
  return (
    <div
      ref={overlay}
      className="a-overture"
      role="dialog"
      aria-modal="true"
      aria-label={w('水边', 'By the water')}
      data-stage={stage}
      data-dark={p[0] * 0.3 + p[1] * 0.6 + p[2] * 0.1 < 0.5 ? '' : undefined}
      style={{ background: css(p) }}
    >
      <canvas ref={canvas} aria-hidden="true" />
      <div className="a-pond-keyboard" role="group" aria-label={w('水边互动', 'Pond interactions')}>
          <button type="button" disabled={!ready || stage !== 'rest'} onClick={() => handle.current?.interact('bird')}>{w('与骨顶鸡打个招呼', 'Greet a coot')}</button>
          <button type="button" disabled={!ready || stage !== 'rest'} onClick={() => handle.current?.interact('water')}>{w('轻点水面', 'Touch the water')}</button>
          <button type="button" disabled={!ready || stage !== 'rest'} aria-pressed={running} onClick={() => handle.current?.interact('machine')}>{w('增氧机', 'Aerator')} · {running ? w('开', 'on') : w('关', 'off')}</button>
        <p className="a-pond-feedback" role="status" aria-live="polite" aria-atomic="true">{feedback === 'greet' ? w('看了一眼，慢慢游开。', 'A glance, then a gentle turn away.') : feedback === 'leave' ? w('从浮筒回到水里。', 'Back into the water from the pontoon.') : feedback === 'water' ? w('涟漪从这里散开。', 'Ripples spread from here.') : feedback === 'running' ? w('水轮重新转起来了。', 'The paddlewheels are turning again.') : feedback === 'stopped' ? w('水轮慢慢停下，水面也静下来。', 'The wheels slow down; the water settles.') : ''}</p>
      </div>
      <div className="a-overture-foot">
        <p>{w(zh, en)}</p>
        <button type="button" onClick={enter} disabled={stage !== 'rest'} ref={enterButton}>
          {w('点击进入', 'Enter')}
        </button>
        <small>{w('Esc 跳过', 'Esc to skip')}</small>
      </div>
    </div>
  )
}
