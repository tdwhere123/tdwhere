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

const recipes: Record<ArtName, Recipe> = {
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

const passes = [
  { width: 80, length: 190, count: 380, alpha: 0.4, jitter: 0.5 },
  { width: 40, length: 105, count: 1500, alpha: 0.75, jitter: 0.9 },
  { width: 22, length: 58, count: 2600, alpha: 0.88, jitter: 1.1 },
]

export function paintRecipe(name: ArtName, width: number, height: number) {
  const recipe = recipes[name]
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  const r = rng(name.length * 7919 + width)
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

const sources = new Map<string, HTMLCanvasElement>()
/** Painted once per art and orientation, then shared by every mount. */
export function paintedSource(name: ArtName, portrait: boolean) {
  const key = `${name}:${portrait}`
  let canvas = sources.get(key)
  if (!canvas) {
    canvas = portrait ? paintRecipe(name, 900, 1200) : paintRecipe(name, 1600, 1000)
    sources.set(key, canvas)
  }
  return canvas
}

const stills = new Map<string, Promise<string>>()
export function paintedStill(name: ArtName, portrait: boolean) {
  const key = `${name}:${portrait}`
  let url = stills.get(key)
  if (!url) {
    url = new Promise<string>((resolve, reject) =>
      paintedSource(name, portrait).toBlob(
        (blob) => (blob ? resolve(URL.createObjectURL(blob)) : reject(new Error('toBlob failed'))),
        'image/webp',
        0.9,
      ),
    )
    stills.set(key, url)
  }
  return url
}
