import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useWords } from '../hooks'

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

/**
 * Rain on painted water around a small square opening, shown once per
 * session when a visit begins on the home page. The rain falls quietly for
 * as long as the visitor waits; a touch, a key or a scroll lets it fall in,
 * and the opening widens onto the painting. Escape skips straight to the page.
 */
export default function Overture() {
  const w = useWords()
  const { pathname } = useLocation()
  const [stage, setStage] = useState<'rest' | 'enter' | 'leave' | 'gone'>(() =>
    shouldPlay(pathname) ? 'rest' : 'gone',
  )
  const canvas = useRef<HTMLCanvasElement>(null)
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
    let handle: { enter(x?: number, y?: number): void; destroy(): void } | undefined,
      cancelled = false
    const leave = () => setStage((s) => (s === 'gone' ? s : 'leave'))
    Promise.all([import('../paint/overture'), import('../paint/painter')])
      .then(([{ mountOverture }, painter]) => {
        if (cancelled || !canvas.current) return
        const portrait = matchMedia('(max-width: 850px)').matches
        handle = mountOverture({
          canvas: canvas.current,
          onDone: leave,
          water: painter.paintedWater(portrait),
          painting: () => painter.paintedSource('pond', portrait),
        })
      })
      .catch(() => setStage('gone'))
    const enter = (x?: number, y?: number) => {
      handle?.enter(x, y)
      setStage((s) => (s === 'rest' ? 'enter' : s))
    }
    const onPointer = (e: PointerEvent) => enter(e.clientX, e.clientY)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') leave()
      else if (!e.metaKey && !e.ctrlKey && !e.altKey) enter()
    }
    const onWheel = () => enter()
    addEventListener('pointerdown', onPointer)
    addEventListener('keydown', onKey)
    addEventListener('wheel', onWheel, { passive: true })
    addEventListener('touchmove', onWheel, { passive: true })
    return () => {
      cancelled = true
      removeEventListener('pointerdown', onPointer)
      removeEventListener('keydown', onKey)
      removeEventListener('wheel', onWheel)
      removeEventListener('touchmove', onWheel)
      html.style.overflow = overflow
      handle?.destroy()
    }
  }, [shown])
  useEffect(() => {
    if (stage !== 'leave') return
    const timer = setTimeout(() => setStage('gone'), 900)
    return () => clearTimeout(timer)
  }, [stage])
  if (stage === 'gone') return null
  return (
    <div className="a-overture" data-stage={stage} aria-hidden="true">
      <canvas ref={canvas} />
      <p>
        <span>{w('雨正在下。', 'It is raining.')}</span>
        {w('轻触，让雨落进那个口子', 'Touch to let the rain fall in')}
        <small>{w('Esc 跳过', 'Esc to skip')}</small>
      </p>
    </div>
  )
}
