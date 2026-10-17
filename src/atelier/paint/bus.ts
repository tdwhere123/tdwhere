import type { Rgb } from './presets'

/** Client-space coordinates, so scenes need not know where the painting sits. */
export type PaintSignal =
  | { type: 'pulse'; x: number; y: number; radius?: number; amount?: number }
  | { type: 'stroke'; x0: number; y0: number; x1: number; y1: number }
  /** A wet brush dragged along a path: smears pigment instead of scraping it. */
  | { type: 'drag'; x0: number; y0: number; x1: number; y1: number }
  | { type: 'glaze'; color: Rgb | null }
  /** Position in a layered series painting: 0 is the first layer, 1.5 halfway into the third. */
  | { type: 'scene'; at: number }
  /** A palette knife drawn across at height y, then the paint parted wide open along it. */
  | { type: 'part'; y: number }
  | {
      type: 'mark'
      id: string
      x: number
      y: number
      radius?: number
      on: boolean
    }

type Listener = (signal: PaintSignal) => void
type Held = Extract<PaintSignal, { type: 'glaze' | 'scene' }>
const channels = new Map<string, Set<Listener>>()
/** Last glaze and scene per channel, so an engine that mounts after the signal still receives them. */
const held = new Map<string, Map<Held['type'], Held>>()

export function onPaint(channel: string, listener: Listener) {
  let set = channels.get(channel)
  if (!set) channels.set(channel, (set = new Set()))
  set.add(listener)
  held.get(channel)?.forEach((signal) => listener(signal))
  return () => {
    set.delete(listener)
    if (!set.size) channels.delete(channel)
  }
}

/** Ignored when no engine is mounted (static fallback, reduced motion), except glaze and scene, which are kept. */
export function paint(channel: string, signal: PaintSignal) {
  if (signal.type === 'glaze' || signal.type === 'scene') {
    let kept = held.get(channel)
    if (!kept) held.set(channel, (kept = new Map()))
    kept.set(signal.type, signal)
  }
  channels.get(channel)?.forEach((listener) => listener(signal))
}

export function centerOf(el: Element | null | undefined, fx = 0.5, fy = 0.5) {
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width * fx, y: r.top + r.height * fy }
}
