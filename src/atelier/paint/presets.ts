export type Rgb = [number, number, number]
export type Vec2 = [number, number]
export type ArtName = 'landscape' | 'pigment' | 'construction' | 'manuscript'
export type PaintIntensity = 'full' | 'quiet'

/**
 * How the pointer disturbs the paint.
 * smear: pushes wet pigment. recall: lifts light out of the dabs.
 * lanes: a palette knife confined to horizontal furrows. ink: bleeds into paper.
 */
export type PaintMode = 'smear' | 'recall' | 'lanes' | 'ink'
export const modeIndex: Record<PaintMode, number> = {
  smear: 0,
  recall: 1,
  lanes: 2,
  ink: 3,
}

export type PaintPreset = {
  mode: PaintMode
  /** Preferred stroke direction in radians (0 = horizontal). */
  strokeAngle: number
  /** 0 follows the painting's own edges, 1 forces strokeAngle. */
  directionBias: number
  /** Half-length of a brush stroke, in image uv. */
  strokeLength: number
  impasto: number
  /** Size of the broken-color dabs; larger is coarser. */
  dabScale: number
  brushRadius: number
  /** Gains for displacement, the z channel (glow or ink) and the scrape channel. */
  gain: [number, number, number]
  /** Velocity multiplier per axis; lanes damp the vertical push. */
  anisotropy: Vec2
  /** Per-frame retention of displacement, z and scrape at 60 Hz. */
  decay: [number, number, number]
  /** Neighbour blending per frame for displacement and z. */
  diffusion: [number, number]
  glaze: Rgb
  /** Glaze reached as the element scrolls through the viewport. */
  scrollGlaze: Rgb
  /** Glow color in recall mode; ink color in ink mode. */
  accent: Rgb
  /** Color revealed where the knife scrapes paint away. */
  ground: Rgb
  lightFrom: Vec2
  lightTo: Vec2
  /** Continuous pigment drift speed; 0 renders only on activity. */
  drift: number
}

const base: Record<ArtName, PaintPreset> = {
  landscape: {
    mode: 'smear',
    strokeAngle: -0.12,
    directionBias: 0.35,
    strokeLength: 0.011,
    impasto: 1,
    dabScale: 1,
    brushRadius: 0.075,
    gain: [1.7, 0, 0.3],
    anisotropy: [1, 1],
    decay: [0.993, 0.97, 0.992],
    diffusion: [0.18, 0.1],
    glaze: [1, 1, 1],
    scrollGlaze: [1, 0.86, 0.74],
    accent: [1, 0.9, 0.7],
    ground: [0.95, 0.93, 0.87],
    lightFrom: [-0.65, 0.75],
    lightTo: [0.75, 0.25],
    drift: 1,
  },
  pigment: {
    mode: 'recall',
    strokeAngle: 0.55,
    directionBias: 0.2,
    strokeLength: 0.009,
    impasto: 0.85,
    dabScale: 1.25,
    brushRadius: 0.06,
    gain: [0.45, 1.2, 0],
    anisotropy: [1, 1],
    decay: [0.985, 0.9935, 0.99],
    diffusion: [0.12, 0.05],
    glaze: [1, 1, 1],
    scrollGlaze: [0.9, 0.95, 1.06],
    accent: [1, 0.84, 0.52],
    ground: [0.12, 0.17, 0.2],
    lightFrom: [0.5, 0.8],
    lightTo: [-0.4, 0.5],
    drift: 0.7,
  },
  construction: {
    mode: 'lanes',
    strokeAngle: 0,
    directionBias: 0.8,
    strokeLength: 0.017,
    impasto: 1.15,
    dabScale: 0.85,
    brushRadius: 0.05,
    gain: [1.1, 0, 1.4],
    anisotropy: [1, 0.12],
    decay: [0.99, 0.97, 0.9965],
    diffusion: [0.08, 0.05],
    glaze: [1, 1, 1],
    scrollGlaze: [1.04, 0.92, 0.8],
    accent: [1, 0.86, 0.6],
    ground: [0.87, 0.76, 0.56],
    lightFrom: [-0.8, 0.5],
    lightTo: [0.8, 0.45],
    drift: 0.6,
  },
  manuscript: {
    mode: 'ink',
    strokeAngle: 1.1,
    directionBias: 0.3,
    strokeLength: 0.007,
    impasto: 0.7,
    dabScale: 1.4,
    brushRadius: 0.035,
    gain: [0.25, 0.8, 0],
    anisotropy: [1, 1],
    decay: [0.985, 0.9988, 0.99],
    diffusion: [0.1, 0.32],
    glaze: [1, 1, 1],
    scrollGlaze: [1.02, 0.96, 0.92],
    accent: [0.1, 0.14, 0.2],
    ground: [0.96, 0.94, 0.89],
    lightFrom: [0.7, 0.8],
    lightTo: [-0.2, 0.6],
    drift: 0.5,
  },
}

export function presetFor(
  name: ArtName,
  intensity: PaintIntensity = 'full',
): PaintPreset {
  const p = base[name]
  if (intensity === 'full') return p
  return {
    ...p,
    brushRadius: p.brushRadius * 0.8,
    gain: [p.gain[0] * 0.45, p.gain[1] * 0.45, p.gain[2] * 0.4],
    impasto: p.impasto * 0.8,
    drift: p.drift * 0.5,
  }
}

export const studyGlazes: Rgb[] = [
  [0.84, 0.94, 1.12],
  [0.9, 1.1, 0.86],
  [1.08, 1.01, 0.84],
]

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

export function mixRgb(a: Rgb, b: Rgb, t: number): Rgb {
  const k = clamp01(t)
  return [
    a[0] + (b[0] - a[0]) * k,
    a[1] + (b[1] - a[1]) * k,
    a[2] + (b[2] - a[2]) * k,
  ]
}

export function mixVec2(a: Vec2, b: Vec2, t: number): Vec2 {
  const k = clamp01(t)
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]
}

const positionKeywords: Record<string, number> = {
  left: 0,
  top: 0,
  center: 0.5,
  right: 1,
  bottom: 1,
}

/** Parses a computed `object-position` into 0..1 fractions; px offsets fall back to center. */
export function parseObjectPosition(value: string): Vec2 {
  const parts = value.trim().split(/\s+/).filter(Boolean)
  const read = (part: string | undefined) => {
    if (!part) return 0.5
    if (part in positionKeywords) return positionKeywords[part]
    const pct = part.match(/^(-?[\d.]+)%$/)
    return pct ? clamp01(Number(pct[1]) / 100) : 0.5
  }
  if (parts.length === 1) {
    const only = parts[0]
    if (only === 'top' || only === 'bottom') return [0.5, read(only)]
    return [read(only), 0.5]
  }
  let [x, y] = parts
  if (x === 'top' || x === 'bottom' || y === 'left' || y === 'right')
    [x, y] = [y, x]
  return [read(x), read(y)]
}

/**
 * `object-fit: cover` as a uv transform: imageUv = canvasUv * scale + offset.
 * Both uv spaces have y pointing up (the texture is uploaded flipped), while
 * object-position measures y from the top.
 */
export function coverFit(
  boxW: number,
  boxH: number,
  imgW: number,
  imgH: number,
  position: Vec2 = [0.5, 0.5],
): { scale: Vec2; offset: Vec2 } {
  if (boxW <= 0 || boxH <= 0 || imgW <= 0 || imgH <= 0)
    return { scale: [1, 1], offset: [0, 0] }
  const s = Math.max(boxW / imgW, boxH / imgH)
  const fx = boxW / (imgW * s),
    fy = boxH / (imgH * s)
  return {
    scale: [fx, fy],
    offset: [(1 - fx) * position[0], (1 - fy) * (1 - position[1])],
  }
}

/** Progress of an element through the viewport: 0 as it enters below, 1 as it leaves above. */
export function scrollProgress(top: number, height: number, viewport: number) {
  return clamp01((viewport - top) / (viewport + Math.max(1, height)))
}

/** Fixed 60 Hz field steps for an elapsed time, capped so a stalled tab cannot burst. */
export function fieldSteps(elapsedMs: number, carryMs = 0, cap = 4) {
  const step = 1000 / 60
  const total = Math.max(0, elapsedMs) + carryMs
  const steps = Math.floor(total / step)
  return steps > cap
    ? { steps: cap, carry: 0 }
    : { steps, carry: total - steps * step }
}

/** Frames until a value retained at `decay` per frame falls below `epsilon`. */
export function settleFrames(decay: number, epsilon = 0.004) {
  if (decay <= 0) return 0
  if (decay >= 1) return Infinity
  return Math.ceil(Math.log(epsilon) / Math.log(decay))
}
