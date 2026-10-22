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
import { loadPainting, type PaintImage } from '../paint/images'
import { emergencyGround } from '../paint/emergency'

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
  prepared,
}: {
  name?: ArtName
  /** Paints this film frame instead of `name`, cropped at its focus. */
  frame?: FilmFrame
  /** An authored, prepainted image: immediate still and the live engine's source. */
  prepared?: string
  /** Always the still image, for paintings that are only glimpsed. */
  still?: boolean
  className?: string
  eager?: boolean
  /** Paint bus channel that scenes signal into. */
  channel?: string
  intensity?: PaintIntensity
}) {
  const portrait = useNarrow() && !frame,
    quiet = useQuiet()
  const canvas = useRef<HTMLCanvasElement>(null)
  const [mode, setMode] = useState<'pending' | 'live' | 'still' | 'failed'>('pending')
  const [stills, setStills] = useState<string[]>([])
  const [scene, setScene] = useState(0)
  const key = `${frame ? `frame:${frame.id}` : name}:${portrait}:${quiet}`
  useEffect(() => {
    let handle: { destroy(): void } | undefined,
      cancelIdle: (() => void) | undefined,
      cancelled = false,
      visible = eager || !('IntersectionObserver' in window),
      suspended = false,
      departing = false,
      started = false
    const surface = canvas.current?.parentElement
    const fail = (error: unknown) => {
      if (cancelled) return
      // A nonessential illustration must not crash the page, or silently vanish.
      console.error(`Painting unavailable: ${frame?.id ?? name}`, error)
      setStills(previous => previous.length ? previous : [emergencyGround(presetFor(frame ? 'film' : name, intensity))])
      setMode('failed')
    }
    const start = async () => {
      let source: PaintImage | undefined
      let painter: typeof import('../paint/painter') | undefined
      if (prepared) source = await loadPainting(prepared).catch(() => undefined)
      if (cancelled) return
      if (!source) {
        painter = await import('../paint/painter')
        if (frame) await painter.loadFrame(frame)
      }
      if (cancelled) return
      // An overlay or departure may have arrived while an import/image was in flight.
      if (suspended || departing) { started = false; return }
      const fallBack = async () => {
        const urls = source && prepared ? [prepared] : frame
          ? [await painter!.paintedFrameStill(frame)]
          : await painter!.paintedStills(name, portrait)
        if (cancelled) return
        setStills(urls)
        setMode('still')
      }
      if (still || quiet || !canvas.current || !surface) return fallBack()
      try {
        const { mountPaint } = await import('../paint/engine')
        if (cancelled || !canvas.current) return
        if (suspended || departing) { started = false; return }
        handle = mountPaint({
          canvas: canvas.current,
          layers: source || frame ? 1 : painter!.layerCount(name),
          layer: source ? () => source! : frame
            ? () => painter!.paintedFrame(frame)
            : (i) => painter!.paintedSource(name, portrait, i),
          preset: presetFor(frame ? 'film' : name, intensity),
          surface,
          channel,
          onReady: () => { if (!cancelled) setMode('live') },
          onLost: () => { void fallBack().catch(fail) },
        })
      } catch {
        await fallBack()
      }
    }
    const schedule = () => {
      if (cancelled || started || cancelIdle || suspended || departing || !visible) return
      cancelIdle = whenIdle(() => {
        cancelIdle = undefined
        if (cancelled || suspended || departing || !visible) return
        started = true
        void start().catch(fail)
      }, eager)
    }
    // Demand is checked before painting or allocating a graphics context, not just before animation.
    const off = channel ? onPaint(channel, (signal) => {
      if (signal.type === 'suspend') suspended = signal.value
      else if (signal.type === 'part') departing = signal.y !== null
      else return
      if (suspended || departing) { cancelIdle?.(); cancelIdle = undefined }
      else schedule()
    }) : undefined
    const observer = !eager && 'IntersectionObserver' in window && canvas.current
      ? new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; schedule() }, { rootMargin: '160px' })
      : undefined
    if (canvas.current) observer?.observe(canvas.current)
    schedule()
    return () => {
      cancelled = true
      cancelIdle?.()
      observer?.disconnect()
      off?.()
      handle?.destroy()
      setMode('pending')
    }
  }, [key, name, frame, portrait, quiet, intensity, channel, eager, still, prepared])
  const focus = frame ? { objectPosition: frame.focus } : undefined
  const layered = mode !== 'live' && stills.length > 1
  useEffect(() => {
    if (!layered || !channel) return
    return onPaint(channel, (signal) => {
      if (signal.type === 'scene') setScene(signal.at)
    })
  }, [layered, channel])
  return (
    <>
      {prepared && !stills.length && (
        <img className={`a-art a-still ${className}`} src={prepared} style={{ ...focus, opacity: mode === 'live' ? 0 : 1 }} alt="" aria-hidden="true" draggable={false} fetchPriority={eager ? 'high' : 'auto'} />
      )}
      {/* Keep the observed target mounted through fallback and responsive restarts. */}
        <canvas
          key={key}
          ref={canvas}
          className={`a-art a-paint ${className}`}
          style={{ ...focus, opacity: mode === 'live' ? 1 : 0 }}
          data-stage={mode}
          aria-hidden="true"
        />
      {stills.map((src, i) => (
          <img
            key={src}
            className={`a-art a-still ${className}`}
            src={src}
            style={{ ...focus, opacity: mode === 'live' ? 0 : i ? Math.min(1, Math.max(0, scene - i + 1)) : 1 }}
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
