import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useWords } from '../hooks'
import { heroFrame } from '../film'
import { caption, dayTour, lightAt, type Weather } from '../weather'
import type { OvertureHandle } from '../paint/overture'
import { onReplay } from './overtureCue'

const SEEN = 'tdwhere:overture'
/** How long each part of the day stays up before the next. */
const BEAT_MS = 1000

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
 * A block of water on paper under the visitor's own sky. Before it rests
 * there, the light walks the day: night, dawn, morning, noon, afternoon,
 * evening, then back to the hour it actually is. The date still picks the
 * weather, so a rainy day stays rainy through every hour. Shown once per
 * session when a visit begins on the home page. Touching the water rings
 * it; the line beneath lets the visitor in, sinking into the water onto
 * the home painting. Escape skips straight to the page. The home page can
 * ask for the day again.
 */
export default function Overture() {
  const w = useWords()
  const { pathname } = useLocation()
  const [stage, setStage] = useState<'rest' | 'enter' | 'leave' | 'gone'>(() =>
    shouldPlay(pathname) ? 'rest' : 'gone',
  )
  const [sky, setSky] = useState<Weather>(() => dayTour(new Date())[0])
  const [run, setRun] = useState(0)
  // asked for again from the home page: the day, from night
  useEffect(
    () =>
      onReplay(() => {
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
        setSky(dayTour(new Date())[0])
        setRun((n) => n + 1)
        setStage((s) => (s === 'gone' ? 'rest' : s))
      }),
    [],
  )
  const canvas = useRef<HTMLCanvasElement>(null),
    handle = useRef<OvertureHandle | undefined>(undefined),
    stopTour = useRef<() => void>(() => {})
  // stays mounted through the fade, so the last frame holds while it leaves
  const shown = stage !== 'gone'
  useEffect(() => {
    if (!shown || !canvas.current) return
    try {
      sessionStorage.setItem(SEEN, '1')
    } catch {
      /* still play; it just may repeat */
    }
    const html = document.documentElement,
      overflow = html.style.overflow
    html.style.overflow = 'hidden'
    let cancelled = false
    let touring = true
    const leave = () => setStage((s) => (s === 'gone' ? s : 'leave'))
    const beats = dayTour(new Date())
    setSky(beats[0])
    let timer = 0
    const stop = () => {
      touring = false
      window.clearTimeout(timer)
    }
    stopTour.current = stop
    Promise.all([import('../paint/overture'), import('../paint/painter'), import('../paint/presets')])
      .then(async ([{ mountOverture }, painter, { parseObjectPosition }]) => {
        await painter.loadFrame(heroFrame)
        if (cancelled || !canvas.current) return
        handle.current = mountOverture({
          canvas: canvas.current,
          weather: beats[0],
          light: lightAt(beats[0]),
          painting: () => painter.paintedFrame(heroFrame),
          focus: parseObjectPosition(heroFrame.focus),
          onDone: leave,
        })
        let i = 1
        const next = () => {
          if (cancelled || !touring || i >= beats.length) return
          const weather = beats[i++]
          handle.current?.blendTo(weather, lightAt(weather))
          setSky(weather)
          timer = window.setTimeout(next, BEAT_MS)
        }
        if (touring) timer = window.setTimeout(next, BEAT_MS)
      })
      .catch(() => setStage('gone'))
    const onPointer = (e: PointerEvent) => handle.current?.touch(e.clientX, e.clientY)
    const onMove = (e: PointerEvent) => handle.current?.stir(e.clientX, e.clientY)
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      stop()
      leave()
    }
    addEventListener('pointerdown', onPointer)
    addEventListener('pointermove', onMove, { passive: true })
    addEventListener('keydown', onKey)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
      removeEventListener('pointerdown', onPointer)
      removeEventListener('pointermove', onMove)
      removeEventListener('keydown', onKey)
      html.style.overflow = overflow
      stopTour.current = () => {}
      handle.current?.destroy()
    }
  }, [shown, run])
  useEffect(() => {
    if (stage !== 'leave') return
    const timer = setTimeout(() => setStage('gone'), 900)
    return () => clearTimeout(timer)
  }, [stage])
  if (stage === 'gone') return null
  const enter = () => {
    stopTour.current()
    handle.current?.enter()
    setStage((s) => (s === 'rest' ? 'enter' : s))
  }
  const [zh, en] = caption(sky)
  const p = lightAt(sky).paper
  return (
    <div
      className="a-overture"
      data-stage={stage}
      data-dark={p[0] * 0.3 + p[1] * 0.6 + p[2] * 0.1 < 0.5 ? '' : undefined}
      style={{ background: css(p) }}
    >
      <canvas ref={canvas} aria-hidden="true" />
      <div className="a-overture-foot">
        <p>{w(zh, en)}</p>
        <button type="button" onClick={enter} disabled={stage !== 'rest'} autoFocus>
          {w('点击进入', 'Enter')}
        </button>
        <small>{w('Esc 跳过', 'Esc to skip')}</small>
      </div>
    </div>
  )
}
