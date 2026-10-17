import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { useQuiet } from '../hooks'
import { createStage, type Stage } from './stage'

const keyName = (e: KeyboardEvent) =>
  e.key === ' ' ? 'space' : e.key === 'Enter' ? 'enter' : e.key === 'Backspace' ? 'back' : e.key.toLowerCase()

/**
 * The painted machine on its own: the 3D model through the oil pass, with
 * `children` mapped onto its glass. The keyboard on the model follows real
 * keys while focus is inside it, or always with `keys="window"`. Without
 * WebGL2 the glass stands alone in a plain frame.
 */
export default function MachineStage({
  powered,
  onPowerKey,
  near,
  keys = 'focus',
  onVisible,
  children,
}: {
  powered: boolean
  onPowerKey: () => void
  near?: number
  keys?: 'focus' | 'window'
  onVisible?: (visible: boolean) => void
  children: ReactNode
}) {
  const quiet = useQuiet()
  const root = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const overlay = useRef<HTMLDivElement>(null)
  const stage = useRef<Stage | null>(null)
  const visible = useRef(onVisible)
  const [flat, setFlat] = useState(() => typeof WebGL2RenderingContext === 'undefined')
  const [overPower, setOverPower] = useState(false)

  useEffect(() => {
    visible.current = onVisible
  })

  useEffect(() => {
    const el = root.current,
      cv = canvas.current,
      ov = overlay.current
    if (!el || !cv || !ov) return
    let s: Stage
    try {
      s = createStage(cv, ov, quiet, near)
    } catch {
      queueMicrotask(() => setFlat(true))
      return
    }
    stage.current = s
    const ro = new ResizeObserver(([entry]) => s.resize(entry.contentRect.width, entry.contentRect.height))
    ro.observe(el)
    const io = new IntersectionObserver(([entry]) => {
      s.setVisible(entry.isIntersecting)
      visible.current?.(entry.isIntersecting)
    })
    io.observe(el)
    const onKey = (e: KeyboardEvent) => {
      if (keys === 'window' || el.contains(document.activeElement)) s.pressKey(keyName(e), e.type === 'keydown')
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('keyup', onKey)
    return () => {
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('keyup', onKey)
      s.dispose()
      stage.current = null
    }
  }, [quiet, near, keys])

  useEffect(() => {
    stage.current?.setPowered(powered)
  }, [powered, flat])

  const local = (e: ReactMouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top, r }
  }
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = stage.current
    if (!s) return
    const { x, y, r } = local(e)
    if (e.pointerType === 'mouse') s.point((x / r.width) * 2 - 1, (y / r.height) * 2 - 1)
    setOverPower(e.target === canvas.current && s.hitsPower(x, y))
  }

  return (
    <div
      ref={root}
      className="a-machine-stage"
      data-flat={flat ? '' : undefined}
      onPointerMove={onMove}
      onPointerLeave={() => {
        stage.current?.point(0, 0)
        setOverPower(false)
      }}
      style={{ cursor: overPower ? 'pointer' : undefined }}
    >
      {!flat && (
        <canvas
          ref={canvas}
          aria-hidden="true"
          onClick={(e) => {
            const { x, y } = local(e)
            if (stage.current?.hitsPower(x, y)) onPowerKey()
          }}
        />
      )}
      <div ref={overlay} className="a-machine-screen">
        {children}
      </div>
    </div>
  )
}
