import type { Rgb } from './presets'

/** Client-space coordinates, so scenes need not know where the painting sits. */
export type PaintSignal =
  | { type: 'pulse'; x: number; y: number; radius?: number; amount?: number }
  | { type: 'stroke'; x0: number; y0: number; x1: number; y1: number }
  | { type: 'glaze'; color: Rgb | null }
  | {
      type: 'mark'
      id: string
      x: number
      y: number
      radius?: number
      on: boolean
    }

type Listener = (signal: PaintSignal) => void
const channels = new Map<string, Set<Listener>>()
/** Last glaze per channel, so an engine that mounts after the signal still receives it. */
const latestGlaze = new Map<string, Rgb | null>()

export function onPaint(channel: string, listener: Listener) {
  let set = channels.get(channel)
  if (!set) channels.set(channel, (set = new Set()))
  set.add(listener)
  if (latestGlaze.has(channel))
    listener({ type: 'glaze', color: latestGlaze.get(channel) ?? null })
  return () => {
    set.delete(listener)
    if (!set.size) channels.delete(channel)
  }
}

/** Ignored when no engine is mounted (static fallback, reduced motion), except glaze, which is kept. */
export function paint(channel: string, signal: PaintSignal) {
  if (signal.type === 'glaze') latestGlaze.set(channel, signal.color)
  channels.get(channel)?.forEach((listener) => listener(signal))
}

export function centerOf(el: Element | null | undefined, fx = 0.5, fy = 0.5) {
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width * fx, y: r.top + r.height * fy }
}

/** A palette-knife pass across an element, at a fraction of its height. */
export function sweep(channel: string, el: Element | null, fy = 0.5, from = 0.08, to = 0.92) {
  if (!el) return
  const r = el.getBoundingClientRect()
  const y = r.top + r.height * fy
  paint(channel, {
    type: 'stroke',
    x0: r.left + r.width * from,
    y0: y,
    x1: r.left + r.width * to,
    y1: y + r.height * (Math.random() - 0.5) * 0.06,
  })
}
