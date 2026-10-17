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
import { onPaint } from '../paint/bus'
import type { FilmFrame } from '../film'

function whenIdle(fn: () => void, soon: boolean) {
  if ('requestIdleCallback' in window) {
    const id = requestIdleCallback(fn, { timeout: soon ? 150 : 900 })
    return () => cancelIdleCallback(id)
  }
  const id = setTimeout(fn, 120)
  return () => clearTimeout(id)
}

/**
 * A painted brushstroke field: procedural, or one of the author's film frames
 * repainted. With WebGL2 and motion allowed it is rendered live (impasto
 * light, pointer response); otherwise the same painting is shown as a still
 * image. Both carry the same classes. A layered series crossfades its stills
 * on the channel's `scene` signal.
 */
export function Art({
  name = 'landscape',
  frame,
  className = '',
  eager = false,
  channel,
  intensity = 'full',
  still = false,
}: {
  name?: ArtName
  /** Paints this film frame instead of `name`, cropped at its focus. */
  frame?: FilmFrame
  /** Always the still image, for paintings that are only glimpsed. */
  still?: boolean
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
  const [stills, setStills] = useState<string[]>([])
  const [scene, setScene] = useState(0)
  const key = `${frame ? `frame:${frame.id}` : name}:${portrait}:${quiet}`
  useEffect(() => {
    let handle: { destroy(): void } | undefined,
      cancelled = false
    const surface = canvas.current?.parentElement
    const cancelIdle = whenIdle(async () => {
      const painter = await import('../paint/painter')
      if (frame) await painter.loadFrame(frame).catch(() => (cancelled = true))
      if (cancelled) return
      const fallBack = () =>
        (frame
          ? painter.paintedFrameStill(frame).then((url) => [url])
          : painter.paintedStills(name, portrait)
        ).then((urls) => {
          if (cancelled) return
          setStills(urls)
          setMode('still')
        })
      if (still || quiet || !canvas.current || !surface) return fallBack()
      try {
        const { mountPaint } = await import('../paint/engine')
        if (cancelled || !canvas.current) return
        handle = mountPaint({
          canvas: canvas.current,
          layers: frame ? 1 : painter.layerCount(name),
          layer: frame
            ? () => painter.paintedFrame(frame)
            : (i) => painter.paintedSource(name, portrait, i),
          preset: presetFor(frame ? 'film' : name, intensity),
          surface,
          channel,
          onLost: () => void fallBack(),
        })
        setMode('live')
      } catch {
        await fallBack()
      }
    }, eager)
    return () => {
      cancelled = true
      cancelIdle()
      handle?.destroy()
      setMode('pending')
    }
  }, [key, name, frame, portrait, quiet, intensity, channel, eager, still])
  const focus = frame ? { objectPosition: frame.focus } : undefined
  const layered = mode === 'still' && stills.length > 1
  useEffect(() => {
    if (!layered || !channel) return
    return onPaint(channel, (signal) => {
      if (signal.type === 'scene') setScene(signal.at)
    })
  }, [layered, channel])
  return (
    <>
      {mode !== 'still' && (
        <canvas
          key={key}
          ref={canvas}
          className={`a-art a-paint ${className}`}
          style={focus}
          data-stage={mode}
          aria-hidden="true"
        />
      )}
      {mode === 'still' &&
        stills.map((src, i) => (
          <img
            key={src}
            className={`a-art a-still ${className}`}
            src={src}
            style={
              i ? { ...focus, opacity: Math.min(1, Math.max(0, scene - i + 1)) } : focus
            }
            alt=""
            aria-hidden="true"
            draggable={false}
          />
        ))}
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
