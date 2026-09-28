import {
  useEffect,
  useRef,
  useState,
  type PointerEventHandler,
  type ReactNode,
} from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { useNarrow, useQuiet, useWords } from '../hooks'
import {
  presetFor,
  type ArtName,
  type PaintIntensity,
} from '../paint/presets'

function whenIdle(fn: () => void, soon: boolean) {
  if ('requestIdleCallback' in window) {
    const id = requestIdleCallback(fn, { timeout: soon ? 150 : 900 })
    return () => cancelIdleCallback(id)
  }
  const id = setTimeout(fn, 120)
  return () => clearTimeout(id)
}

/**
 * A procedurally painted brushstroke field. With WebGL2 and motion allowed it
 * is rendered live (impasto light, pointer response); otherwise the same
 * painting is shown as a still image. Both carry the same classes.
 */
export function Art({
  name = 'landscape',
  className = '',
  eager = false,
  channel,
  intensity = 'full',
}: {
  name?: ArtName
  className?: string
  eager?: boolean
  /** Paint bus channel that scenes signal into. */
  channel?: string
  intensity?: PaintIntensity
}) {
  const portrait = useNarrow(),
    quiet = useQuiet()
  const canvas = useRef<HTMLCanvasElement>(null)
  const [mode, setMode] = useState<'pending' | 'live' | 'still'>('pending')
  const [still, setStill] = useState<string | null>(null)
  const key = `${name}:${portrait}:${quiet}`
  useEffect(() => {
    let handle: { destroy(): void } | undefined,
      cancelled = false
    const surface = canvas.current?.parentElement
    const fallBack = (paintedStill: (n: ArtName, p: boolean) => Promise<string>) =>
      paintedStill(name, portrait).then((url) => {
        if (cancelled) return
        setStill(url)
        setMode('still')
      })
    const cancelIdle = whenIdle(async () => {
      const painter = await import('../paint/painter')
      if (cancelled) return
      if (quiet || !canvas.current || !surface) return fallBack(painter.paintedStill)
      try {
        const { mountPaint } = await import('../paint/engine')
        if (cancelled || !canvas.current) return
        handle = mountPaint({
          canvas: canvas.current,
          source: painter.paintedSource(name, portrait),
          preset: presetFor(name, intensity),
          surface,
          channel,
          onLost: () => void fallBack(painter.paintedStill),
        })
        setMode('live')
      } catch {
        await fallBack(painter.paintedStill)
      }
    }, eager)
    return () => {
      cancelled = true
      cancelIdle()
      handle?.destroy()
      setMode('pending')
    }
  }, [key, name, portrait, quiet, intensity, channel, eager])
  return (
    <>
      {mode !== 'still' && (
        <canvas
          key={key}
          ref={canvas}
          className={`a-art a-paint ${className}`}
          data-stage={mode}
          aria-hidden="true"
        />
      )}
      {mode === 'still' && still && (
        <img
          className={`a-art a-still ${className}`}
          src={still}
          alt=""
          aria-hidden="true"
          draggable={false}
        />
      )}
    </>
  )
}
export function LinkLine({
  to,
  children,
  external = false,
}: {
  to: string
  children: ReactNode
  external?: boolean
}) {
  const inner = (
    <>
      {children}
      <ArrowUpRight size={18} aria-hidden="true" />
    </>
  )
  return external ? (
    <a className="a-link" href={to} target="_blank" rel="noreferrer">
      {inner}
    </a>
  ) : (
    <Link className="a-link" to={to}>
      {inner}
    </Link>
  )
}
export function Caption({
  number,
  children,
}: {
  number?: string
  children: ReactNode
}) {
  return (
    <p className="a-caption">
      {number && <span>{number}</span>}
      {children}
    </p>
  )
}
export function Reveal({
  children,
  className = '',
  onPointerEnter,
}: {
  children: ReactNode
  className?: string
  onPointerEnter?: PointerEventHandler<HTMLDivElement>
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (
      !el ||
      !('IntersectionObserver' in window) ||
      matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-seen')
          observer.disconnect()
        }
      },
      { threshold: 0.07 },
    )
    el.classList.add('a-reveal-ready')
    observer.observe(el)
    return () => {
      observer.disconnect()
      el.classList.remove('a-reveal-ready')
    }
  }, [])
  return (
    <div
      ref={ref}
      className={`a-reveal ${className}`}
      onPointerEnter={onPointerEnter}
    >
      {children}
    </div>
  )
}
export function NextProject({
  name,
  to,
  note,
}: {
  name: string
  to: string
  note: string
}) {
  const w = useWords()
  return (
    <section className="a-next">
      <Caption>{w('接着探索', 'Keep exploring')}</Caption>
      <Link to={to}>
        <span>{name}</span>
        <ArrowUpRight aria-hidden="true" />
      </Link>
      <p>{note}</p>
    </section>
  )
}
export function DemoNote() {
  const w = useWords()
  return (
    <p className="a-demo-note">
      {w(
        '交互机制示意 · 固定样例 · 不调用模型，也不运行项目后端',
        'Interactive mechanism study · fixed examples · no model or project backend calls',
      )}
    </p>
  )
}
