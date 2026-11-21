import { useEffect, useRef, useState } from 'react'
import { useWords } from '../hooks'
import { homePainting } from '../grounds'
import { loadPainting } from '../paint/images'
import { paint } from '../paint/bus'
import { lightAt, localHour } from '../daylight'
import { holdScroll } from '../motion'
import { finishOpening } from './opening'

/** The painting is never laid faster than this, however quick the network. */
const MIN_MS = 2600
/** The engine's brush catches up with the progress in about this long after the last task. */
const SETTLE_MS = 900

/**
 * The loading screen is the painting being made. Real progress (the painting, the fonts, the
 * pages behind the home page) sets how much of it is laid on the paper; when it is all there,
 * the counter goes and the sea comes alive under the name. Escape or a click finishes at once.
 */
export default function Opening() {
  const w = useWords()
  const [shown, setShown] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const finished = useRef(false)
  useEffect(() => {
    holdScroll(true)
    const start = performance.now()
    const paper = lightAt(localHour()).paper
    let ready = 0,
      raf = 0,
      timer = 0
    const { src, relief } = homePainting()
    const tasks: Promise<unknown>[] = [
      loadPainting(src),
      loadPainting(relief),
      document.fonts?.ready ?? Promise.resolve(),
      import('../pages/Projects'),
      import('../pages/Blog'),
      import('../pages/Film'),
      import('../pages/About'),
      import('../paint/engine'),
    ]
    tasks.forEach((task) => void task.catch(() => undefined).then(() => void ready++))
    paint('home', { type: 'reveal', value: 0, at: 0, paper })
    const finish = () => {
      if (finished.current) return
      finished.current = true
      cancelAnimationFrame(raf)
      paint('home', { type: 'reveal', value: 1 })
      setShown(100)
      setLeaving(true)
      holdScroll(false)
      timer = window.setTimeout(finishOpening, 650)
    }
    const tick = () => {
      const loaded = ready / tasks.length,
        time = Math.min(1, (performance.now() - start) / MIN_MS)
      const progress = Math.min(loaded, time)
      paint('home', { type: 'reveal', value: progress, paper })
      setShown(Math.round(progress * 100))
      if (progress >= 1) {
        timer = window.setTimeout(finish, SETTLE_MS)
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    const skip = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        paint('home', { type: 'reveal', value: 1, at: 1 })
        finish()
      }
    }
    addEventListener('keydown', skip)
    // a stalled request must not keep the visitor on the paper
    const cap = window.setTimeout(finish, 9000)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timer)
      clearTimeout(cap)
      removeEventListener('keydown', skip)
      holdScroll(false)
      if (!finished.current) paint('home', { type: 'reveal', value: 1, at: 1 })
    }
  }, [])
  return (
    <div
      className="a-opening"
      data-leaving={leaving ? '' : undefined}
      onClick={() => {
        paint('home', { type: 'reveal', value: 1, at: 1 })
        setShown(100)
        setLeaving(true)
        holdScroll(false)
        if (!finished.current) {
          finished.current = true
          window.setTimeout(finishOpening, 450)
        }
      }}
      role="status"
      aria-label={w('正在加载', 'Loading')}
    >
      <span className="a-opening-count" aria-hidden="true">{String(shown).padStart(3, '0')}</span>
      <span className="a-opening-bar" style={{ transform: `scaleX(${shown / 100})` }} aria-hidden="true" />
      <span className="a-opening-skip">{w('点击或按 Esc 跳过', 'Click or press Esc to skip')}</span>
    </div>
  )
}
