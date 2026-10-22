import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useWords } from '../hooks'
import { heroFrame } from '../film'
import { caption, lightAt, weatherAt } from '../weather'
import type { OvertureHandle } from '../paint/overture'
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
 * A block of water on paper under the visitor's own sky: the hour sets the
 * light, the date picks the weather. Shown once per session when a visit
 * begins on the home page. Touching the water rings it; the line beneath
 * lets the visitor in, sinking into the water onto the home painting.
 * Escape skips straight to the page. The home page can ask for it again.
 */
export default function Overture() {
  const w = useWords()
  const { pathname } = useLocation()
  const [stage, setStage] = useState<'rest' | 'enter' | 'leave' | 'gone'>(() =>
    shouldPlay(pathname) ? 'rest' : 'gone',
  )
  const now = () => {
    const weather = weatherAt(new Date())
    return { weather, light: lightAt(weather) }
  }
  const [sky, setSky] = useState(now)
  // asked for again from the home page: under the sky as it is now
  useEffect(
    () =>
      onReplay(() => {
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
        setSky(now())
        setStage((s) => (s === 'gone' ? 'rest' : s))
      }),
    [],
  )
  const canvas = useRef<HTMLCanvasElement>(null),
    handle = useRef<OvertureHandle | undefined>(undefined),
    enterRequested = useRef(false)
  // stays mounted through the fade, so the last frame holds while it leaves
  const shown = stage !== 'gone'
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
    const html = document.documentElement,
      overflow = html.style.overflow
    html.style.overflow = 'hidden'
    let cancelled = false
    const leave = () => setStage((s) => (s === 'gone' ? s : 'leave'))
    Promise.all([import('../paint/overture'), import('../paint/painter'), import('../paint/presets')])
      .then(async ([{ mountOverture }, painter, { parseObjectPosition }]) => {
        await painter.loadFrame(heroFrame)
        if (cancelled || !canvas.current) return
        handle.current = mountOverture({
          canvas: canvas.current,
          weather: sky.weather,
          light: sky.light,
          painting: () => painter.paintedFrame(heroFrame),
          focus: parseObjectPosition(heroFrame.focus),
          onDone: leave,
        })
        if (enterRequested.current) handle.current.enter()
      })
      .catch(() => {
        if (!cancelled) setStage('gone')
      })
    const onPointer = (e: PointerEvent) => handle.current?.touch(e.clientX, e.clientY)
    const onMove = (e: PointerEvent) => handle.current?.stir(e.clientX, e.clientY)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') leave()
    }
    addEventListener('pointerdown', onPointer)
    addEventListener('pointermove', onMove, { passive: true })
    addEventListener('keydown', onKey)
    return () => {
      cancelled = true
      removeEventListener('pointerdown', onPointer)
      removeEventListener('pointermove', onMove)
      removeEventListener('keydown', onKey)
      html.style.overflow = overflow
      handle.current?.destroy()
      handle.current = undefined
    }
  }, [shown, sky])
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
  const [zh, en] = caption(sky.weather)
  const p = sky.light.paper
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
