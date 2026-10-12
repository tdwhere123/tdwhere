import { evidence } from '../model'
import type { ArtName } from './presets'

type Hsl = [number, number, number]
type Rng = () => number

/** A painting described as fields over normalized (x, y), y pointing down. */
type Recipe = {
  ground: string
  color: (x: number, y: number, r: Rng) => string
  angle: (x: number, y: number, r: Rng) => number
  /** 0 leaves bare canvas, 1 is fully worked. */
  density: (x: number, y: number) => number
  highlights?: (r: Rng) => [number, number, string] | null
  accents?: (ctx: CanvasRenderingContext2D, w: number, h: number, r: Rng) => void
}

function rng(seed: number): Rng {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hsl(hex: string): Hsl {
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) / 255,
    g = ((n >> 8) & 255) / 255,
    b = (n & 255) / 255
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h =
    max === r
      ? (g - b) / d + (g < b ? 6 : 0)
      : max === g
        ? (b - r) / d + 2
        : (r - g) / d + 4
  return [h * 60, s, l]
}

const hslCache = new Map<string, Hsl>()
function jitter(hex: string, r: Rng, amount = 1) {
  let c = hslCache.get(hex)
  if (!c) hslCache.set(hex, (c = hsl(hex)))
  const h = c[0] + (r() - 0.5) * 16 * amount,
    s = Math.min(1, Math.max(0, c[1] + (r() - 0.5) * 0.12 * amount)),
    l = Math.min(0.97, Math.max(0.03, c[2] + (r() - 0.5) * 0.09 * amount))
  return [h, s, l] as Hsl
}

const pick = <T,>(list: T[], r: Rng) => list[Math.floor(r() * list.length)]
const smooth = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

function stroke(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  length: number,
  width: number,
  color: Hsl,
  alpha: number,
  r: Rng,
) {
  const dx = Math.cos(angle) * length * 0.5,
    dy = Math.sin(angle) * length * 0.5
  const nx = -Math.sin(angle),
    ny = Math.cos(angle)
  const bend = (r() - 0.5) * width * 0.9
  const bristles = Math.max(3, Math.min(7, Math.round(width / 5)))
  ctx.lineCap = 'round'
  for (let i = 0; i < bristles; i++) {
    const t = i / (bristles - 1) - 0.5
    const o = t * width * 0.85
    const l = color[2] + (r() - 0.5) * 0.08,
      s = color[1] * (0.85 + r() * 0.3)
    ctx.strokeStyle = `hsla(${color[0]},${s * 100}%,${l * 100}%,${alpha * (0.65 + r() * 0.35)})`
    ctx.lineWidth = (width / bristles) * (1.6 + r() * 0.6)
    const edge = 1 - t * t * 2.4
    const head = Math.max(0.2, edge * (0.8 + r() * 0.25)),
      tail = Math.max(0.15, edge * (0.6 + r() * 0.4))
    ctx.beginPath()
    ctx.moveTo(x - dx * head + nx * o, y - dy * head + ny * o)
    ctx.quadraticCurveTo(
      x + nx * (o + bend),
      y + ny * (o + bend),
      x + dx * tail + nx * o,
      y + dy * tail + ny * o,
    )
    ctx.stroke()
  }
}

const horizon = 0.4,
  vanish: [number, number] = [0.92, 0.38]
function furrowOf(x: number, y: number) {
  const k = (Math.atan2(y - vanish[1], x - vanish[0]) * 26) / Math.PI
  const index = Math.floor(k)
  return { index, phase: k - index }
}

/** A handwritten line: a wavering pen trace broken into words. */
function scribble(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  end: number,
  size: number,
  color: string,
  r: Rng,
) {
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  while (x < end) {
    const word = size * (2.5 + r() * 6)
    const c = jitter(color, r, 0.4)
    ctx.strokeStyle = `hsla(${c[0]},${c[1] * 100}%,${c[2] * 100}%,${0.62 + r() * 0.25})`
    ctx.lineWidth = size * (0.16 + r() * 0.1)
    ctx.beginPath()
    let px = x,
      py = y,
      phase = r() * 6
    ctx.moveTo(px, py)
    while (px < Math.min(end, x + word)) {
      const step = size * (0.5 + r() * 0.7)
      phase += 0.9 + r() * 1.6
      const lift = r() < 0.12 ? -size * (0.5 + r() * 0.4) : 0
      const nx = px + step,
        ny = y + Math.sin(phase) * size * (0.12 + r() * 0.3) + lift
      ctx.quadraticCurveTo(px + step * 0.5, (py + ny) / 2 + (r() - 0.5) * size * 0.6, nx, ny)
      px = nx
      py = ny
    }
    ctx.stroke()
    x += word + size * (0.8 + r() * 1.2)
  }
}

const single: Record<Exclude<ArtName, 'pond'>, Recipe> = {
  landscape: {
    ground: '#efe8da',
    color(x, y, r) {
      const river = Math.abs(y - (0.8 + Math.sin(x * 5.5 + 1) * 0.05))
      if (y > 0.66 && river < 0.035)
        return pick(['#cfdbe0', '#e9ece4', '#b8c9d3', '#f3efe2'], r)
      if (y < 0.5)
        return pick(
          y < 0.3
            ? ['#f3e6c7', '#f0dcb0', '#e7e3ea', '#f6efd9', '#e9d1a4']
            : ['#efe2c6', '#dcd6e4', '#f2e5c4', '#cfd3e3'],
          r,
        )
      if (y < 0.62)
        return pick(['#8e97b8', '#a3a1c1', '#7d8aa9', '#b5b3c8', '#6f8199'], r)
      return r() < 0.025
        ? pick(['#a6613f', '#b0664a'], r)
        : pick(['#8f9a6b', '#7a8762', '#b0a879', '#879272', '#c4bb8e', '#6d7b5c'], r)
    },
    angle(_x, y, r) {
      if (y < 0.5) return 0.2 + (r() - 0.5) * 1.3
      if (y < 0.66) return (r() - 0.5) * 0.25
      return -1.2 + (r() - 0.5) * 0.9
    },
    density: (x, y) =>
      Math.min(1, smooth(0.02, 0.6, x) * 0.85 + smooth(0.45, 0.9, y) * 0.5 + 0.08),
    highlights: (r) =>
      r() < 0.5
        ? [0.35 + r() * 0.65, r() * 0.45, pick(['#fbf3dc', '#fff7e4', '#f5e2b4'], r)]
        : [0.3 + r() * 0.7, 0.76 + r() * 0.1, pick(['#f7f5ee', '#e4eef0'], r)],
  },
  pigment: {
    ground: '#17242c',
    color(x, y, r) {
      const olive = smooth(0.45, 0.95, x) * smooth(0.35, 0.9, y)
      if (r() < olive * 0.8)
        return pick(['#3d4a33', '#4f5a3a', '#34422f', '#5b6341'], r)
      return pick(['#1d3240', '#243a47', '#2c4150', '#1a2a33', '#33495a', '#151d22'], r)
    },
    angle: (x, y, r) => 0.5 + Math.sin(x * 3 + y * 2.2) * 0.7 + (r() - 0.5) * 0.5,
    density: () => 0.92,
    highlights(r) {
      if (r() < 0.2)
        return [r(), r(), pick(['#9fb3b8', '#7f989f', '#b8b69a'], r)]
      if (r() < 0.55) return null
      const e = pick(evidence.filter((n) => n.current), r)
      const a = r() * Math.PI * 2,
        d = Math.abs(r() + r() - 1) * 0.12
      return [
        e.x + Math.cos(a) * d,
        e.y + Math.sin(a) * d * 0.7,
        pick(['#e7c982', '#f3dfa8', '#c9a55f', '#d8b36e'], r),
      ]
    },
  },
  construction: {
    ground: '#efe6d3',
    color(x, y, r) {
      if (y < horizon)
        return pick(
          y < horizon - 0.12
            ? ['#eee2c4', '#f3e9d2', '#e6d3aa', '#e0d8cc', '#f0dcae']
            : ['#e9cf98', '#f0dcae', '#dcc7a4', '#e6c58a'],
          r,
        )
      const furrow = furrowOf(x, y)
      if (furrow.phase < 0.16) return pick(['#4a3c30', '#5a4636', '#3f352d'], r)
      const warm = furrow.index % 3
      return warm === 0
        ? pick(['#a4623c', '#9a5a3a', '#b3713f'], r)
        : pick(['#c89a4f', '#d6ae63', '#caa05a', '#e0bb72', '#bf8a48'], r)
    },
    angle(x, y, r) {
      if (y < horizon) return (r() - 0.5) * 0.5
      return Math.atan2(vanish[1] - y, vanish[0] - x) + (r() - 0.5) * 0.06
    },
    density: (x, y) =>
      y < horizon ? 0.28 + smooth(0.35, 1, x) * 0.35 : 0.5 + smooth(0, 0.6, x) * 0.5,
    accents(ctx, w, h, r) {
      for (let i = 0; i < 8; i++) {
        const t = i / 7,
          depth = 1 - t * 0.78
        const x = (0.28 + t * 0.52) * w,
          base = h * (0.94 - t * (0.94 - horizon - 0.03))
        const post = h * 0.16 * depth
        stroke(ctx, x, base - post / 2, -Math.PI / 2 + (r() - 0.5) * 0.08, post, 8 * depth + 3, jitter('#2f2923', r, 0.4), 0.85, r)
      }
    },
  },
  manuscript: {
    ground: '#f4efe4',
    color: (_x, _y, r) =>
      pick(['#ebe3d3', '#e2d8c6', '#d9d2c4', '#efe7d8', '#e6dccb'], r),
    angle: (_x, _y, r) => (r() - 0.5) * 0.18,
    density: (x, y) => 0.25 + smooth(0.3, 0.9, x) * 0.45 + smooth(0.6, 1, y) * 0.2,
    accents(ctx, w, h, r) {
      const size = Math.min(w, h) * 0.022
      for (let row = 0; row < 10; row++) {
        const y = h * (0.2 + row * 0.068) + (r() - 0.5) * size * 0.5
        const start = w * (0.5 + r() * 0.03)
        const end = row === 9 ? start + w * 0.14 : w * (0.84 + r() * 0.08)
        scribble(ctx, start, y, end, size, '#26324a', r)
      }
      ctx.lineCap = 'round'
      for (let i = 0; i < 3; i++) {
        const c = jitter('#a4483a', r, 0.5)
        ctx.strokeStyle = `hsla(${c[0]},${c[1] * 100}%,${c[2] * 100}%,0.78)`
        ctx.lineWidth = size * (0.22 + r() * 0.12)
        const x = w * (0.47 + r() * 0.02),
          y0 = h * (0.2 + i * 0.22)
        ctx.beginPath()
        ctx.moveTo(x, y0)
        ctx.quadraticCurveTo(x - size * 0.8, y0 + h * 0.07, x + size * 0.2, y0 + h * 0.15)
        ctx.stroke()
      }
      const c = jitter('#b85c4a', r, 0.4)
      ctx.strokeStyle = `hsla(${c[0]},${c[1] * 100}%,${c[2] * 100}%,0.7)`
      ctx.lineWidth = size * 0.2
      ctx.beginPath()
      ctx.ellipse(w * 0.72, h * (0.2 + 4 * 0.068), w * 0.07, size * 1.1, -0.04, 0.3, Math.PI * 2.1)
      ctx.stroke()
    },
  },
}


/**
 * One pond, painted at five hours like a Monet series: rain, night, dawn,
 * day, dusk. Every layer shares the same shore, tree line and lily pads, so a
 * transition reads as the light changing over a fixed place.
 */
const waterline = (x: number) => 0.55 + Math.sin(x * 3.1 + 0.4) * 0.012
const treeTop = (x: number) =>
  waterline(x) -
  0.04 -
  0.17 * (1 - smooth(0.12, 0.8, x)) -
  Math.abs(Math.sin(x * 23 + 2)) * 0.022 -
  Math.sin(x * 57 + 1) * 0.008
const pads: [number, number, number, number][] = [
  [0.12, 0.78, 0.1, 0.035],
  [0.3, 0.9, 0.13, 0.04],
  [0.22, 0.68, 0.06, 0.018],
  [0.58, 0.84, 0.08, 0.026],
  [0.84, 0.94, 0.15, 0.045],
  [0.92, 0.74, 0.06, 0.02],
  [0.46, 0.72, 0.045, 0.014],
]
function padAt(x: number, y: number) {
  let best = 0
  for (const [cx, cy, rx, ry] of pads) {
    const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
    best = Math.max(best, 1 - d)
  }
  return best
}
type Region = 'sky' | 'trees' | 'water' | 'mirror-sky' | 'mirror-trees' | 'pad' | 'column'
function regionOf(x: number, y: number, light: number): Region {
  const shore = waterline(x)
  if (y < treeTop(x)) return 'sky'
  if (y < shore) return 'trees'
  if (padAt(x, y) > 0) return 'pad'
  if (Math.abs(x - light) < 0.025 + (y - shore) * 0.12) return 'column'
  return 2 * shore - y >= treeTop(x) ? 'mirror-trees' : 'mirror-sky'
}
type PondLight = {
  ground: string
  /** Horizontal position of the light source and its reflection on the water. */
  light: number
  sky: (y: number) => string[]
  trees: string[]
  mirrorSky: string[]
  mirrorTrees: string[]
  pad: string[]
  column: string[]
  skyAngle: number
  highlights?: Recipe['highlights']
  accents?: Recipe['accents']
}
function pond(l: PondLight): Recipe {
  return {
    ground: l.ground,
    color(x, y, r) {
      const region = regionOf(x, y, l.light)
      const list =
        region === 'sky'
          ? l.sky(y)
          : region === 'trees'
            ? l.trees
            : region === 'pad'
              ? l.pad
              : region === 'column'
                ? l.column
                : region === 'mirror-trees'
                  ? l.mirrorTrees
                  : l.mirrorSky
      return pick(list, r)
    },
    angle(x, y, r) {
      if (y < treeTop(x)) return l.skyAngle + (r() - 0.5) * 0.9
      if (y < waterline(x)) return -Math.PI / 2 + (r() - 0.5) * 0.7
      return (r() - 0.5) * 0.16
    },
    density: (x, y) => (y < treeTop(x) ? 0.82 : 0.95),
    highlights: l.highlights,
    accents: l.accents,
  }
}
const ring = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  color: string,
  alpha: number,
  width: number,
) => {
  const c = hsl(color)
  ctx.strokeStyle = `hsla(${c[0]},${c[1] * 100}%,${c[2] * 100}%,${alpha})`
  ctx.lineWidth = width
  ctx.beginPath()
  ctx.ellipse(x, y, rx, rx * 0.28, 0, 0, Math.PI * 2)
  ctx.stroke()
}
const series: Recipe[] = [
  pond({
    ground: '#dcdcd6',
    light: 0.7,
    sky: (y) =>
      y < 0.2
        ? ['#b9c1c9', '#c7ccd2', '#aab4be', '#d3d4d6']
        : ['#cfd3d6', '#dcdcda', '#c3c9cf', '#e2e0da'],
    trees: ['#6d7c80', '#5e6e72', '#7a8986', '#53635f', '#86918d'],
    mirrorSky: ['#c4cbd0', '#b3bdc5', '#d5d7d6', '#a9b4bc'],
    mirrorTrees: ['#76858a', '#66767a', '#87938f', '#5d6b6c'],
    pad: ['#7e8d78', '#6f7f6c', '#93a08a'],
    column: ['#dfe2e1', '#d0d6d9', '#e9e8e2'],
    skyAngle: 1.05,
    highlights(r) {
      const x = r(),
        y = 0.58 + r() * 0.4
      return r() < 0.12 && padAt(x, y) <= 0 ? [x, y, pick(['#e6eaea', '#dce3e6'], r)] : null
    },
    accents(ctx, w, h, r) {
      const unit = Math.min(w, h) / 1000
      for (let i = 0; i < 70; i++) {
        const x = r(),
          y = 0.6 + r() * 0.4
        if (padAt(x, y) > 0) continue
        ring(ctx, x * w, y * h, (8 + r() * 26) * unit, r() < 0.5 ? '#eef0ec' : '#7b8a8e', 0.5, 1.4 * unit)
      }
      ctx.lineCap = 'round'
      for (let i = 0; i < 420; i++) {
        const x = r() * w * 1.1,
          y = r() * h,
          len = (18 + r() * 40) * unit
        ctx.strokeStyle = r() < 0.6 ? 'rgba(240,242,240,0.42)' : 'rgba(90,104,110,0.24)'
        ctx.lineWidth = (0.8 + r() * 1.1) * unit
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x - len * 0.28, y + len)
        ctx.stroke()
      }
    },
  }),
  pond({
    ground: '#121e2c',
    light: 0.68,
    sky: (y) =>
      y < 0.22
        ? ['#101b2b', '#15233a', '#1b2c46', '#0d1522']
        : ['#1b2f48', '#22375a', '#2a4063', '#18283d'],
    trees: ['#0e1822', '#13202b', '#0b131b', '#1a2733'],
    mirrorSky: ['#17283e', '#1e3350', '#132236', '#243a57'],
    mirrorTrees: ['#0d161f', '#121d27', '#0a1118'],
    pad: ['#1f2f2c', '#263a33', '#1a2826'],
    column: ['#3d4d63', '#4c5c70', '#33445a'],
    skyAngle: 0.35,
    highlights(r) {
      const x = r(),
        y = r() * 0.5
      if (y < treeTop(x) && r() < 0.55)
        return [x, y, pick(['#f3dfa8', '#e7c982', '#fff2cf', '#c9d6e6'], r)]
      if (r() < 0.25) {
        const ry = 0.6 + r() * 0.35
        return padAt(x, ry) > 0 ? null : [x, ry, pick(['#c9a55f', '#d8b36e', '#9fb3c8'], r)]
      }
      return null
    },
    accents(ctx, w, h, r) {
      const unit = Math.min(w, h) / 1000
      for (let i = 0; i < 9; i++) {
        const x = 0.06 + r() * 0.88,
          y = 0.04 + r() * (treeTop(x) - 0.08)
        const c = jitter(pick(['#f3dfa8', '#fff2cf', '#e7c982'], r), r, 0.4)
        for (let k = 0; k < 10; k++)
          stroke(ctx, x * w, y * h, (k / 10) * Math.PI * 2, (10 + r() * 16) * unit, 5 * unit, c, 0.55, r)
        const mirror = 2 * waterline(x) - y
        if (mirror < 1 && padAt(x, mirror) <= 0)
          stroke(ctx, x * w, mirror * h, 0, 34 * unit, 4 * unit, jitter('#c9a55f', r, 0.4), 0.5, r)
      }
    },
  }),
  pond({
    ground: '#efe0d4',
    light: 0.72,
    sky: (y) =>
      y < 0.18
        ? ['#b9b7d3', '#a6afcf', '#c7c0d8', '#b2b9d6']
        : y < 0.3
          ? ['#e3c3c6', '#d8bccf', '#efcdbf', '#e6c9d0']
          : ['#f1c9a5', '#f4dcc0', '#eab396', '#f6d8b2'],
    trees: ['#6c6a8c', '#5b5f7e', '#7c7392', '#4f5372', '#86769a'],
    mirrorSky: ['#e7bfa6', '#d9b8c4', '#c9bdd6', '#efcfb5'],
    mirrorTrees: ['#6a6585', '#5c5b7a', '#7b6f8e'],
    pad: ['#7c8a73', '#6f7d6f', '#94907a'],
    column: ['#f6d48a', '#f0b77c', '#f8e2a8', '#eda877'],
    skyAngle: 0.12,
    highlights: (r) =>
      r() < 0.5 ? [0.66 + r() * 0.12, 0.56 + r() * 0.4, pick(['#fbe3a8', '#f7c98a'], r)] : null,
    accents(ctx, w, h, r) {
      const unit = Math.min(w, h) / 1000,
        x = 0.72 * w,
        y = (treeTop(0.72) - 0.05) * h
      for (let k = 0; k < 60; k++) {
        const a = r() * Math.PI * 2,
          d = Math.sqrt(r()) * 38 * unit
        stroke(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d, a + Math.PI / 2, 22 * unit, 9 * unit, jitter(pick(['#f8dc8f', '#fbe7b5', '#f3c37f'], r), r, 0.3), 0.75, r)
      }
    },
  }),
  pond({
    ground: '#ece6d4',
    light: 0.62,
    sky: (y) =>
      y < 0.2
        ? ['#b7cfdf', '#c6dae6', '#a9c4d6', '#e9efe8']
        : ['#cfe0ea', '#f3ead2', '#e6ecea', '#d9e4e6'],
    trees: ['#5f7a4f', '#738c58', '#4d6447', '#8a9a5e', '#3f5641'],
    mirrorSky: ['#a9c6d6', '#bcd3dd', '#96b6c8', '#d4e0de'],
    mirrorTrees: ['#4f6a52', '#5f7a5a', '#45604e', '#6e8459'],
    pad: ['#6f9152', '#83a35e', '#5d7d48', '#9db06a'],
    column: ['#f1ead0', '#e3ecea', '#fbf4dc'],
    skyAngle: 0.25,
    highlights(r) {
      const x = r(),
        y = 0.62 + r() * 0.38
      if (padAt(x, y) > 0.25 && r() < 0.6)
        return [x, y, pick(['#e9a3a8', '#f2c6c2', '#f7e7e2', '#d98b95'], r)]
      return r() < 0.2 ? [x, y, '#f6f4ea'] : null
    },
  }),
  pond({
    ground: '#3a3348',
    light: 0.3,
    sky: (y) =>
      y < 0.16
        ? ['#4b4f7a', '#5b5f8a', '#433f68', '#6d6a96']
        : y < 0.28
          ? ['#a5799a', '#c4889a', '#8f6f95', '#d39a95']
          : ['#e59a7a', '#f0b48a', '#d98466', '#f2c46e'],
    trees: ['#3b3550', '#2f2a40', '#4a3f5a', '#352c3e', '#55465c'],
    mirrorSky: ['#c98a83', '#a77a96', '#8a6f93', '#dfa07f'],
    mirrorTrees: ['#2f2a40', '#3b3550', '#29233a'],
    pad: ['#4c5242', '#5a5c45', '#3f4639'],
    column: ['#f2a65e', '#e7894f', '#f6c06f', '#d9703f'],
    skyAngle: 0.08,
    highlights(r) {
      const x = 0.24 + r() * 0.12,
        y = 0.58 + r() * 0.4
      return r() < 0.5 && padAt(x, y) <= 0 ? [x, y, pick(['#ffd08a', '#f7a75f'], r)] : null
    },
    accents(ctx, w, h, r) {
      const unit = Math.min(w, h) / 1000,
        x = 0.3 * w,
        y = (treeTop(0.3) - 0.01) * h
      for (let k = 0; k < 40; k++) {
        const a = Math.PI + r() * Math.PI,
          d = Math.sqrt(r()) * 46 * unit
        stroke(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d * 0.6, 0, 26 * unit, 8 * unit, jitter(pick(['#f6b660', '#f9d27e', '#ec8a4c'], r), r, 0.3), 0.7, r)
      }
    },
  }),
]

const recipes: Record<ArtName, Recipe[]> = {
  ...(Object.fromEntries(
    Object.entries(single).map(([name, recipe]) => [name, [recipe]]),
  ) as Record<Exclude<ArtName, 'pond'>, Recipe[]>),
  pond: series,
}

const passes = [
  { width: 80, length: 190, count: 380, alpha: 0.4, jitter: 0.5 },
  { width: 40, length: 105, count: 1500, alpha: 0.75, jitter: 0.9 },
  { width: 22, length: 58, count: 2600, alpha: 0.88, jitter: 1.1 },
]

export const layerCount = (name: ArtName) => recipes[name].length

export function paintRecipe(name: ArtName, width: number, height: number, layer = 0) {
  return paintWith(recipes[name][layer], name.length * 7919 + width + layer * 104729, width, height)
}

function paintWith(recipe: Recipe, seed: number, width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  const r = rng(seed)
  ctx.fillStyle = recipe.ground
  ctx.fillRect(0, 0, width, height)
  const area = (width * height) / (1600 * 1000),
    unit = Math.min(width, height) / 1000
  for (const pass of passes) {
    const count = Math.round(pass.count * area)
    for (let i = 0; i < count; i++) {
      const x = r(),
        y = r()
      const d = recipe.density(x, y)
      if (r() > d) continue
      const sparse = d < 0.45
      stroke(
        ctx,
        x * width,
        y * height,
        recipe.angle(x, y, r),
        pass.length * unit * (0.6 + r() * 0.8),
        pass.width * unit * (0.7 + r() * 0.6) * (sparse ? 0.7 : 1),
        jitter(recipe.color(x, y, r), r, pass.jitter),
        pass.alpha * (sparse ? 0.55 : 1),
        r,
      )
    }
  }
  recipe.accents?.(ctx, width, height, r)
  if (recipe.highlights)
    for (let i = 0; i < Math.round(900 * area); i++) {
      const h = recipe.highlights(r)
      if (!h) continue
      stroke(ctx, h[0] * width, h[1] * height, (r() - 0.5) * 1.2, (6 + r() * 12) * unit, (4 + r() * 5) * unit, jitter(h[2], r, 0.5), 0.9, r)
    }
  return canvas
}

/** Rain-dimmed water seen from above: the ground the overture's rain falls on. */
const water: Recipe = {
  ground: '#b4bec5',
  color(x, y, r) {
    if (r() < 0.012) return pick(['#d9cfb2', '#cfc4a6'], r)
    const lilac = Math.sin(x * 4.1 + y * 2.3) * 0.5 + 0.5,
      green = Math.sin(x * 2.2 - y * 5.1 + 1.3) * 0.5 + 0.5
    if (r() < lilac * 0.22) return pick(['#bdbcd0', '#aeb0c8', '#c8c6d6'], r)
    if (r() < green * 0.2) return pick(['#a9bbb2', '#9fb3ab', '#b7c6bb'], r)
    return pick(['#c4cbd0', '#b3bdc5', '#d3d7d7', '#a9b4bc', '#9eacb5', '#cdd3d3'], r)
  },
  angle: (x, y, r) => Math.sin(y * 7 + x * 3) * 0.12 + (r() - 0.5) * 0.22,
  density: () => 0.96,
  highlights: (r) => (r() < 0.1 ? [r(), r(), pick(['#e6eaea', '#eef0ec', '#dfe5e8'], r)] : null),
}
let waterCanvas: HTMLCanvasElement | undefined
export function paintedWater(portrait: boolean) {
  if (!waterCanvas || waterCanvas.width !== (portrait ? 900 : 1600))
    waterCanvas = portrait ? paintWith(water, 4242, 900, 1200) : paintWith(water, 4242, 1600, 1000)
  return waterCanvas
}

const sources = new Map<string, HTMLCanvasElement>()
/** Painted once per art, orientation and layer, then shared by every mount. */
export function paintedSource(name: ArtName, portrait: boolean, layer = 0) {
  const key = `${name}:${portrait}:${layer}`
  let canvas = sources.get(key)
  if (!canvas) {
    canvas = portrait
      ? paintRecipe(name, 900, 1200, layer)
      : paintRecipe(name, 1600, 1000, layer)
    sources.set(key, canvas)
  }
  return canvas
}

const stills = new Map<string, Promise<string>>()
function paintedStill(name: ArtName, portrait: boolean, layer: number) {
  const key = `${name}:${portrait}:${layer}`
  let url = stills.get(key)
  if (!url) {
    url = new Promise<string>((resolve, reject) =>
      paintedSource(name, portrait, layer).toBlob(
        (blob) => (blob ? resolve(URL.createObjectURL(blob)) : reject(new Error('toBlob failed'))),
        'image/webp',
        0.9,
      ),
    )
    stills.set(key, url)
  }
  return url
}

/** Every layer of a painting as still images, in layer order. */
export function paintedStills(name: ArtName, portrait: boolean) {
  return Promise.all(
    Array.from({ length: layerCount(name) }, (_, i) => paintedStill(name, portrait, i)),
  )
}

/**
 * A pale ground brushed onto a painting so copy can sit on it. Strokes fill
 * the block inset `inset` from the canvas edge and thin out past it into
 * short, wandering strokes, so the canvas edge itself is never reached.
 * `unit` is the device pixel ratio.
 */
export function paintWash(canvas: HTMLCanvasElement, colors: string[], unit = 1, inset = 0, seed = 7) {
  const ctx = canvas.getContext('2d')!,
    w = canvas.width,
    h = canvas.height
  ctx.clearRect(0, 0, w, h)
  const r = rng(seed),
    round = 60 * unit,
    area = (w * h) / (900 * 860 * unit * unit)
  const layers = [
    { width: 60, length: 170, count: 300, alpha: 0.42 },
    { width: 34, length: 100, count: 900, alpha: 0.56 },
    { width: 18, length: 52, count: 1200, alpha: 0.66 },
  ]
  for (const layer of layers)
    for (let i = 0; i < Math.round(layer.count * area); i++) {
      const x = r() * w,
        y = r() * h
      // signed distance to the copy block (a rounded rectangle), with an uneven rim
      const qx = x - Math.min(Math.max(x, inset + round), w - inset - round),
        qy = y - Math.min(Math.max(y, inset + round), h - inset - round)
      const turn = Math.atan2(y - h / 2, x - w / 2)
      const d = Math.hypot(qx, qy) - round + (Math.sin(turn * 5 + 1.3) * 16 + Math.sin(turn * 11) * 8) * unit
      if (r() > 1 - smooth(-12 * unit, inset * 0.55, d)) continue
      const rim = smooth(-30 * unit, inset * 0.5, d)
      stroke(
        ctx,
        x,
        y,
        (r() - 0.5) * (0.35 + rim * 1.2),
        layer.length * unit * (0.6 + r() * 0.8) * (1 - rim * 0.55),
        layer.width * unit * (0.7 + r() * 0.6) * (1 - rim * 0.35),
        jitter(pick(colors, r), r, 0.6),
        layer.alpha,
        r,
      )
    }
}
