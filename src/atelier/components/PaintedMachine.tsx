import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { Power } from 'lucide-react'
import SentinelTerminal, { type Phase } from '@/components/playground/SentinelTerminal'
import { createStage, type Stage } from '../machine/stage'
import { useQuiet, useWords } from '../hooks'

const keyName = (e: KeyboardEvent) =>
  e.key === ' ' ? 'space' : e.key === 'Enter' ? 'enter' : e.key === 'Backspace' ? 'back' : e.key.toLowerCase()

/**
 * SENTINEL as a painted still life: a real 3D machine rendered through the
 * oil pass, with the live terminal mapped onto its glass.
 */
export default function PaintedMachine() {
  const w = useWords()
  const quiet = useQuiet()
  const stageEl = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const overlay = useRef<HTMLDivElement>(null)
  const stage = useRef<Stage | null>(null)
  const [flat, setFlat] = useState(
    () => typeof WebGL2RenderingContext === 'undefined',
  )
  const [active, setActive] = useState(true)
  const [powered, setPowered] = useState(false)
  const [phase, setPhase] = useState<Phase>('off')
  const [overPower, setOverPower] = useState(false)

  useEffect(() => {
    const root = stageEl.current,
      cv = canvas.current,
      ov = overlay.current
    if (!root || !cv || !ov) return
    let s: Stage
    try {
      s = createStage(cv, ov, quiet)
    } catch {
      queueMicrotask(() => setFlat(true))
      return
    }
    stage.current = s
    const ro = new ResizeObserver(([entry]) => s.resize(entry.contentRect.width, entry.contentRect.height))
    ro.observe(root)
    const io = new IntersectionObserver(([entry]) => {
      s.setVisible(entry.isIntersecting)
      setActive(entry.isIntersecting)
    })
    io.observe(root)
    const onKey = (e: KeyboardEvent) => {
      if (root.contains(document.activeElement)) s.pressKey(keyName(e), e.type === 'keydown')
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
  }, [quiet])

  useEffect(() => {
    stage.current?.setPowered(powered)
  }, [powered])

  const onPhase = useCallback((p: Phase) => {
    setPhase(p)
    if (p === 'off') setPowered(false)
  }, [])

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
  const onCanvasClick = (e: ReactMouseEvent<HTMLCanvasElement>) => {
    const { x, y } = local(e)
    if (stage.current?.hitsPower(x, y)) setPowered((v) => !v)
  }

  const status =
    phase === 'off'
      ? w('待机中。也可以直接按机身右下角的电源键。', 'Standby. The power key on the case works too.')
      : phase === 'chatting'
        ? w('已唤醒。输入 help 查看命令。', 'Awake. Type help for commands.')
        : phase === 'sleeping'
          ? w('正在睡去……', 'Falling asleep…')
          : w('正在醒来……', 'Waking up…')

  return (
    <figure className={`a-machine${flat ? ' is-flat' : ''}`}>
      <div
        ref={stageEl}
        className="a-machine-stage"
        onPointerMove={onMove}
        onPointerLeave={() => {
          stage.current?.point(0, 0)
          setOverPower(false)
        }}
        style={{ cursor: overPower ? 'pointer' : undefined }}
      >
        {!flat && <canvas ref={canvas} aria-hidden="true" onClick={onCanvasClick} />}
        <div ref={overlay} className="a-machine-screen">
          <SentinelTerminal powered={powered} active={active} onPhase={onPhase} />
        </div>
      </div>
      <figcaption className="a-machine-controls">
        <button
          type="button"
          className="a-machine-power"
          data-testid="open-terminal"
          aria-pressed={powered}
          onClick={() => setPowered((v) => !v)}
        >
          <Power size={15} />
          {powered ? w('关机', 'Power off') : w('开机', 'Power on')}
        </button>
        <span aria-live="polite">{status}</span>
      </figcaption>
    </figure>
  )
}
